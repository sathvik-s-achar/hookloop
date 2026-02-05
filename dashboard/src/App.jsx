import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 

function App() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Webhooks from your Node Backend
  const fetchWebhooks = async () => {
    try {
      const res = await axios.get('http://localhost:4000/webhooks');
      setWebhooks(res.data);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
    }
  };

  // 2. Replay Function
  const handleReplay = async (id) => {
    setLoading(true);
    try {
      // For demo, we replay to the Dummy Client (Port 3000)
      await axios.post(`http://localhost:4000/replay/${id}`, {
        targetUrl: 'http://localhost:3000/events'
      });
      alert(`✅ Replay of ID ${id} Successful! Check your Client Terminal.`);
    } catch (error) {
      alert('❌ Replay Failed. Is the backend running?');
      console.error(error);
    }
    setLoading(false);
  };

  // Load data when page opens and refresh every 2 seconds
  useEffect(() => {
    fetchWebhooks();
    const interval = setInterval(fetchWebhooks, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>HookLoop Dashboard</h1>
      <p>Monitoring for webhooks on <code>localhost:4000</code></p>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#01010171' }}>
              <th>ID</th>
              <th>Method</th>
              <th>Body (Payload)</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No webhooks received yet. Send one via Postman!</td>
              </tr>
            ) : (
              webhooks.map((hook) => (
                <tr key={hook.id}>
                  <td>#{hook.id}</td>
                  <td>{hook.method}</td>
                  <td>
                    <pre style={{ background: '#060505', padding: '10px', borderRadius: '5px' }}>
                      {JSON.stringify(hook.body, null, 2)}
                    </pre>
                  </td>
                  <td>{new Date(hook.timestamp).toLocaleTimeString()}</td>
                  <td>
                    <button 
                      onClick={() => handleReplay(hook.id)}
                      disabled={loading}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '8px 16px', 
                        background: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {loading ? 'Sending...' : '🔄 Replay'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;