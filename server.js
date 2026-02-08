// server.js - THE FINAL VERSION

// 1. IMPORTS
const fastify = require('fastify')({ logger: true });
const Database = require('better-sqlite3');
const axios = require('axios');
const cors = require('@fastify/cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Server } = require("socket.io");

// 2. CONFIGURATION
const db = new Database('hookloop.db'); // Initialize Database
const SECRET_KEY = "super_secret_key_123"; // Change this in production

// Enable CORS so Frontend can talk to Backend
fastify.register(cors, { origin: true });

// 3. SECURITY UTILITY (PII Redaction)
function redactPII(obj) {
  const sensitiveKeys = ['password', 'credit_card', 'card_number', 'secret', 'token', 'ssn'];
  const newObj = JSON.parse(JSON.stringify(obj));

  for (const key in newObj) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      newObj[key] = '***_REDACTED_***'; 
    } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
      newObj[key] = redactPII(newObj[key]);
    }
  }
  return newObj;
}

// 4. DATABASE SETUP (Run once on start)
const dbSetup = db.transaction(() => {
  // Create USERS table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `).run();

  // Create REQUESTS table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, 
      method TEXT,
      headers TEXT,
      body TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `).run();
});
dbSetup();

// 5. AUTHENTICATION ROUTES (Login & Register)

// REGISTER
fastify.post('/register', async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) return reply.code(400).send({ error: 'Missing email or password' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    stmt.run(email, hashedPassword);
    return { message: 'User created successfully!' };
  } catch (err) {
    return reply.code(400).send({ error: 'Email already exists' });
  }
});

// LOGIN
fastify.post('/login', async (req, reply) => {
  const { email, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return reply.code(400).send({ error: 'Invalid email or password' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return reply.code(400).send({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
  return { token, email: user.email };
});

// 6. CORE ROUTES (Webhooks, Stats, Replay)

// INGEST WEBHOOK (Public URL - e.g., Stripe sends here)
// NEW: Unique URL for each user
// Example: POST http://localhost:4000/webhook/5
fastify.all('/webhook/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { method, body, headers } = request;

  console.log(`📩 Webhook received for User ${userId}!`);
  const safeBody = redactPII(body || {}); 

  // 1. Save to DB
  const stmt = db.prepare('INSERT INTO requests (user_id, method, headers, body) VALUES (?, ?, ?, ?)');
  const result = stmt.run(userId, method, JSON.stringify(headers), JSON.stringify(safeBody));

  // 2. ⚡ REAL-TIME ALERT (Add this part!)
  if (fastify.io) {
    fastify.io.to(`user_${userId}`).emit('new_webhook', {
      id: result.lastInsertRowid, // The ID of the new row
      method,
      headers,
      body: safeBody,
      // ✅ This matches SQLite's default string format
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
  }

  return { status: 'received', for_user: userId };
});

// GET WEBHOOKS (Protected - Needs Login)
// NEW: Only get webhooks for the logged-in user
fastify.get('/webhooks', async (req, reply) => {
  // 1. Verify Token
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id; // We know who is asking now

    // 2. Fetch ONLY this user's data
    const logs = db.prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(userId);
    
    // 3. Return it
    return logs.map(log => ({
      ...log,
      headers: JSON.parse(log.headers),
      body: JSON.parse(log.body)
    }));

  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

// GET STATS (Protected & Personalized)
fastify.get('/stats', async (req, reply) => {
  try {
    // 1. Verify who is asking
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // 2. Run Queries Filtered by User ID
    const total = db.prepare('SELECT count(*) as count FROM requests WHERE user_id = ?').get(userId).count;
    
    const methods = db.prepare('SELECT method, count(*) as count FROM requests WHERE user_id = ? GROUP BY method').all(userId);
    
    const timeline = db.prepare(`
      SELECT strftime('%H:%M', timestamp, 'localtime') as time, count(*) as count 
      FROM requests 
      WHERE user_id = ?
      GROUP BY time 
      ORDER BY id DESC LIMIT 10
    `).all(userId).reverse();

    return { total, methods, timeline };

  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

// REPLAY WEBHOOK
fastify.post('/replay/:id', async (request, reply) => {
  const { id } = request.params;
  const { targetUrl, customBody } = request.body;

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!row) return reply.code(404).send({ error: 'Webhook ID not found' });

  try {
    const payloadToSend = customBody ? customBody : JSON.parse(row.body);
    const response = await axios.post(targetUrl, payloadToSend, {
      headers: { 'Content-Type': 'application/json' }
    });
    return { status: 'replayed', targetStatus: response.status };
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
});

// 7. START SERVER WITH SOCKET.IO
const start = async () => {
  try {
    // Start Fastify normally
    await fastify.listen({ port: 4000 });
    console.log('Server running on http://localhost:4000');

    // Attach Socket.io to the Fastify server
    const io = new Server(fastify.server, {
      cors: {
        origin: "*", // Allow React to connect from anywhere
        methods: ["GET", "POST"]
      }
    });

    // Make 'io' accessible globally (so we can use it in routes)
    fastify.io = io;

    // Listen for new connections
    io.on('connection', (socket) => {
      console.log('⚡ A client connected');

      // Create a "Room" for each user (Security)
      socket.on('join_room', (userId) => {
        console.log(`🔒 User ${userId} joined their private room`);
        socket.join(`user_${userId}`);
      });
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();