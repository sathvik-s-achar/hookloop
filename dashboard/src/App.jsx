import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Stats from './Stats'; 
import Login from './Login';
import { jwtDecode } from "jwt-decode";

function App() {
  // AUTH STATE
  const [token, setToken] = useState(null); // If null, user is NOT logged in
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

  // 1. FETCH DATA (Only runs if we have a token)
  const fetchWebhooks = async () => {
      if (!token) return; 

      try {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch My Webhooks (Already Correct)
        const res = await axios.get('http://localhost:4000/webhooks', authHeader);
        setWebhooks(res.data);
        
        // 2. Fetch My Stats (FIXED: Added authHeader)
        const statsRes = await axios.get('http://localhost:4000/stats', authHeader); 
        setStats(statsRes.data);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

  useEffect(() => {
    if (token) {
      fetchWebhooks();
      const interval = setInterval(fetchWebhooks, 2000);
      return () => clearInterval(interval);
    }
  }, [token]); // Only run when 'token' changes

  // 2. HELPER FUNCTIONS
  const handleQuickReplay = async (id) => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:4000/replay/${id}`, { targetUrl: 'http://localhost:3000/events' });
      alert(`✅ Quick Replay Sent!`);
    } catch (error) { alert('❌ Replay Failed.'); }
    setLoading(false);
  };

  const openEditModal = (hook) => {
    setSelectedHook(hook);
    setEditBody(JSON.stringify(hook.body, null, 2));
    setIsModalOpen(true);
  };

  const handleFireEditedReplay = async () => {
    setLoading(true);
    try {
      let parsedBody = JSON.parse(editBody);
      await axios.post(`http://localhost:4000/replay/${selectedHook.id}`, {
        targetUrl: 'http://localhost:3000/events',
        customBody: parsedBody
      });
      alert(`✅ Edited Replay Sent!`);
      setIsModalOpen(false);
    } catch (error) { alert('❌ Replay Failed or Invalid JSON.'); }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setWebhooks([]);
  };

  // 3. SEARCH LOGIC
  const filteredWebhooks = webhooks.filter((hook) => {
    const searchLower = searchTerm.toLowerCase();
    const bodyString = JSON.stringify(hook.body).toLowerCase();
    return (
      hook.method.toLowerCase().includes(searchLower) ||
      hook.id.toString().includes(searchLower) ||
      bodyString.includes(searchLower)
    );
  });

  // 4. MAIN RENDER
  // IF NO TOKEN -> SHOW LOGIN SCREEN
  if (!token) {
  return <Login onLogin={(t) => {
    setToken(t);
    // NEW: Extract User ID from the token immediately
    const decoded = jwtDecode(t);
    setUserId(decoded.id);
  }} />;
}

  // IF TOKEN EXISTS -> SHOW DASHBOARD
  return (
    <div className="container">
      <div className="header-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>HookLoop Dashboard</h1>
        <button onClick={handleLogout} className="btn-edit" style={{background: '#da3633', border: 'none'}}>Logout</button>
      </div>
      {/* YOUR UNIQUE URL SECTION */}
      <div className="url-box" style={{
        background: '#161b22', 
        padding: '15px', 
        borderRadius: '8px', 
        border: '1px solid #30363d',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{margin: '0 0 5px 0', fontSize: '1rem', color: '#8b949e'}}>🔗 Your Unique Webhook URL</h3>
          <code style={{color: '#58a6ff', fontSize: '1.1rem'}}>
            http://localhost:4000/webhook/{userId}
          </code>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`http://localhost:4000/webhook/${userId}`)}
          className="btn-edit"
          style={{background: '#238636', border: 'none'}}
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
                <td><pre>{JSON.stringify(hook.body, null, 2)}</pre></td>
                <td>{new Date(hook.timestamp + 'Z').toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    {/* Replay Button with TEXT */}
                    <button 
                      className="btn-replay" 
                      onClick={() => handleQuickReplay(hook.id)} 
                      disabled={loading}
                    >
                      Replay
                    </button>

                    {/* Edit Button with TEXT */}
                    <button 
                      className="btn-edit" 
                      onClick={() => openEditModal(hook)}
                    >
                      Edit
                    </button>
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