import React, { useState, useEffect } from 'react';

export default function EnvValidator() {
  const [envContent, setEnvContent] = useState('');
  const [issues, setIssues] = useState([]);
  const [parsedKeys, setParsedKeys] = useState([]);

  // 🔐 Cryptographically Secure Secret Generator
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

  // 🕵️‍♂️ Real-Time Validation Engine
  useEffect(() => {
    const lines = envContent.split('\n');
    const foundIssues = [];
    const keysSeen = new Set();
    const validPairs = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) return;

      const equalIndex = trimmed.indexOf('=');
      
      // Rule 1: Must have an equals sign
      if (equalIndex === -1) {
        foundIssues.push({ line: lineNum, type: 'Error', message: 'Missing "=" sign.' });
        return;
      }

      const key = trimmed.substring(0, equalIndex);
      const value = trimmed.substring(equalIndex + 1);
      const cleanKey = key.trim();

      // Rule 2: Key formatting
      if (key !== cleanKey) {
        foundIssues.push({ line: lineNum, type: 'Error', message: 'Key has leading/trailing spaces before the "=".' });
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanKey)) {
        foundIssues.push({ line: lineNum, type: 'Warning', message: `"${cleanKey}" has unusual characters. Stick to UPPERCASE_AND_UNDERSCORES.` });
      }

      // Rule 3: Duplicate Keys
      if (keysSeen.has(cleanKey)) {
        foundIssues.push({ line: lineNum, type: 'Error', message: `Duplicate key found: "${cleanKey}". The server will only read the last one.` });
      } else if (cleanKey) {
        keysSeen.add(cleanKey);
      }

      // Rule 4: Spaces in unquoted values
      if (value.includes(' ') && !value.startsWith('"') && !value.startsWith("'")) {
        foundIssues.push({ line: lineNum, type: 'Warning', message: 'Value contains spaces but is not wrapped in quotes ("").' });
      }

      // Rule 5: Trailing spaces (The silent killer!)
      if (value !== value.trimEnd() && !value.endsWith('"') && !value.endsWith("'")) {
        foundIssues.push({ line: lineNum, type: 'Error', message: 'Hidden trailing spaces detected! This will break database connections.' });
      }

      if (cleanKey && equalIndex !== -1) {
          validPairs.push(cleanKey);
      }
    });

    setIssues(foundIssues);
    setParsedKeys(validPairs);
  }, [envContent]);

  return (
    <div style={{ padding: '40px', color: '#f3f4f6', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>⚙️ .env Validator & Generator</h2>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Catch syntax errors, duplicate keys, and generate secure cryptographic tokens.</p>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* ================= LEFT SIDE: EDITOR & GENERATOR ================= */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#c9d1d9', fontSize: '1rem' }}>🔐 Generate Secure Keys</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => insertSecret('JWT_SECRET')} style={{ flex: 1, padding: '10px', backgroundColor: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ JWT_SECRET</button>
              <button onClick={() => insertSecret('SESSION_KEY')} style={{ flex: 1, padding: '10px', backgroundColor: '#8957e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ SESSION_KEY</button>
              <button onClick={() => insertSecret('API_KEY')} style={{ flex: 1, padding: '10px', backgroundColor: '#1f6feb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ API_KEY</button>
            </div>
          </div>

          <div style={{ backgroundColor: '#161b22', padding: '25px', borderRadius: '12px', border: '1px solid #30363d', flex: 1 }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#58a6ff' }}>📝 Environment Variables</h3>
            <textarea 
              value={envContent} 
              onChange={(e) => setEnvContent(e.target.value)}
              placeholder="# Paste your .env file here...&#10;PORT=4000&#10;DB_HOST=localhost"
              spellCheck="false"
              style={{ width: '100%', height: '400px', backgroundColor: '#0B0F19', color: '#e5c07b', padding: '15px', border: '1px solid #30363d', borderRadius: '6px', fontFamily: 'monospace', fontSize: '15px', resize: 'vertical', lineHeight: '1.5' }} 
            />
          </div>
        </div>

        {/* ================= RIGHT SIDE: VALIDATION ENGINE ================= */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: '#161b22', padding: '25px', borderRadius: '12px', border: `1px solid ${issues.length > 0 ? '#f85149' : '#30363d'}`, minHeight: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#c9d1d9' }}>🕵️‍♂️ Diagnostic Report</h3>
              {envContent.trim() !== '' && issues.length === 0 && (
                <span style={{ color: '#3fb950', fontWeight: 'bold', backgroundColor: '#2ea04326', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>✅ Clean</span>
              )}
            </div>

            {envContent.trim() === '' ? (
              <div style={{ color: '#6b7280', textAlign: 'center', marginTop: '40px', fontFamily: 'monospace' }}>Awaiting input...</div>
            ) : issues.length === 0 ? (
              <div style={{ color: '#3fb950', textAlign: 'center', marginTop: '40px' }}>No syntax errors or hidden trailing spaces found! Your file is safe to deploy.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {issues.map((issue, idx) => (
                  <div key={idx} style={{ backgroundColor: issue.type === 'Error' ? '#f851491a' : '#d299221a', borderLeft: `4px solid ${issue.type === 'Error' ? '#f85149' : '#d29922'}`, padding: '12px 15px', borderRadius: '0 6px 6px 0', color: '#c9d1d9', fontSize: '0.95rem' }}>
                    <strong style={{ color: issue.type === 'Error' ? '#ff7b72' : '#e3b341' }}>Line {issue.line}:</strong> {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Keys Overview */}
          <div style={{ backgroundColor: '#161b22', padding: '25px', borderRadius: '12px', border: '1px solid #30363d', flex: 1 }}>
             <h3 style={{ margin: '0 0 15px 0', color: '#8b949e', fontSize: '1rem' }}>Detected Keys ({parsedKeys.length})</h3>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
               {parsedKeys.map((key, idx) => (
                 <span key={idx} style={{ backgroundColor: '#1f2937', color: '#58a6ff', padding: '6px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                   {key}
                 </span>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}