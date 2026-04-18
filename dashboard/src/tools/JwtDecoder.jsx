import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import JsonView from '../JsonView';
import Antigravity from '../components/Antigravity';
import { Bell, Settings, Copy, Activity, ShieldCheck, Database, RefreshCw, AlertTriangle, Key } from 'lucide-react';

// Utility for Base64Url Encoding
const base64UrlEncode = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const arrayBufferToBase64Url = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export default function JwtDecoder() {
  const [activeTab, setActiveTab] = useState('decode'); // 'decode' or 'sign'
  const [token, setToken] = useState('');
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState('');

  // Sign & Fuzz State
  const [signPayload, setSignPayload] = useState('{\n  "sub": "user_123",\n  "name": "John Doe",\n  "iat": ' + Math.floor(Date.now() / 1000) + '\n}');
  const [signSecret, setSignSecret] = useState('my-super-secret-key');
  const [signedToken, setSignedToken] = useState('');
  const [corruptSignature, setCorruptSignature] = useState(false);

  useEffect(() => {
    if (activeTab === 'sign') {
      generateToken();
    }
  }, [signPayload, signSecret, corruptSignature, activeTab]);

  const generateToken = async () => {
    try {
      // 1. Create Header
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = base64UrlEncode(JSON.stringify(header));
      
      // 2. Validate & Encode Payload
      JSON.parse(signPayload); // valid JSON check
      const encodedPayload = base64UrlEncode(signPayload);
      
      const dataToSign = `${encodedHeader}.${encodedPayload}`;
      
      // 3. Sign using HMAC-SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(signSecret || 'default'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
      let encodedSignature = arrayBufferToBase64Url(signatureBuffer);
      
      if (corruptSignature) {
        encodedSignature += "CORRUPTED";
      }
      
      setSignedToken(`${dataToSign}.${encodedSignature}`);
    } catch (err) {
      setSignedToken('Error generating token: Invalid JSON Payload');
    }
  };

  const handleDecode = (e) => {
    const val = e.target.value;
    setToken(val);
    if (!val) { setDecodedData(null); setError(''); return; }
    try {
      const decoded = jwtDecode(val);
      setDecodedData(decoded);
      setError('');
    } catch (err) {
      setDecodedData(null);
      setError('Invalid JWT Format.');
    }
  };

  // Fuzzing Actions
  const handleSetAdmin = () => {
    try {
      const p = JSON.parse(signPayload);
      p.role = 'admin';
      setSignPayload(JSON.stringify(p, null, 2));
    } catch(e) {}
  };
  
  const handleForceExpired = () => {
    try {
      const p = JSON.parse(signPayload);
      p.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      setSignPayload(JSON.stringify(p, null, 2));
    } catch(e) {}
  };

  const getHighlightTokens = (text) => {
    if (!text || !text.includes('.')) return text;
    const parts = text.split('.');
    if (parts.length !== 3) return text;
    return (
      <>
        <span style={{ color: '#F87171' }}>{parts[0]}</span>.
        <span style={{ color: '#A855F7' }}>{parts[1]}</span>.
        <span style={{ color: '#34D399' }}>{parts[2]}</span>
      </>
    );
  };

  return (
    <>
      <style>
        {`
          .jwt-main-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .jwt-status-bar {
            margin-top: 20px;
            background: transparent;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 20;
          }
          
          @media (max-width: 1024px) {
            .jwt-main-columns {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 768px) {
            .jwt-main-columns {
              grid-template-columns: 1fr;
            }
            .jwt-status-bar {
              flex-direction: column;
              align-items: flex-start;
              gap: 20px;
            }
          }
        `}
      </style>
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#0B0B0C' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#EC4899" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '60px 40px', color: '#FFFFFF', backgroundColor: 'rgba(11, 11, 12, 0.85)' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '600', margin: 0, letterSpacing: '-0.5px' }}>Zero-Cloud Auth Playground</h1>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
              <span style={{ color: '#10B981', fontSize: '10px', fontWeight: '700', letterSpacing: '1px' }}>OFFLINE MODE</span>
            </div>
          </div>
          <p style={{ color: '#888', margin: 0, fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>Decode payloads securely or fuzz JWT signatures offline. Your data never leaves your browser.</p>
        </div>
        
        {/* Toggle Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
          <button 
            onClick={() => setActiveTab('decode')}
            style={{ border: 'none', background: activeTab === 'decode' ? '#A855F7' : 'transparent', color: activeTab === 'decode' ? '#FFF' : '#888', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.2s', fontSize: '14px' }}
          >Decode</button>
          <button 
            onClick={() => setActiveTab('sign')}
            style={{ border: 'none', background: activeTab === 'sign' ? '#A855F7' : 'transparent', color: activeTab === 'sign' ? '#FFF' : '#888', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.2s', fontSize: '14px' }}
          >Sign & Fuzz</button>
        </div>
      </div>

      {activeTab === 'decode' ? (
        /* Original Main Columns (Decode) */
        <div className="jwt-main-columns">
            
          {/* Left Column: Encoded Token */}
          <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>ENCODED TOKEN</span>
            <button onClick={() => { setToken(''); setDecodedData(null); setError(''); }} style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
          </div>
          
          <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px', height: '450px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <textarea 
                value={token}
                onChange={handleDecode}
                spellCheck="false"
                style={{ width: '100%', height: '100%', background: 'transparent', color: 'transparent', padding: 0, border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.6', position: 'absolute', top: 0, left: 0, zIndex: 2, caretColor: '#FFF', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
              />
              <div style={{ width: '100%', height: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', lineHeight: '1.6', position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                {getHighlightTokens(token)}
                {!token && <span style={{ color: '#444' }}>Paste token here...</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#F87171', borderRadius: '2px' }}></div>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>HEADER</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#A855F7', borderRadius: '2px' }}></div>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>PAYLOAD</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#34D399', borderRadius: '2px' }}></div>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>SIGNATURE</span>
            </div>
          </div>
        </div>

        {/* Right Column: Decoded Payload */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>DECODED PAYLOAD</span>
            <button 
              onClick={() => decodedData && navigator.clipboard.writeText(JSON.stringify(decodedData, null, 2))} 
              style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Copy size={14} /> Copy JSON
            </button>
          </div>
          
          <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', height: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent',backdropFilter: 'blur(10px)', display: 'flex' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#A78BFA' }}>Payload.json</div>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              {error ? (
                <div style={{ color: '#F87171', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>{error}</div>
              ) : !decodedData ? (
                <div style={{ color: '#444', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>&#123; &#125;</div>
              ) : (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', color: '#E0E0E0' }}>
                  <JsonView data={decodedData} />
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(20, 20, 22, 0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#FFF' }}>{decodedData ? "Signature Verified" : "Awaiting Token"}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{decodedData ? "RS256 Algorithm detected" : "Provide a JWT to verify"}</p>
            </div>
            <button disabled={!decodedData} style={{ background: decodedData ? '#A855F7' : 'rgba(255,255,255,0.05)', color: decodedData ? '#111' : '#666', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: decodedData ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
              Refresh Claims
            </button>
          </div>
        </div>
      </div>
      ) : (
        /* Sign & Fuzz Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Top Row: Editors */}
          <div className="jwt-main-columns" style={{ marginBottom: 0 }}>
            {/* Left Column: Input Panel */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>JSON PAYLOAD</span>
                <span style={{ color: '#A855F7', fontSize: '12px', fontWeight: '600' }}>HS256</span>
              </div>
              <textarea
                value={signPayload}
                onChange={(e) => setSignPayload(e.target.value)}
                spellCheck="false"
                style={{ width: '100%', height: '300px', background: 'transparent', backdropFilter: 'blur(10px)', color: '#D1D5DB', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.6', boxSizing: 'border-box' }}
              />
            </div>
            
            {/* Right Column: Output Token */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>GENERATED TOKEN</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(signedToken)} 
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                >
                  <Copy size={14} /> Copy Token
                </button>
              </div>
              
              <div style={{ background: 'transparent', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px', height: '300px', overflowY: 'auto' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', lineHeight: '1.6', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                  {signedToken.startsWith('Error') ? (
                    <span style={{ color: '#F87171' }}>{signedToken}</span>
                  ) : (
                    getHighlightTokens(signedToken)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Controls & Legend */}
          <div className="jwt-main-columns" style={{ marginBottom: 0 }}>
            {/* Left: Fuzzing Controls */}
            <div style={{ minWidth: 0 }}>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>FUZZING CONTROLS</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={handleSetAdmin} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <ShieldCheck size={14} /> Set Admin Role
                </button>
                <button onClick={handleForceExpired} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <Bell size={14} /> Force Expired Token
                </button>
                <button onClick={() => setCorruptSignature(!corruptSignature)} style={{ background: corruptSignature ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: `1px solid ${corruptSignature ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.2)'}`, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <AlertTriangle size={14} /> Corrupt Signature
                </button>
              </div>
            </div>
            
            {/* Right: Secret Key & Legend */}
            <div style={{ minWidth: 0 }}>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>SECRET KEY</span>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#888" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={signSecret} 
                  onChange={(e) => setSignSecret(e.target.value)} 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: '#D1D5DB', padding: '14px 16px 14px 44px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }}
                />
              </div>

              {/* Legend Repositioned Below Secret Key */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#F87171', borderRadius: '2px' }}></div>
                  <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>HEADER</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#A855F7', borderRadius: '2px' }}></div>
                  <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>PAYLOAD</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#34D399', borderRadius: '2px' }}></div>
                  <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>SIGNATURE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Bar - Placed relative to layout */}
      <div className="jwt-status-bar">
        <div style={{ display: 'flex', gap: '40px' }}>

          <div>
            <div style={{ color: '#666', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '4px' }}>CURRENT LATENCY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10B981', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>0.42ms <span style={{ color: '#666', fontSize: '12px' }}>(Local)</span></span>
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '4px' }}>SECURITY SCAN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={14} color="#10B981" />
              <span style={{ color: '#E0E0E0', fontSize: '14px', fontWeight: '500' }}>All Clean</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '4px' }}>DECODED STRING SIZE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#E0E0E0', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>{activeTab === 'decode' ? (token ? token.length : 0) : signedToken.length} Bytes</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '24px' }}>
           {[3, 6, 8, 12, 10, 14, 18, 12, 8, 5, 10, 16, 14, 8, 4].map((h, i) => (
             <div key={i} style={{ width: '4px', height: `${h}px`, background: 'rgba(16, 185, 129, 0.4)', borderRadius: '2px' }}></div>
           ))}
        </div>
      </div>
      </div>
      </div>
    </>
  );
}
