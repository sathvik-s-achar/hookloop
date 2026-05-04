import React, { useState, useEffect } from 'react';
import Antigravity from '../components/Antigravity';

export default function SchemaForge() {
  const [jsonInput, setJsonInput] = useState('{\n  "user_id": "usr_9981",\n  "age": 24,\n  "isActive": true,\n  "roles": ["admin", "editor"],\n  "profile": {\n    "avatar_url": "https://example.com/avatar.png",\n    "last_login": "2026-04-01T12:00:00Z"\n  }\n}');
  const [activeTab, setActiveTab] = useState('mongoose');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // The Engine: Converts JSON to various code formats
  useEffect(() => {
    try {
      if (!jsonInput.trim()) {
        setOutput('// Awaiting JSON payload...');
        setError('');
        return;
      }
      
      const parsed = JSON.parse(jsonInput);
      setError('');

      if (activeTab === 'mongoose') {
        setOutput(generateMongoose(parsed));
      } else if (activeTab === 'typescript') {
        setOutput(generateTypeScript(parsed, 'GeneratedInterface'));
      } else if (activeTab === 'zod') {
        setOutput(generateZod(parsed));
      }
    } catch (err) {
      setError('Invalid JSON syntax detected.');
      setOutput('');
    }
  }, [jsonInput, activeTab]);

  // --- GENERATOR LOGIC ---
  const getType = (val) => {
    if (Array.isArray(val)) return 'array';
    if (val === null) return 'null';
    return typeof val;
  };

  const generateMongoose = (obj) => {
    let schema = 'const mongoose = require("mongoose");\n\nconst generatedSchema = new mongoose.Schema({\n';
    const parseObject = (data, indent) => {
      let result = '';
      for (const key in data) {
        const type = getType(data[key]);
        if (type === 'string') result += `${indent}${key}: { type: String, required: true },\n`;
        else if (type === 'number') result += `${indent}${key}: { type: Number, required: true },\n`;
        else if (type === 'boolean') result += `${indent}${key}: { type: Boolean, required: true },\n`;
        else if (type === 'array') {
          const arrType = data[key].length > 0 ? getType(data[key][0]) : 'mongoose.Schema.Types.Mixed';
          const moType = arrType === 'string' ? 'String' : arrType === 'number' ? 'Number' : 'mongoose.Schema.Types.Mixed';
          result += `${indent}${key}: [{ type: ${moType} }],\n`;
        }
        else if (type === 'object') {
          result += `${indent}${key}: {\n${parseObject(data[key], indent + '  ')}${indent}},\n`;
        }
      }
      return result;
    };
    schema += parseObject(obj, '  ');
    schema += '}, { timestamps: true });\n\nmodule.exports = mongoose.model("ModelName", generatedSchema);';
    return schema;
  };

  const generateTypeScript = (obj, name) => {
    let ts = `export interface ${name} {\n`;
    const parseObject = (data, indent) => {
      let result = '';
      for (const key in data) {
        const type = getType(data[key]);
        if (type === 'string') result += `${indent}${key}: string;\n`;
        else if (type === 'number') result += `${indent}${key}: number;\n`;
        else if (type === 'boolean') result += `${indent}${key}: boolean;\n`;
        else if (type === 'array') {
          const arrType = data[key].length > 0 ? getType(data[key][0]) : 'any';
          result += `${indent}${key}: ${arrType}[];\n`;
        }
        else if (type === 'object') {
          result += `${indent}${key}: {\n${parseObject(data[key], indent + '  ')}${indent}};\n`;
        }
      }
      return result;
    };
    ts += parseObject(obj, '  ');
    ts += '}\n';
    return ts;
  };

  const generateZod = (obj) => {
    let zod = 'import { z } from "zod";\n\nexport const generatedSchema = z.object({\n';
    const parseObject = (data, indent) => {
      let result = '';
      for (const key in data) {
        const type = getType(data[key]);
        if (type === 'string') result += `${indent}${key}: z.string(),\n`;
        else if (type === 'number') result += `${indent}${key}: z.number(),\n`;
        else if (type === 'boolean') result += `${indent}${key}: z.boolean(),\n`;
        else if (type === 'array') {
          const arrType = data[key].length > 0 ? getType(data[key][0]) : 'any';
          result += `${indent}${key}: z.array(z.${arrType === 'string' || arrType === 'number' ? arrType : 'any'}()),\n`;
        }
        else if (type === 'object') {
          result += `${indent}${key}: z.object({\n${parseObject(data[key], indent + '  ')}${indent}}),\n`;
        }
      }
      return result;
    };
    zod += parseObject(obj, '  ');
    zod += '});\n\nexport type GeneratedType = z.infer<typeof generatedSchema>;';
    return zod;
  };

  return (
    <>
      <style>{`
        .workspace-wrapper { padding: 24px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; }
        .page-title { font-size: 1.5rem; font-weight: 500; margin: 0 0 8px 0; color: var(--text-primary); }
        .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin: 0 0 32px 0; }
        
        .split-layout { display: flex; gap: 24px; align-items: stretch; height: 65vh; min-height: 500px;}
        .panel { flex: 1; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(12px); }
        
        .panel-header { background: rgba(13, 13, 18, 0.7); border-bottom: 1px solid var(--border-subtle); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
        .panel-title { margin: 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        
        .editor { flex: 1; width: 100%; background: transparent; color: var(--text-primary); border: none; padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; outline: none; box-sizing: border-box; resize: none; white-space: pre; overflow: auto; line-height: 1.5; }
        
        /* Custom Tabs */
        .tab-group { display: flex; gap: 2px; }
        .tab { padding: 8px 16px; background: transparent; border: none; color: var(--text-secondary); font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; cursor: pointer; transition: 0.2s; border-bottom: 2px solid transparent; }
        .tab:hover { color: var(--text-primary); background: rgba(255,255,255,0.02); }
        .tab.active { color: var(--accent-blurple); border-bottom-color: var(--accent-blurple); background: rgba(94, 106, 210, 0.05); }

        .error-banner { background: rgba(239, 68, 68, 0.1); color: #F87171; padding: 12px 20px; font-size: 0.85rem; border-bottom: 1px solid rgba(239, 68, 68, 0.2); }

        @media (max-width: 768px) {
          .split-layout { flex-direction: column; height: auto; }
          .panel { height: 400px; }
        }
      `}</style>
      
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#0B0B0C' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#8B5CF6" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', backgroundColor: 'rgba(11, 11, 12, 0.85)' }}>

          <div className="workspace-wrapper">
            <h1 className="page-title">Schema Forge</h1>
            <p className="page-subtitle">Instantly reverse-engineer raw JSON into robust database schemas and type definitions.</p>

            <div className="split-layout">
              {/* LEFT: JSON Input */}
              <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">Raw JSON Matrix</h3>
            </div>
            {error && <div className="error-banner">⚠️ {error}</div>}
            <textarea 
              className="editor" 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              spellCheck="false" 
              placeholder="Paste JSON payload here..."
            />
          </div>

          {/* RIGHT: Code Output */}
          <div className="panel">
            <div className="panel-header" style={{ padding: '0 12px' }}>
              <div className="tab-group">
                <button className={`tab ${activeTab === 'mongoose' ? 'active' : ''}`} onClick={() => setActiveTab('mongoose')}>Mongoose</button>
                <button className={`tab ${activeTab === 'typescript' ? 'active' : ''}`} onClick={() => setActiveTab('typescript')}>TypeScript</button>
                <button className={`tab ${activeTab === 'zod' ? 'active' : ''}`} onClick={() => setActiveTab('zod')}>Zod</button>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(output)} 
                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Copy Code
              </button>
            </div>
            <textarea 
              className="editor" 
              value={output} 
              readOnly 
              spellCheck="false" 
              style={{ color: '#8A98FC' }}
            />
          </div>
        </div>
      </div>
      </div>
      </div>
    </>
  );
}