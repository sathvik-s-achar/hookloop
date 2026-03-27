import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JsonView from '../JsonView'; // Reusing your awesome JSON formatter!

export default function MockServer() {
  const [mocks, setMocks] = useState([]);
  const [token, setToken] = useState(''); // Temporary auth handling for this tool
  
  // Form State
  const [path, setPath] = useState('/api/test');
  const [method, setMethod] = useState('GET');
  const [statusCode, setStatusCode] = useState(200);
  const [responseBody, setResponseBody] = useState('{\n  "status": "success",\n  "message": "Hello from DevForge!"\n}');
  const [loading, setLoading] = useState(false);

  // Fetch existing mocks
  const fetchMocks = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:4000/api/mocks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMocks(res.data);
    } catch (err) {
      console.error("Failed to fetch mocks", err);
    }
  };

  useEffect(() => {
    fetchMocks();
  }, [token]);

  // Create a new mock
  const handleCreateMock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate JSON before sending
      JSON.parse(responseBody); 

      await axios.post('http://localhost:4000/api/mocks', 
        { path, method, status_code: statusCode, response_body: responseBody },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('✅ Mock API Created Successfully!');
      fetchMocks(); // Refresh the list
    } catch (err) {
      alert('❌ Failed to create mock. Make sure your JSON is perfectly formatted!');
    }
    setLoading(false);
  };

  // Delete a mock
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/mocks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMocks();
    } catch (err) {
      alert('Failed to delete mock');
    }
  };

  return (
    <div style={{ padding: '40px', color: '#f3f4f6', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>🎭 Dynamic Mock Server</h2>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Instantly generate fake API endpoints for frontend testing.</p>
        </div>
        
        {/* Temporary Auth Input so you don't have to refactor App.jsx right now */}
        <input 
          type="text" 
          placeholder="Paste JWT Token here to connect..." 
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ padding: '10px', width: '300px', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#58a6ff', borderRadius: '6px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* ================= LEFT SIDE: THE CREATOR WORKBENCH ================= */}
        <div style={{ flex: '1', backgroundColor: '#161b22', padding: '25px', borderRadius: '12px', border: '1px solid #30363d', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '15px', marginBottom: '20px', color: '#58a6ff' }}>🛠️ Endpoint Designer</h3>
          
          <form onSubmit={handleCreateMock}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#8b949e', fontSize: '0.9rem' }}>HTTP Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#0B0F19', color: '#fff', border: '1px solid #30363d', borderRadius: '6px' }}>
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
              </div>
              
              <div style={{ flex: '3' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#8b949e', fontSize: '0.9rem' }}>Route Path</label>
                <input type="text" value={path} onChange={(e) => setPath(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#0B0F19', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', fontFamily: 'monospace' }} />
              </div>

              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#8b949e', fontSize: '0.9rem' }}>Status Code</label>
                <input type="number" value={statusCode} onChange={(e) => setStatusCode(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#0B0F19', color: '#58a6ff', border: '1px solid #30363d', borderRadius: '6px', fontWeight: 'bold' }} />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: '#8b949e', fontSize: '0.9rem' }}>JSON Response Body</label>
            <textarea 
              value={responseBody} 
              onChange={(e) => setResponseBody(e.target.value)}
              spellCheck="false"
              style={{ width: '100%', height: '250px', backgroundColor: '#0B0F19', color: '#e5c07b', padding: '15px', border: '1px solid #30363d', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '20px', resize: 'vertical' }} 
            />

            <button type="submit" disabled={loading || !token} style={{ width: '100%', padding: '14px', backgroundColor: token ? '#238636' : '#30363d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: token ? 'pointer' : 'not-allowed', transition: '0.2s' }}>
              {loading ? 'Deploying...' : '🚀 Deploy Mock Endpoint'}
            </button>
          </form>
        </div>

        {/* ================= RIGHT SIDE: ACTIVE MOCKS DASHBOARD ================= */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {mocks.length === 0 ? (
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161b22', border: '2px dashed #30363d', borderRadius: '12px', color: '#8b949e' }}>
              <p>No active mocks. Create one to get started!</p>
            </div>
          ) : (
            mocks.map(mock => (
              <div key={mock.id} style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ backgroundColor: mock.method === 'GET' ? '#1f6feb' : '#238636', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {mock.method}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#c9d1d9' }}>{mock.path}</span>
                    <span style={{ color: mock.status_code >= 400 ? '#f85149' : '#3fb950', fontWeight: 'bold' }}>{mock.status_code}</span>
                  </div>
                  
                  {/* Shows a tiny preview of their JSON */}
                  <div style={{ fontSize: '0.8rem', color: '#8b949e', backgroundColor: '#0B0F19', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', maxWidth: '400px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {mock.response_body.substring(0, 60)}...
                  </div>
                </div>

                <button onClick={() => handleDelete(mock.id)} style={{ backgroundColor: 'transparent', color: '#f85149', border: '1px solid #f85149', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                  Delete
                </button>

              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}