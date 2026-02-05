import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 
import Stats from './Stats'; // Ensure this file exists in the same folder

function App() {
  // ✅ CORRECT: Hooks are called INSIDE the component
  const [webhooks, setWebhooks] = useState([]);
  const [stats, setStats] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHook, setSelectedHook] = useState(null);
  const [editBody, setEditBody] = useState('');

  // ✅ CORRECT: Functions using state are defined INSIDE the component
  const fetchWebhooks = async () => {
    try {
      const res = await axios.get('http://localhost:4000/webhooks');
      setWebhooks(res.data);

      const statsRes = await axios.get('http://localhost:4000/stats');
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Function A: Quick Replay
  const handleQuickReplay = async (id) => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:4000/replay/${id}`, {
        targetUrl: 'http://localhost:3000/events'
      });
      alert(`✅ Quick Replay (ID ${id}) Sent!`);
    } catch (error) {
      alert('❌ Replay Failed.');
    }
    setLoading(false);
  };

  // Function B: Open Edit Modal
  const openEditModal = (hook) => {
    setSelectedHook(hook);
    setEditBody(JSON.stringify(hook.body, null, 2));
    setIsModalOpen(true);
  };

  // Function C: Fire Edited Replay
  const handleFireEditedReplay = async () => {
    setLoading(true);
    try {
      let parsedBody;
      try {
        parsedBody = JSON.parse(editBody);
      } catch (e) {
        alert("❌ Invalid JSON!");
        setLoading(false);
        return;
      }

      await axios.post(`http://localhost:4000/replay/${selectedHook.id}`, {
        targetUrl: 'http://localhost:3000/events',
        customBody: parsedBody
      });
      
      alert(`✅ Edited Replay Sent!`);
      setIsModalOpen(false);
    } catch (error) {
      alert('❌ Replay Failed.');
    }
    setLoading(false);
  };

  // Load data on start
  useEffect(() => {
    fetchWebhooks();
    const interval = setInterval(fetchWebhooks, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1>HookLoop Dashboard</h1>
      
      {/* Analytics Section */}
      <Stats stats={stats} />
      
      <p>Monitoring for webhooks on <code>localhost:4000</code></p>
      
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
            {webhooks.map((hook) => (
              <tr key={hook.id}>
                <td>#{hook.id}</td>
                <td>{hook.method}</td>
                <td>
                  <pre>{JSON.stringify(hook.body, null, 2)}</pre>
                </td>
                <td>{new Date(hook.timestamp).toLocaleTimeString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-replay"
                      onClick={() => handleQuickReplay(hook.id)}
                      disabled={loading}
                    >
                      🔄 Replay
                    </button>

                    <button 
                      className="btn-edit"
                      onClick={() => openEditModal(hook)}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Payload</h2>
            <textarea 
              value={editBody} 
              onChange={(e) => setEditBody(e.target.value)}
              rows={10}
            />
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