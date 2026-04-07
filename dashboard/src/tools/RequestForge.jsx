import React, { useState } from 'react';
import axios from 'axios';
import { Search, Bell, User, Send, Server, CheckCircle, AlertTriangle } from 'lucide-react';
import Antigravity from '../components/Antigravity';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function RequestForge() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('http://localhost:4000/api/mocks');
  const [reqBody, setReqBody] = useState('');
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState(null);
  const [time, setTime] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      let parsedBody = undefined;
      if (reqBody && (method === 'POST' || method === 'PUT')) {
        try {
          parsedBody = JSON.parse(reqBody);
        } catch(e) {
          alert("Invalid JSON Body");
          setLoading(false);
          return;
        }
      }
      
      const res = await axios({
        method,
        url,
        data: parsedBody
      });
      
      setResponse(res.data);
      setStatus(res.status);
    } catch (err) {
      if(err.response) {
        setResponse(err.response.data);
        setStatus(err.response.status);
      } else {
        setResponse({ error: err.message });
        setStatus('ERR');
      }
    }
    setTime(Date.now() - start);
    setLoading(false);
  };

  return (
    
<div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#0B0B0C' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#10B981" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'rgba(11, 11, 12, 0.85)' }}>
        <style>{`
          * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
          .rf-layout { display: flex; flex-direction: column; width: 100%; height: 100vh; color: #E2E8F0; }
          
          .rf-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
          .rf-topbar-left { display: flex; align-items: center; gap: 24px; }
          .rf-logo { font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-right: 16px; }
          .rf-tab { color: #8B8B9B; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: color 0.2s; }
          .rf-tab:hover { color: #ffffff; }
          .rf-tab.active { color: #10B981; border-bottom: 1px solid #10B981; padding-bottom: 4px; }
          
          .rf-search-box { display: flex; align-items: center; background: rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 6px 12px; border: 1px solid rgba(255, 255, 255, 0.05); width: 250px; }
          .rf-search-input { background: transparent; border: none; color: #E2E8F0; outline: none; margin-left: 8px; font-size: 0.85rem; width: 100%; }
          .rf-search-input::placeholder { color: #6B7280; }
          
          .rf-workspace { flex: 1; padding: 32px; overflow-y: auto; max-width: 1400px; margin: 0 auto; width: 100%; }
          .rf-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
          .rf-title { font-size: 1.75rem; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }
          .rf-subtitle { color: #8B8B9B; font-size: 0.9rem; margin: 0; max-width: 600px; line-height: 1.5; }
          
          .rf-server-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2); color: #10B981; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
          
          .rf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; min-height: 500px; }
          @media (max-width: 1024px) { .rf-grid { grid-template-columns: 1fr; } }
          
          .rf-panel { background: rgba(11, 11, 12, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; }
          .rf-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .rf-panel-title { color: #10B981; font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
          
          .rf-url-bar { display: flex; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; margin-bottom: 20px; }
          .rf-method-select { background: #1A1A24; color: #10B981; border: none; font-weight: 600; padding: 12px 16px; outline: none; border-right: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem; width: 100px; }
          .rf-url-input { flex: 1; background: rgba(11, 11, 12, 0.4); backdrop-filter: blur(10px); color: #E2E8F0; border: none; padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; outline: none; }
          
          .rf-send-btn { display: flex; align-items: center; gap: 8px; background: #10B981; color: #000; border: none; padding: 0 24px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
          .rf-send-btn:hover { background: #059669; }
          .rf-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          
          .rf-body-box { flex: 1; display: flex; flex-direction: column; }
          .rf-body-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .rf-label { color: #8B8B9B; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .rf-textarea { flex: 1; background: rgba(11, 11, 12, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); color: #A5D6FF; padding: 16px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; outline: none; resize: none; min-height: 250px; }
          .rf-textarea:focus { border-color: #10B981; }
          
          .rf-res-meta { display: flex; gap: 16px; margin-bottom: 12px; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; }
          .rf-badge { padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); }
          .rf-badge-success { color: #10B981; background: rgba(16, 185, 129, 0.1); }
          .rf-badge-error { color: #EF4444; background: rgba(239, 68, 68, 0.1); }
          
          .rf-res-content { flex: 1; background: rgba(11, 11, 12, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; overflow: auto; max-height: 400px; }
          
          .rf-statusbar { height: 40px; background: rgba(18, 18, 20, 0.65); backdrop-filter: blur(10px); border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; font-size: 0.75rem; color: #8B8B9B; font-weight: 600; }
          .rf-status-left, .rf-status-right { display: flex; align-items: center; gap: 24px; }
          .dot-green { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
        `}</style>
        
        <div className="rf-layout">
          <div className="rf-topbar">
            <div className="rf-topbar-left">
              <div className="rf-logo">DevForge</div>
            </div>
            <div className="rf-topbar-right" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="rf-search-box">
                <Search size={14} color="#6B7280" />
                <input type="text" className="rf-search-input" placeholder="Search requests..." />
              </div>
              <Bell size={18} color="#8B8B9B" />
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2E3039', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#E2E8F0" />
              </div>
            </div>
          </div>

          <div className="rf-workspace">
            <div className="rf-header">
              <div>
                <h1 className="rf-title">Request Forge</h1>
                <p className="rf-subtitle">Construct, dispatch, and analyze HTTP payloads with real-time response validation.</p>
              </div>
            </div>

            <div className="rf-grid">
              
              <div className="rf-panel">
                <div className="rf-panel-header">
                  <span className="rf-panel-title">PAYLOAD CONSTRUCTOR</span>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>RAW_HTTP</span>
                </div>
                
                <div className="rf-url-bar">
                  <select className="rf-method-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                  <input 
                    type="text" 
                    className="rf-url-input" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="https://api.example.com/v1/users"
                  />
                  <button className="rf-send-btn" onClick={handleSend} disabled={loading}>
                    <Send size={16} /> 
                    {loading ? 'SENDING' : 'SEND'}
                  </button>
                </div>
                
                <div className="rf-body-box">
                  <div className="rf-body-header">
                    <span className="rf-label">JSON Request Body</span>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{(method === 'GET' || method === 'DELETE') ? 'Body ignored for this method' : 'Valid JSON only'}</span>
                  </div>
                  <textarea 
                    className="rf-textarea" 
                    value={reqBody}
                    onChange={(e) => setReqBody(e.target.value)}
                    placeholder="{\n  \x22key\x22: \x22value\x22\n}"
                    spellCheck="false"
                    disabled={method === 'GET' || method === 'DELETE'}
                    style={{ opacity: (method === 'GET' || method === 'DELETE') ? 0.5 : 1 }}
                  />
                </div>
              </div>

              
              <div className="rf-panel">
                <div className="rf-panel-header">
                  <span className="rf-panel-title" style={{ color: '#F472B6' }}>SERVER RESPONSE</span>
                  {status && (
                    <div className="rf-res-meta">
                      <span className={`rf-badge ${status < 400 ? 'rf-badge-success' : 'rf-badge-error'}`}>
                        {status < 400 ? <CheckCircle size={12} style={{display:'inline', marginRight:'4px'}}/> : <AlertTriangle size={12} style={{display:'inline', marginRight:'4px'}}/>}
                        {status} {status === 200 ? 'OK' : status === 201 ? 'Created' : status === 'ERR' ? 'Failed' : ''}
                      </span>
                      <span className="rf-badge">{time} ms</span>
                    </div>
                  )}
                </div>
                
                <div className="rf-res-content">
                  {response ? (
                    <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ margin: 0, padding: '16px', background: 'transparent', fontSize: '0.85rem' }}>
                      {JSON.stringify(response, null, 2)}
                    </SyntaxHighlighter>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280', fontSize: '0.85rem' }}>
                      No response data. Send a request to preview.
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>

          <div className="rf-statusbar">
            <div className="rf-status-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                <div className="dot-green"></div> FORGE READY
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  
    
  );
}
