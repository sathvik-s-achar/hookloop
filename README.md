# 🪝 HookLoop - Advanced Real-Time Webhook Debugger

## 📖 Project Overview
HookLoop is a self-hosted, real-time developer tool designed for capturing, inspecting, modifying, and replaying HTTP webhooks. Built as a secure alternative to public cloud loggers (like webhook.site) and heavy API platforms (like Postman), HookLoop focuses on **local development speed** and **data privacy**.

It acts as a "Black Box Recorder" for backend developers to debug third-party API callbacks (e.g., Stripe payments, GitHub events, Twilio SMS) safely on their local machines.

## ✨ Core Features
1. **Real-Time Event Capture:** Uses WebSockets to push incoming HTTP requests instantly to the React dashboard without page reloads.
2. **Automated PII Redaction:** An interceptor middleware scans incoming JSON payloads and automatically masks Personally Identifiable Information (PII) like `password`, `credit_card`, and `secret_key` *before* it touches the database.
3. **One-Click Replay:** Instantly resend an exact historical payload to the local backend to reproduce bugs without needing to trigger the external service again.
4. **Edit & Fire (Payload Mutation):** Modify a captured webhook's JSON body on the fly via the UI and dispatch it to test edge cases.
5. **Live Analytics Dashboard:**
   - **Traffic Volume:** Line chart displaying hourly webhook traffic over the last 24 hours.
   - **Method Distribution:** Pie chart breaking down HTTP methods (POST, GET, PUT, etc.).
   - *Note: Charts synchronize asynchronously via WebSocket triggers.*
6. **Local Persistence:** Data is stored locally in an SQLite database, ensuring strict GDPR compliance and zero third-party cloud leakage.

## 🏗️ System Architecture
The application follows a modern decoupled Client-Server architecture:

* **External Trigger:** Third-party service (GitHub/Stripe) sends POST request.
* **The Tunnel:** `ngrok` forwards public traffic to `localhost:4000`.
* **The API (Backend):** Fastify server receives the request, sanitizes PII, and writes to SQLite.
* **The Event Bus:** Socket.io emits a `new_webhook` event to the connected client.
* **The Client (Frontend):** React catches the event, updates the UI table instantly, and triggers a background fetch to update the Chart.js analytics.

## 💻 Tech Stack
* **Frontend:** React.js, Vite, Tailwind CSS, Chart.js, Socket.io-client, React-Syntax-Highlighter.
* **Backend:** Node.js, Fastify (chosen for high throughput), Socket.io.
* **Database:** SQLite3 (using `better-sqlite3` for synchronous, high-performance local reads/writes).
* **Network / DevOps:** Ngrok (for local tunneling).

## 🗄️ Database Schema
The system uses a lightweight SQLite database with a primary `requests` table:
\`\`\`sql
CREATE TABLE requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,       -- Associates request with a specific tunnel/user
    method TEXT NOT NULL,        -- HTTP Method (e.g., POST, GET)
    headers TEXT NOT NULL,       -- Stringified JSON of request headers
    body TEXT,                   -- Stringified JSON of the payload (Redacted)
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 🚀 Installation & Setup

### Prerequisites
* Node.js (v18+)
* Ngrok account

### 1. Start the Backend
\`\`\`bash
cd hookloop
npm install
node server.js
# Runs on http://localhost:4000
\`\`\`

### 2. Start the Frontend
\`\`\`bash
cd hookloop/dashboard
npm install
npm run dev
# Runs on http://localhost:5173
\`\`\`

### 3. Expose to the Internet
\`\`\`bash
ngrok http 4000
# Generates public URL: https://<your-id>.ngrok-free.app
# Webhook Endpoint: https://<your-id>.ngrok-free.app/webhook/1
\`\`\`
