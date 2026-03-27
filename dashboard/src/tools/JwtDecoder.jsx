import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import JsonView from '../JsonView';

export default function JwtDecoder() {
  const [token, setToken] = useState('');
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState('');

  const handleDecode = (e) => {
    const val = e.target.value;
    setToken(val);

    if (!val) {
      setDecodedData(null);
      setError('');
      return;
    }

    try {
      const decoded = jwtDecode(val);
      setDecodedData(decoded);
      setError('');
    } catch (err) {
      setDecodedData(null);
      setError('❌ Invalid JWT Format.');
    }
  };

  return (
    <div style={{ padding: '40px', color: '#f3f4f6' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>🔐 JWT Decoder</h2>
      <p style={{ color: '#9ca3af', marginBottom: '30px' }}>Paste a JSON Web Token to decode its payload.</p>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, backgroundColor: '#161b22', padding: '20px', borderRadius: '8px' }}>
          <h3>Encoded Token</h3>
          <textarea
            style={{ width: '100%', height: '300px', backgroundColor: '#0B0F19', color: '#58a6ff', padding: '10px', borderRadius: '4px', border: '1px solid #30363d', fontFamily: 'monospace' }}
            placeholder="Paste JWT here..."
            value={token}
            onChange={handleDecode}
          />
        </div>

        <div style={{ flex: 1, backgroundColor: '#161b22', padding: '20px', borderRadius: '8px' }}>
          <h3>Decoded Payload</h3>
          {error && <div style={{ color: '#ef4444', padding: '10px' }}>{error}</div>}
          {!error && decodedData && (
            <div style={{ height: '300px', overflowY: 'auto', backgroundColor: '#0B0F19', padding: '10px', borderRadius: '4px', border: '1px solid #30363d' }}>
              <JsonView data={decodedData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}