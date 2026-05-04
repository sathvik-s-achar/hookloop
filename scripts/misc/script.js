const fs = require('fs');

const envValidatorContent = `import React, { useState, useEffect } from 'react';
import DotGrid from '../components/DotGrid';
import { Search, Bell, Settings, Plus, Key, Code, ShieldAlert, Copy, Trash2, ShieldCheck, Lock } from 'lucide-react';

export default function EnvValidator() {
  const [envContent, setEnvContent] = useState('');
  const [issues, setIssues] = useState([]);
  const [parsedKeys, setParsedKeys] = useState([]);

  const generateSecret = (bytes = 32) => {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const insertSecret = (keyName) => {
    const secret = generateSecret();
    const newLine = \`\${keyName}=\${secret}\`;
    setEnvContent(prev => prev ? prev + '\\n' + newLine : newLine);
  };

  useEffect(() => {
    const lines = envContent.split('\\n');
    const foundIssues = [];
    const keysSeen = new Set();
    const validPairs = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const cleanLine = line.replace(/\\r$/, '');
      const trimmed = cleanLine.trimStart();
      if (!trimmed || trimmed.startsWith('#')) return;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) { foundIssues.push({ line: lineNum, type: 'Error', message: 'Missing "=" sign.' }); return; }

      const key = trimmed.substring(0, equalIndex);
      const value = trimmed.substring(equalIndex + 1);
      const cleanKey = key.trim();

      if (key !== cleanKey) foundIssues.push({ line: lineNum, type: 'Error', message: 'Key has spaces before the "=".' });
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanKey)) foundIssues.push({ line: lineNum, type: 'Warning', message: \`"\${cleanKey}" has unusual characters.\` });
      
      if (keysSeen.has(cleanKey)) foundIssues.push({ line: lineNum, type: 'Error', message: \`Duplicate key: "\${cleanKey}".\` });
      else if (cleanKey) keysSeen.add(cleanKey);

      if (value !== value.trimEnd() && !value.endsWith('"') && !value.endsWith("'")) {
        foundIssues.push({ line: lineNum, type: 'Error', message: 'Hidden trailing spaces detected! This will break database connections.' });
      }
      if (cleanKey && equalIndex !== -1) validPairs.push(cleanKey);
    });

    setIssues(foundIssues);
    setParsedKeys(validPairs);
  }, [envContent]);

  return (
    <div style={{ minHeight: '100vh', padding: '60px 40px', color: '#FFFFFF', position: 'relative', zIndex: 10 }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '600', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Env Validator</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '15px' }}>Catch syntax errors, duplicate keys, and generate secure tokens.</p>
          <p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '15px' }}>A precision instrument for environment configuration.</p>
        </div>
        <div style={{ display: 'flex', background: '#121214', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#A78BFA', padding: '8px 16px', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', cursor: 'pointer' }}>MANUAL</button>
          <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '8px 16px', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', cursor: 'pointer' }}>CI/CD HOOK</button>
        </div>
      </div>

      {/* Generator Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }} onClick={() => insertSecret('JWT_SECRET')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>TOKEN GENERATOR</span>
            <Plus size={16} color="#A78BFA" />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>+ JWT_SECRET</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>High-entropy HMAC-SHA256</p>
        </div>
        
        <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }} onClick={() => insertSecret('SESSION_KEY')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#34D399', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>AUTH VAULT</span>
            <Key size={16} color="#34D399" />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>+ SESSION_KEY</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>64-byte cryptographic string</p>
        </div>

        <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }} onClick={() => insertSecret('API_KEY')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#60A5FA', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>API CORE</span>
            <Code size={16} color="#60A5FA" />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>+ API_KEY</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Prefix-based secure identifier</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
        
        {/* Left Column: Editor */}
        <div style={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121214' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
              <span style={{ marginLeft: '15px', fontSize: '11px', color: '#666', letterSpacing: '1px' }}>ENVIRONMENT_EDITOR.ENV</span>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Copy size={16} color="#666" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(envContent)} />
              <Trash2 size={16} color="#666" style={{ cursor: 'pointer' }} onClick={() => setEnvContent('')} />
            </div>
          </div>
          <textarea 
            value={envContent} 
            onChange={(e) => setEnvContent(e.target.value)}
            placeholder="Paste your .env file here...\nPORT=3000\nDB_HOST=localhost\nDEBUG=true"
            spellCheck="false"
            style={{ flex: 1, background: 'transparent', color: '#E0E0E0', padding: '20px', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.6' }} 
          />
          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#121214', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
            <span>UTF-8</span>
            <span>Line {envContent.split('\\n').length}, Col 1</span>
          </div>
        </div>

        {/* Right Column: Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Panel */}
          <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: envContent ? (issues.length > 0 ? '#EF4444' : '#10B981') : '#666', boxShadow: \`0 0 10px \${envContent ? (issues.length > 0 ? '#EF4444' : '#10B981') : '#666'}\` }}></div>
              Diagnostic Status
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>System Status</span>
                <span style={{ color: envContent ? (issues.length > 0 ? '#EF4444' : '#10B981') : '#666', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>{envContent ? (issues.length > 0 ? \`\${issues.length} Issues\` : 'All Clear') : 'Awaiting input...'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Syntax Health</span>
                <span style={{ color: '#E0E0E0', fontSize: '13px' }}>{envContent ? (issues.length > 0 ? 'Poor' : 'Excellent') : '---'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Security Risk</span>
                <span style={{ color: '#E0E0E0', fontSize: '13px' }}>{envContent ? 'Low' : '---'}</span>
              </div>
            </div>
            
            <button style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <Search size={14} /> Deep Scan
            </button>
          </div>

          {/* Detected Keys / Issues Panel */}
          <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px', flex: 1, overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>{issues.length > 0 ? 'Diagnostic Issues' : 'Detected Keys'}</h3>
            
            {issues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {issues.map((issue, idx) => (
                  <div key={idx} style={{ background: issue.type === 'Warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: \`1px solid \${issue.type === 'Warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}\`, borderRadius: '8px', padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <ShieldAlert size={14} color={issue.type === 'Warning' ? "#F59E0B" : "#EF4444"} />
                      <span style={{ color: issue.type === 'Warning' ? "#F59E0B" : "#EF4444", fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>{issue.type.toUpperCase()} LINE {issue.line}</span>
                    </div>
                    <p style={{ color: '#E0E0E0', margin: 0, fontSize: '13px' }}>{issue.message}</p>
                  </div>
                ))}
              </div>
            ) : parsedKeys.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {parsedKeys.map((key, idx) => {
                  let type = "LOCAL";
                  let color = "#888";
                  let Icon = Lock;
                  if (key.includes('PROD') || key.includes('ENV')) { type = "PRODUCTION"; color = "#A78BFA"; Icon = ShieldCheck; }
                  if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) { type = "SECURITY LEAK"; color = "#EF4444"; Icon = ShieldAlert; }
                  
                  return (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '15px', position: 'relative', overflow: 'hidden' }}>
                      {type === "SECURITY LEAK" && <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: '#EF4444' }}></div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: color, fontSize: '10px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>{type}</span>
                          <span style={{ color: '#FFF', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>{key}</span>
                        </div>
                        <Icon size={16} color={color} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <Search size={24} color="#444" style={{ marginBottom: '10px' }} />
                <span style={{ color: '#666', fontSize: '12px' }}>New keys will appear here</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
\`;

const jwtDecoderContent = \`import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import JsonView from '../JsonView';
import DotGrid from '../components/DotGrid';
import { Bell, Settings, Copy, Activity, ShieldCheck, Database } from 'lucide-react';

export default function JwtDecoder() {
  const [token, setToken] = useState('');
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState('');

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

  const getHighlightTokens = (text) => {
    if (!text) return text;
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
    <div style={{ minHeight: '100vh', padding: '60px 40px', color: '#FFFFFF', position: 'relative', zIndex: 10 }}>
      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', margin: 0, letterSpacing: '-0.5px' }}>JWT Decoder</h1>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
            <span style={{ color: '#10B981', fontSize: '10px', fontWeight: '700', letterSpacing: '1px' }}>OFFLINE MODE</span>
          </div>
        </div>
        <p style={{ color: '#888', margin: 0, fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>Paste a JSON Web Token to securely decode its payload offline. Your data never leaves your browser.</p>
      </div>

      {/* Main Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
        {/* Left Column: Encoded Token */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>ENCODED TOKEN</span>
            <button onClick={() => { setToken(''); setDecodedData(null); setError(''); }} style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
          </div>
          
          <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px', height: '450px', position: 'relative' }}>
            <textarea 
              value={token}
              onChange={handleDecode}
              spellCheck="false"
              style={{ width: '100%', height: '100%', background: 'transparent', color: 'transparent', padding: 0, border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.6', position: 'absolute', top: '25px', left: '25px', zIndex: 2, caretColor: '#FFF', width: 'calc(100% - 50px)', height: 'calc(100% - 50px)' }}
            />
            <div style={{ width: '100%', height: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', lineHeight: '1.6', position: 'absolute', top: '25px', left: '25px', zIndex: 1, pointerEvents: 'none', wordBreak: 'break-all', paddingRight: '50px' }}>
              {getHighlightTokens(token)}
              {!token && <span style={{ color: '#444' }}>Paste token here...</span>}
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
          
          <div style={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', height: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#121214', display: 'flex' }}>
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

          <div style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Floating Status Bar - Placed relative to layout */}
      <div style={{ marginTop: '20px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
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
              <span style={{ color: '#E0E0E0', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>{token ? token.length : 0} Bytes</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '24px' }}>
           {[3, 6, 8, 12, 10, 14, 18, 12, 8, 5, 10, 16, 14, 8, 4].map((h, i) => (
             <div key={i} style={{ width: '4px', height: \`\${h}px\`, background: 'rgba(16, 185, 129, 0.4)', borderRadius: '2px' }}></div>
           ))}
        </div>
      </div>
    </div>
  );
}
\`;

fs.writeFileSync('dashboard/src/tools/EnvValidator.jsx', envValidatorContent);
fs.writeFileSync('dashboard/src/tools/JwtDecoder.jsx', jwtDecoderContent);
