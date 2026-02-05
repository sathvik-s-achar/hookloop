// server.js
const fastify = require('fastify')({ logger: true });
const Database = require('better-sqlite3');

// 1. CONNECT TO DATABASE
// This creates a file named 'hookloop.db' in your folder
const db = new Database('hookloop.db');

// 2. CREATE TABLE (The Schema)
// We store headers and body as TEXT (JSON strings)
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT,
    headers TEXT,
    body TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepare the "Insert" statement (for speed and safety)
const insertStmt = db.prepare(`
  INSERT INTO requests (method, headers, body) 
  VALUES (?, ?, ?)
`);

fastify.get('/', async () => {
  return { status: 'HookLoop Database is Active!' }
});

// THE INGESTION ROUTE
fastify.post('/webhook', async (request, reply) => {
  const method = request.method;
  const headers = JSON.stringify(request.headers); // Convert object to string
  const body = JSON.stringify(request.body);       // Convert object to string

  // 3. SAVE TO DATABASE
  const info = insertStmt.run(method, headers, body);
  
  console.log(`✅ Saved Webhook to DB! ID: ${info.lastInsertRowid}`);

  return { status: 'received', id: info.lastInsertRowid }
});

// Start Server
const start = async () => {
  try {
    await fastify.listen({ port: 4000 })
    console.log('Server running on http://localhost:4000');
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// ... existing code ...
const axios = require('axios'); // Import axios

// THE REPLAY ROUTE
// We call this like: POST /replay/1  (where 1 is the ID)
fastify.post('/replay/:id', async (request, reply) => {
  const { id } = request.params;
  const { targetUrl } = request.body; // We will tell it WHERE to send

  // 1. Fetch from Database
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  
  if (!row) {
    return reply.code(404).send({ error: 'Webhook ID not found' });
  }

  console.log(`🔄 Replaying Webhook #${id} to ${targetUrl}...`);

  try {
    // 2. Send it again (The "Forwarding" Logic)
    // We parse the stored JSON strings back into objects
    const response = await axios.post(targetUrl, JSON.parse(row.body), {
      headers: {
        'Content-Type': 'application/json',
        // In a real app, we would selectively forward headers here
      }
    });

    console.log(`✅ Replay Success! Target responded with: ${response.status}`);
    return { status: 'replayed', targetStatus: response.status };

  } catch (error) {
    console.log(`❌ Replay Failed: ${error.message}`);
    return reply.code(500).send({ error: error.message });
  }
});

// server.js updates

// Enable CORS so the Frontend (Port 5173) can talk to Backend (Port 4000)
fastify.register(require('@fastify/cors'), { 
  origin: true // Allow all origins for dev simplicity
});

// NEW ROUTE: Get all webhooks for the UI
fastify.get('/webhooks', async (request, reply) => {
  // Get the last 50 webhooks, newest first
  const logs = db.prepare('SELECT * FROM requests ORDER BY id DESC LIMIT 50').all();
  
  // Parse the JSON strings back into objects for the frontend
  return logs.map(log => ({
    ...log,
    headers: JSON.parse(log.headers),
    body: JSON.parse(log.body)
  }));
});

// ... start function ...
start();