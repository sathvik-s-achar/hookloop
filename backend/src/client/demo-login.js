const http = require('http');

let activeBrowsers = [];

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Cool App - Login</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 350px; text-align: center; }
        input { width: 90%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; }
        button { width: 100%; padding: 10px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .hidden { display: none; }
        .success-box { color: #10b981; font-size: 20px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="card" id="login-section">
        <h2>Login to App</h2>
        <p style="color: #666; font-size: 14px;">Step 1: Send webhook to HookLoop</p>
        <input type="email" id="email" placeholder="user@example.com" value="examiner@college.edu">
        <input type="password" id="password" placeholder="Password" value="Secret123">
        <button onclick="sendToHookLoop()">Log In (Send Webhook)</button>
        <p id="status" style="margin-top: 15px; font-size: 14px; color: #d97706;"></p>
    </div>

    <div class="card hidden" id="success-section">
        <div class="success-box">Successfully Logged In!</div>
        <p>Received the replay from HookLoop.</p>
        <pre id="user-data" style="text-align: left; background: #2d3748; color: #a3bffa; padding: 15px; font-size: 12px; border-radius: 5px; overflow-x: auto;"></pre>
    </div>

    <script>
        // 1. Send data to HookLoop
        async function sendToHookLoop() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            document.getElementById('status').innerText = "Sending to HookLoop... ⏳";

            try {
                await fetch('http://localhost:4000/webhook/1', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: "login_attempt", user: { email, password } })
                });
                document.getElementById('status').innerText = "Sent! Now go to HookLoop and click Replay.";
            } catch (err) {
                document.getElementById('status').innerText = "Error: Is HookLoop running on port 4000?";
            }
        }

        // 2. Listen for the Replay from our own server
        const sse = new EventSource('/listen-for-replay');
        
        sse.onmessage = (event) => {
            console.log("Got message from server!", event.data);
            const data = JSON.parse(event.data);
            
            // Hide login form, show Success screen!
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('success-section').classList.remove('hidden');
            document.getElementById('user-data').innerText = JSON.stringify(data, null, 2);
        };

        sse.onerror = () => {
            console.error("Lost connection to Target Server.");
        };
    </script>
</body>
</html>
`;

http.createServer((req, res) => {
    // Handle CORS 
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 1. Serve the UI Homepage (The Front Door)
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
    } 
    // 2. Keep a real-time connection open to the browser
    else if (req.method === 'GET' && req.url === '/listen-for-replay') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        activeBrowsers.push(res);
        console.log(`📡 Browser connected! Total viewing: ${activeBrowsers.length}`);
        
        req.on('close', () => {
            activeBrowsers = activeBrowsers.filter(client => client !== res);
            console.log(`❌ Browser disconnected.`);
        });
    }
    // 3. Receive the Replay from HookLoop (The Mailbox)
    else if (req.method === 'POST' && req.url === '/receive') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            console.log("📥 Received replay from HookLoop!");
            
            try {
                // Ensure the JSON is safely on one line before sending to the browser
                const safeJSON = JSON.stringify(JSON.parse(body));
                activeBrowsers.forEach(client => client.write(`data: ${safeJSON}\n\n`));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "Received replay!" }));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        });
    } else {
        res.writeHead(404); res.end();
    }
}).listen(3000, () => {
    console.log("🚀 Login App UI is running on http://localhost:3000");
    console.log("📥 Waiting for HookLoop replays at http://localhost:3000/receive");
});