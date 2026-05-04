import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Bell, User, Clock, Trash2, Server } from 'lucide-react';
import Antigravity from '../components/Antigravity';

export default function MockServer({ token }) {
  const [mocks, setMocks] = useState([]);
  const [path, setPath] = useState('/api/v1/users/auth/login');
  const [method, setMethod] = useState('POST');
  const [statusCode, setStatusCode] = useState(200);
  const [responseBody, setResponseBody] = useState('{\n  "status": "success",\n  "token": "ey...",\n  "user": {\n    "id": "uuid-7721",\n    "role": "admin"\n  }\n}');
  const [loading, setLoading] = useState(false);

  const fetchMocks = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:4000/api/mocks', { headers: { Authorization: `Bearer ${token}` }});
      setMocks(res.data);
    } catch (err) { console.error("Failed to fetch mocks", err); }
  };

  useEffect(() => { fetchMocks(); }, [token]);

  const handleCreateMock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      JSON.parse(responseBody); 
      await axios.post('http://localhost:4000/api/mocks', { path, method, status_code: statusCode, response_body: responseBody }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchMocks(); 
    } catch (err) { alert('? Invalid JSON formatting!'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/mocks/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      await fetchMocks();
    } catch (err) { alert('Failed to delete mock'); }
  };

  return (
    
<div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#0B0B0C' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#8B5CF6" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'rgba(11, 11, 12, 0.85)' }}>
        <style>{`
          * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
          .ms-layout { display: flex; flex-direction: column; width: 100%; height: 100vh; color: #E2E8F0; }
          
          .ms-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
          .ms-topbar-left { display: flex; align-items: center; gap: 24px; }
          .ms-logo { font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-right: 16px; }
          .ms-tab { color: #8B8B9B; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: color 0.2s; }
          .ms-tab:hover { color: #ffffff; }
          .ms-tab.active { color: #8B5CF6; border-bottom: 1px solid #8B5CF6; padding-bottom: 4px; }
          
          .ms-search-box { display: flex; align-items: center; background: rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 6px 12px; border: 1px solid rgba(255, 255, 255, 0.05); width: 250px; }
          .ms-search-input { background: transparent; border: none; color: #E2E8F0; outline: none; margin-left: 8px; font-size: 0.85rem; width: 100%; }
          .ms-search-input::placeholder { color: #6B7280; }
          
          .ms-workspace { flex: 1; padding: 32px; overflow-y: auto; max-width: 1400px; margin: 0 auto; width: 100%; }
          .ms-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
          .ms-title { font-size: 1.75rem; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }
          .ms-subtitle { color: #8B8B9B; font-size: 0.9rem; margin: 0; max-width: 600px; line-height: 1.5; }
          
          .ms-server-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2); color: #10B981; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
          
          .ms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; min-height: 500px; }
          @media (max-width: 1024px) { .ms-grid { grid-template-columns: 1fr; } }
          @media (max-width: 768px) {
            .ms-workspace { padding: 16px; }
            .ms-topbar { flex-direction: column; gap: 16px; align-items: flex-start; }
            .ms-header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .ms-search-box { width: 100%; }
          }
          @media (max-width: 1024px) { .ms-grid { grid-template-columns: 1fr; } }
          
          .ms-panel { background: transparent; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; }
          .ms-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .ms-panel-title { color: #C4B5FD; font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
          
          .ms-form-row { display: flex; gap: 16px; margin-bottom: 20px; }
          .ms-form-group { display: flex; flex-direction: column; gap: 8px; }
          .ms-label { color: #8B8B9B; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .ms-input { background: rgba(11, 11, 12, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); color: #E2E8F0; padding: 10px 12px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; outline: none; transition: border-color 0.2s; }
          .ms-input:focus { border-color: #8B5CF6; }
          .ms-textarea { height: 200px; resize: vertical; color: #A5D6FF; }
          
          .ms-btn { width: 100%; background: #8B5CF6; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; margin-top: 8px; }
          .ms-btn:hover { background: #7C3AED; }
          .ms-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          
          .ms-mock-item { display: flex; align-items: center; justify-content: space-between; background: rgba(11, 11, 12, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); padding: 12px 16px; border-radius: 6px; margin-bottom: 8px; }
          .ms-mock-method { font-size: 0.75rem; font-family: monospace; font-weight: bold; width: 50px; }
          .method-GET { color: #10B981; }
          .method-POST { color: #8B5CF6; }
          .method-PUT { color: #F59E0B; }
          .method-DELETE { color: #EF4444; }
          
          .ms-mock-path { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #E2E8F0; margin: 0 16px; }
          .ms-mock-status { color: #6B7280; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; padding-right: 16px; }
          .ms-mock-del { cursor: pointer; color: #6B7280; transition: color 0.2s; }
          .ms-mock-del:hover { color: #EF4444; }
          
          .ms-statusbar { height: 40px; background: rgba(18, 18, 20, 0.65); backdrop-filter: blur(10px); border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; font-size: 0.75rem; color: #000000; font-weight: 600; }
          .ms-status-left, .ms-status-right { display: flex; align-items: center; gap: 24px; }
          .dot-green { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
          
          @media (max-width: 768px) {
            .ms-statusbar { height: auto; padding: 12px; flex-direction: column; gap: 12px; }
            .ms-status-left, .ms-status-right { width: 100%; justify-content: space-between; }
            .ms-form-row { flex-direction: column; gap: 16px; }
          }
        `}</style>
        
        <div className="ms-layout">
          <div className="ms-topbar">
            <div className="ms-topbar-left">
              <div className="ms-logo">DevForge</div>
            </div>
            <div className="ms-topbar-right" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="ms-search-box">
                <Search size={14} color="#6B7280" />
                <input type="text" className="ms-search-input" placeholder="Search endpoints... cmd+k" />
              </div>
              <Bell size={18} color="#8B8B9B" />
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2E3039', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#E2E8F0" />
              </div>
            </div>
          </div>

          <div className="ms-workspace">
            <div className="ms-header">
              <div>
                <h1 className="ms-title">API Synthesizer</h1>
                <p className="ms-subtitle">Architect high-fidelity mock environments and validate requests with the kinetic engine.</p>
              </div>
              <div className="ms-server-badge">
                <div className="dot-green"></div>
                SERVER LOCAL:4000
              </div>
            </div>

            <div className="ms-grid">
              <div className="ms-panel">
                <div className="ms-panel-header">
                  <span className="ms-panel-title">MOCK DESIGNER</span>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>SYNTH_V1</span>
                </div>
                
                <form onSubmit={handleCreateMock}>
                  <div className="ms-form-row">
                    <div className="ms-form-group" style={{ flex: 1, minWidth: '100px' }}>
                      <label className="ms-label">Method</label>
                      <select className="ms-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                    </div>
                    <div className="ms-form-group" style={{ flex: 1, minWidth: '100px' }}>
                      <label className="ms-label">Status Code</label>
                      <input className="ms-input" type="text" value={statusCode} onChange={(e) => setStatusCode(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="ms-form-row">
                    <div className="ms-form-group" style={{ flex: 1 }}>
                      <label className="ms-label">Route Path</label>
                      <input className="ms-input" type="text" value={path} onChange={(e) => setPath(e.target.value)} />
                    </div>
                  </div>

                  <div className="ms-form-group" style={{ marginBottom: '16px' }}>
                    <label className="ms-label">JSON Response Body</label>
                    <textarea 
                      className="ms-input ms-textarea" 
                      value={responseBody} 
                      onChange={(e) => setResponseBody(e.target.value)}
                      spellCheck="false"
                    />
                  </div>

                  <button type="submit" className="ms-btn" disabled={loading || !token}>
                    {loading ? 'Deploying...' : 'Deploy Mock Endpoint'}
                  </button>
                </form>
              </div>

              <div className="ms-panel">
                <div className="ms-panel-header">
                  <span className="ms-panel-title">ACTIVE MOCKS</span>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>{mocks.length < 10 ? '0' + mocks.length : mocks.length} RUNNING</span>
                </div>
                
                <div>
                  {mocks.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6B7280', padding: '20px', fontSize: '0.85rem' }}>No active endpoints deployed.</div>
                  ) : (
                    mocks.map(mock => (
                      <div key={mock.id} className="ms-mock-item">
                        <span className={`ms-mock-method method-${mock.method}`}>{mock.method}</span>
                        <span className="ms-mock-path">{mock.path}</span>
                        <span className="ms-mock-status">{mock.status_code} {mock.status_code < 400 ? 'OK' : 'ERR'}</span>
                        <Trash2 className="ms-mock-del" size={16} onClick={() => handleDelete(mock.id)} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ms-statusbar">
            <div className="ms-status-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                <div className="dot-green"></div> BACKEND ONLINE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={12} /> :4000
              </div>
            </div>
            <div className="ms-status-right">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                MEM: 24.5MB
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                UTC - {new Date().toISOString().substring(11, 19)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Trash2 size={12} /> PURGE ALL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  
    
  );
}

