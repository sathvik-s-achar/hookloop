import React, { useState, useEffect } from 'react';
import Antigravity from '../components/Antigravity';
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
    const newLine = `${keyName}=${secret}`;
    setEnvContent(prev => prev ? prev + '\n' + newLine : newLine);
  };

  useEffect(() => {
    const lines = envContent.split('\n');
    const foundIssues = [];
    const keysSeen = new Set();
    const validPairs = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const cleanLine = line.replace(/\r$/, '');
      const trimmed = cleanLine.trimStart();
      if (!trimmed || trimmed.startsWith('#')) return;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) { foundIssues.push({ line: lineNum, type: 'Error', message: 'Missing "=" sign.' }); return; }

      const key = trimmed.substring(0, equalIndex);
      const value = trimmed.substring(equalIndex + 1);
      const cleanKey = key.trim();

      if (key !== cleanKey) foundIssues.push({ line: lineNum, type: 'Error', message: 'Key has spaces before the "=".' });
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanKey)) foundIssues.push({ line: lineNum, type: 'Warning', message: `"${cleanKey}" has unusual characters.` });
      
      if (keysSeen.has(cleanKey)) foundIssues.push({ line: lineNum, type: 'Error', message: `Duplicate key: "${cleanKey}".` });
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
    
<>
      <style>
        {`
          .ev-generator-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .ev-main-workspace {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 30px;
          }
          
          @media (max-width: 1024px) {
            .ev-generator-cards {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            .ev-generator-cards {
              grid-template-columns: 1fr;
            }
            .ev-main-workspace {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#0B0B0C' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#60A5FA" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '60px 40px', color: '#FFFFFF', backgroundColor: 'rgba(11, 11, 12, 0.85)' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '600', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Env Validator</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '15px' }}>Catch syntax errors, duplicate keys, and generate secure tokens.</p>
          <p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '15px' }}>A precision instrument for environment configuration.</p>
        </div>

      </div>

      {/* Generator Cards */}
      <div className="ev-generator-cards">
        <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }} onClick={() => insertSecret('JWT_SECRET')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>TOKEN GENERATOR</span>
            <Plus size={16} color="#A78BFA" />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>+ JWT_SECRET</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>High-entropy HMAC-SHA256</p>
        </div>
        
        <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }} onClick={() => insertSecret('SESSION_KEY')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#34D399', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>AUTH VAULT</span>
            <Key size={16} color="#34D399" />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>+ SESSION_KEY</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>64-byte cryptographic string</p>
        </div>

        <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }} onClick={() => insertSecret('API_KEY')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ color: '#60A5FA', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>API CORE</span>
            <Code size={16} color="#60A5FA" />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>+ API_KEY</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Prefix-based secure identifier</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="ev-main-workspace">
        
        {/* Left Column: Editor */}
        <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(20, 20, 22, 0.5)' }}>
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
            style={{ flex: 1, background: 'transparent', color: '#E0E0E0', padding: '20px', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.6', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }} 
          />
          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20, 20, 22, 0.5)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
            <span>UTF-8</span>
            <span>Line {envContent.split('\n').length}, Col 1</span>
          </div>
        </div>

        {/* Right Column: Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Panel */}
          <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: envContent ? (issues.length > 0 ? '#EF4444' : '#10B981') : '#666', boxShadow: `0 0 10px ${envContent ? (issues.length > 0 ? '#EF4444' : '#10B981') : '#666'}` }}></div>
              Diagnostic Status
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>System Status</span>
                <span style={{ color: envContent ? (issues.length > 0 ? '#EF4444' : '#10B981') : '#666', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>{envContent ? (issues.length > 0 ? `${issues.length} Issues` : 'All Clear') : 'Awaiting input...'}</span>
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
          <div style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px', flex: 1, overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>{issues.length > 0 ? 'Diagnostic Issues' : 'Detected Keys'}</h3>
            
            {issues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {issues.map((issue, idx) => (
                  <div key={idx} style={{ background: issue.type === 'Warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${issue.type === 'Warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, borderRadius: '8px', padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <ShieldAlert size={14} color={issue.type === 'Warning' ? "#F59E0B" : "#EF4444"} />
                      <span style={{ color: issue.type === 'Warning' ? "#F59E0B" : "#EF4444", fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>{issue.type.toUpperCase()} LINE {issue.line}</span>
                    </div>
                    <p style={{ color: '#E0E0E0', margin: 0, fontSize: '13px' }}>{issue.message}</p>
                  </div>
                ))}
              </div>
            ) : parsedKeys.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {parsedKeys.map((key, idx) => {
                  let type = "LOCAL";
                  let color = "#888";
                  let Icon = Lock;
                  if (key.includes('PROD') || key.includes('ENV')) { type = "PRODUCTION"; color = "#A78BFA"; Icon = ShieldCheck; }
                  if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) { type = "SECURITY LEAK"; color = "#EF4444"; Icon = ShieldAlert; }
                  
                  return (
                    <div key={idx} style={{ background: 'transparent',backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#FFF', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>{key}</span>
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
    </div>
    
    </>
  
    
  );
}
