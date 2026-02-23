// dashboard/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode"; // Fixed import
import { io } from "socket.io-client";
import './App.css'; 
import Stats from './Stats'; 
import Login from './Login'; 
import JsonView from './JsonView'; // 👈 NEW IMPORT

function App() {
  // AUTH STATE
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  // APP DATA STATE
  const [webhooks, setWebhooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHook, setSelectedHook] = useState(null);
  const [editBody, setEditBody] = useState('');

  // 1. FETCH DATA (Initial Load)
  const fetchWebhooks = async () => {
    if (!token) return;
    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:4000/webhooks', authHeader);
      setWebhooks(res.data);
      
      const statsRes = await axios.get('http://localhost:4000/stats', authHeader);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // 2. REAL-TIME SOCKET CONNECTION
  useEffect(() => {
    if (!token || !userId) return;

    // A. Load initial data when page opens
    fetchWebhooks(); 
    // (Make sure fetchWebhooks sets BOTH webhooks AND stats, 
    // or call fetchStats() here if you separated them)

    // B. Connect to Socket
    const socket = io("http://localhost:4000");
    socket.emit("join_room", userId);

    // C. Listen for new webhooks
    socket.on("new_webhook", (newHook) => {
      console.log("⚡ Real-time update received!");
      
      // 1. Update the List (Instant Visual)
      setWebhooks((prev) => [newHook, ...prev]);
      
      // 2. Update the Charts (The Fix!) 📊
      // We re-fetch the stats from the server so the charts redraw automatically
      axios.get('http://localhost:4000/stats', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      .then(res => {
        console.log("📈 Stats updated:", res.data);
        setStats(res.data);
      })
      .catch(err => console.error("Stats update failed", err));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, userId]);

  const handleClearHistory = async () => {
    // 1. Ask for confirmation so you don't click it by accident!
    const isConfirmed = window.confirm("🚨 Are you sure you want to delete all webhook history? This cannot be undone.");
    
    if (!isConfirmed) return;

    try {
      // 2. Tell the backend to delete everything
      await axios.delete('http://localhost:4000/webhooks'); // Add headers here if using JWT tokens!
      
      // 3. Clear the UI instantly
      setWebhooks([]); 
      
      // 4. (Optional) Re-fetch stats to reset the charts to zero
      // fetchStats(); 
      
      alert("🧹 Dashboard is completely clean!");
    } catch (error) {
      console.error("Failed to clear history", error);
      alert("❌ Could not clear history.");
    }
  };

  // 3. HELPER FUNCTIONS
// 1. The 1-Click "Quick Replay" Button
  const handleQuickReplay = async (id) => {
    setLoading(true);
    try {
      // Changed /events to /receive to match our Demo App
      await axios.post(`http://localhost:4000/replay/${id}`, { 
        targetUrl: 'http://localhost:3000/receive' 
      });
      alert(`✅ Quick Replay Sent to Target App!`);
    } catch (error) { 
      alert('❌ Replay Failed.'); 
    }
    setLoading(false);
  };

  // 2. Opens the Edit UI (No changes needed here)
  const openEditModal = (hook) => {
    setSelectedHook(hook);
    setEditBody(JSON.stringify(hook.body, null, 2));
    setIsModalOpen(true);
  };

  // 3. The "Fire Edited JSON" Button inside the Modal
  const handleFireEditedReplay = async () => {
    setLoading(true);
    try {
      let parsedBody = JSON.parse(editBody);
      // Changed /events to /receive here too
      await axios.post(`http://localhost:4000/replay/${selectedHook.id}`, {
        targetUrl: 'http://localhost:3000/receive',
        customBody: parsedBody
      });
      alert(`✅ Edited Replay Sent to Target App!`);
      setIsModalOpen(false);
    } catch (error) { 
      alert('❌ Replay Failed or Invalid JSON.'); 
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setWebhooks([]);
  };

  // 4. SEARCH LOGIC
  const filteredWebhooks = webhooks.filter((hook) => {
    const searchLower = searchTerm.toLowerCase();
    const bodyString = JSON.stringify(hook.body).toLowerCase();
    return (
      hook.method.toLowerCase().includes(searchLower) ||
      hook.id.toString().includes(searchLower) ||
      bodyString.includes(searchLower)
    );
  });

  // 5. LOGIN SCREEN
  if (!token) {
    return <Login onLogin={(t) => {
      setToken(t);
      const decoded = jwtDecode(t);
      setUserId(decoded.id);
    }} />;
  }

  // 6. DASHBOARD SCREEN
  return (
    <div className="container">
      <div className="header-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {/* <h1>HookLoop Dashboard</h1> */}
        <div className="flex justify-between items-center mb-7">
          <h1 className="text-2xl font-bold">🪝 HookLoop Dashboard</h1>
          
          {/* The Clear History Button */}
          <button 
            onClick={handleClearHistory}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow"
          >
            🗑️ Clear History
          </button>
        </div>
        <button onClick={handleLogout} className="btn-edit" style={{background: '#da3633', border: 'none'}}>Logout</button>
      </div>

      {/* URL BOX */}
      <div className="url-box" style={{
        background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h3 style={{margin: '0 0 5px 0', fontSize: '1rem', color: '#8b949e'}}>🔗 Your Unique Webhook URL</h3>
          <code style={{color: '#58a6ff', fontSize: '1.1rem'}}>http://localhost:4000/webhook/{userId}</code>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`http://localhost:4000/webhook/${userId}`)}
          className="btn-replay" style={{background: '#238636', border: 'none'}}
        >
          Copy URL
        </button>
      </div>

      <Stats stats={stats} />
      
      <div className="search-bar-container">
        <input 
          type="text" 
          placeholder="🔍 Search webhooks..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-count">{filteredWebhooks.length} results</span>
      </div>
      
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Method</th>
              <th>Body (Payload)</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredWebhooks.map((hook) => (
              <tr key={hook.id}>
                <td>#{hook.id}</td>
                <td><span className={`badge ${hook.method}`}>{hook.method}</span></td>
                
                {/* 🌈 NEW: PRETTY JSON COMPONENT */}
                <td style={{ maxWidth: '400px' }}>
                  <JsonView data={hook.body} />
                </td>

                {/* 🕒 FIXED: TIMESTAMP HANDLING */}
                <td>
                  {new Date(
                    hook.timestamp.includes('Z') 
                      ? hook.timestamp 
                      : hook.timestamp + 'Z'
                  ).toLocaleString()}
                </td>
                
                <td>
                  <div className="action-buttons">
                    <button className="btn-replay" onClick={() => handleQuickReplay(hook.id)} disabled={loading}>Replay</button>
                    <button className="btn-edit" onClick={() => openEditModal(hook)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredWebhooks.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No webhooks found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Payload</h2>
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={10}/>
            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleFireEditedReplay} className="btn-fire" disabled={loading}>🚀 Fire Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;