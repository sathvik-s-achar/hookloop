import React, { useState, useEffect, useMemo } from 'react';
import { FileJson, AlertTriangle, PlusCircle, MinusCircle, FileDiff, Zap, Edit2, Eye, ShieldAlert, ShieldCheck, ArrowRightLeft, EyeOff, Save, Download, Cloud, Globe, Loader2, RefreshCw } from 'lucide-react';
import Antigravity from '../components/Antigravity';

const getType = (val) => {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
};

const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
    }
  }
  return matrix[b.length][a.length];
};

const isSimilar = (a, b) => {
  const longer = a.length > b.length ? a : b;
  if (longer.length === 0) return true;
  const sim = (longer.length - levenshtein(a.toLowerCase(), b.toLowerCase())) / longer.length;
  return sim > 0.6;
};

const shouldIgnore = (key, patterns) => {
  for (const p of patterns) {
    if (!p) continue;
    try {
      const regex = new RegExp(`^${p.replace(/\*/g, '.*')}$`);
      if (regex.test(key)) return true;
    } catch (e) {
      if (key === p) return true;
    }
  }
  return false;
};

const computeDiff = (base, target, path = 'root', ignorePatterns = []) => {
  let diffs = [];
  if (base === undefined || target === undefined) return diffs;

  const baseType = getType(base);
  const targetType = getType(target);

  if (baseType !== targetType) {
    diffs.push({ type: 'TYPE_CHANGE', path, message: `Type changed from ${baseType} to ${targetType}`, baseValue: base, targetValue: target });
    return diffs;
  }

  if (baseType === 'object') {
    const baseKeys = Object.keys(base).filter(k => !shouldIgnore(k, ignorePatterns));
    const targetKeys = Object.keys(target).filter(k => !shouldIgnore(k, ignorePatterns));
    
    const removed = baseKeys.filter(k => !target.hasOwnProperty(k));
    const added = targetKeys.filter(k => !base.hasOwnProperty(k));
    const common = baseKeys.filter(k => target.hasOwnProperty(k));
    
    const finalRemoved = new Set(removed);
    const finalAdded = new Set(added);
    
    // Rename Detection
    for (const rKey of removed) {
      for (const aKey of added) {
        if (finalRemoved.has(rKey) && finalAdded.has(aKey) && isSimilar(rKey, aKey)) {
          finalRemoved.delete(rKey);
          finalAdded.delete(aKey);
          const longer = rKey.length > aKey.length ? rKey : aKey;
          const sim = longer.length === 0 ? 1 : (longer.length - levenshtein(rKey.toLowerCase(), aKey.toLowerCase())) / longer.length;
          const confidence = Math.round(sim * 100);
          diffs.push({
            type: 'RENAMED',
            path: `${path}.${aKey}`,
            oldPath: `${path}.${rKey}`,
            message: `Renamed from "${rKey}" to "${aKey}"`,
            confidence: confidence,
            baseValue: base[rKey],
            targetValue: target[aKey]
          });
          diffs = diffs.concat(computeDiff(base[rKey], target[aKey], `${path}.${aKey}`, ignorePatterns));
          break;
        }
      }
    }
    
    for (const rKey of finalRemoved) {
      diffs.push({ type: 'REMOVED', path: `${path}.${rKey}`, value: base[rKey] });
    }
    for (const aKey of finalAdded) {
      diffs.push({ type: 'ADDED', path: `${path}.${aKey}`, value: target[aKey] });
    }
    for (const cKey of common) {
      diffs = diffs.concat(computeDiff(base[cKey], target[cKey], `${path}.${cKey}`, ignorePatterns));
    }
  } else if (baseType === 'array') {
    const maxLen = Math.max(base.length, target.length);
    for (let i = 0; i < maxLen; i++) {
      const newPath = `${path}[${i}]`;
      if (i >= base.length) {
        diffs.push({ type: 'ADDED', path: newPath, value: target[i] });
      } else if (i >= target.length) {
        diffs.push({ type: 'REMOVED', path: newPath, value: base[i] });
      } else {
        diffs = diffs.concat(computeDiff(base[i], target[i], newPath, ignorePatterns));
      }
    }
  } else if (base !== target) {
    diffs.push({ type: 'VALUE_CHANGE', path, message: `Value changed`, baseValue: base, targetValue: target });
  }

  return diffs;
};

const JsonNode = ({ keyName, value, path, side, highlightedPath, isLast, changedPaths, showOnlyDiffs }) => {
  const isHighlighted = highlightedPath === path || highlightedPath === `${path}_old`; 
  // changedPaths contains paths that have diffs, or are parents of diffs.
  const hasChanges = changedPaths.has(path) || path === 'root';
  
  if (showOnlyDiffs && !hasChanges) {
    // If it's a child of something that we decided to hide, we just don't render it deeply.
    // We already handle that at the parent level. But if we are the node to be hidden:
    return null; // The parent will just render '...' 
  }

  const type = getType(value);
  const highlightStyle = isHighlighted ? { backgroundColor: 'rgba(96, 165, 250, 0.3)', outline: '1px solid #60A5FA', borderRadius: '4px' } : {};

  const renderValue = () => {
    if (type === 'string') return <span style={{ color: '#34D399' }}>"{value}"</span>;
    if (type === 'number') return <span style={{ color: '#F97316' }}>{value}</span>;
    if (type === 'boolean') return <span style={{ color: '#A855F7' }}>{value ? 'true' : 'false'}</span>;
    if (type === 'null') return <span style={{ color: '#6B7280' }}>null</span>;
    return null;
  };

  if (type === 'object' || type === 'array') {
    const isArray = type === 'array';
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    
    // If we only show diffs, but this object has NO changed children at all, collapse it.
    if (showOnlyDiffs && path !== 'root' && !changedPaths.has(path)) {
      return (
        <div id={`node-${side}-${path}`} style={{ ...highlightStyle, padding: '2px 4px', transition: 'background-color 0.3s' }}>
          {keyName !== undefined && <span style={{ color: '#60A5FA' }}>"{keyName}"</span>}
          {keyName !== undefined && <span style={{ color: '#E5E7EB' }}>: </span>}
          <span style={{ color: '#E5E7EB' }}>{isArray ? '[' : '{'}</span>
          <span style={{ color: '#888', fontStyle: 'italic', margin: '0 4px' }}>...</span>
          <span style={{ color: '#E5E7EB' }}>{isArray ? ']' : '}'}{!isLast ? ',' : ''}</span>
        </div>
      );
    }

    return (
      <div id={`node-${side}-${path}`} style={{ ...highlightStyle, padding: '2px 4px', transition: 'background-color 0.3s' }}>
        {keyName !== undefined && <span style={{ color: '#60A5FA' }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: '#E5E7EB' }}>: </span>}
        <span style={{ color: '#E5E7EB' }}>{isArray ? '[' : '{'}</span>
        {!isEmpty && (
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '4px' }}>
            {keys.map((k, i) => {
              const childPath = isArray ? `${path}[${k}]` : `${path}.${k}`;
              // Skip rendering if not root, showOnlyDiffs is on, and child has no changes
              if (showOnlyDiffs && !changedPaths.has(childPath)) {
                return null;
              }
              return (
                <JsonNode 
                  key={k} 
                  keyName={isArray ? undefined : k} 
                  value={value[k]} 
                  path={childPath} 
                  side={side} 
                  highlightedPath={highlightedPath}
                  isLast={i === Object.keys(value).filter(ck => !showOnlyDiffs || changedPaths.has(isArray ? `${path}[${ck}]` : `${path}.${ck}`)).length - 1}
                  changedPaths={changedPaths}
                  showOnlyDiffs={showOnlyDiffs}
                />
              )
            })}
            {showOnlyDiffs && keys.some(k => !changedPaths.has(isArray ? `${path}[${k}]` : `${path}.${k}`)) && (
               <div style={{ color: '#888', fontStyle: 'italic', padding: '2px 4px' }}>...</div>
            )}
          </div>
        )}
        <span style={{ color: '#E5E7EB' }}>{isArray ? ']' : '}'}{!isLast ? ',' : ''}</span>
      </div>
    );
  }

  return (
    <div id={`node-${side}-${path}`} style={{ ...highlightStyle, padding: '2px 4px', transition: 'background-color 0.3s' }}>
      {keyName !== undefined && <span style={{ color: '#60A5FA' }}>"{keyName}"</span>}
      {keyName !== undefined && <span style={{ color: '#E5E7EB' }}>: </span>}
      {renderValue()}
      {!isLast && <span style={{ color: '#E5E7EB' }}>,</span>}
    </div>
  );
};

const JsonPanel = ({ title, icon: Icon, color, input, setInput, parsedObj, side, highlightedPath, parseError, changedPaths, showOnlyDiffs }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ color: '#888', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={16} color={color} /> {title}
        </label>
        <button onClick={() => setIsEditMode(!isEditMode)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
          {isEditMode ? <><Eye size={14} /> VIEW</> : <><Edit2 size={14} /> EDIT</>}
        </button>
      </div>
      
      {isEditMode ? (
        <textarea 
          value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false"
          style={{ width: '100%', height: '100%', background: 'transparent', backdropFilter: 'blur(15px)', color: '#E5E7EB', border: `1px solid ${parseError ? '#EF4444' : color || '#befcf68c'}`, borderRadius: '8px', padding: '15px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'none' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'transparent', backdropFilter: 'blur(15px)', color: '#E5E7EB', border: `1px solid ${parseError ? '#EF4444' : color || '#befcf68c'}`, borderRadius: '8px', padding: '15px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', boxSizing: 'border-box', overflowY: 'auto' }}>
          {parseError ? (
            <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={16} /> Edit mode syntax error
            </div>
          ) : (
            <JsonNode value={parsedObj} path="root" side={side} highlightedPath={highlightedPath} isLast={true} changedPaths={changedPaths} showOnlyDiffs={showOnlyDiffs} />
          )}
        </div>
      )}
    </div>
  );
};

export default function DiffForge() {
  const [baseInput, setBaseInput] = useState('{\n  "version": "1.0",\n  "user_id": "994A",\n  "apiConfig": {\n    "timeout": 5000,\n    "retry": true,\n    "updated_at": "2024-01-01"\n  },\n  "endpoints": ["/users", "/posts"]\n}');
  const [targetInput, setTargetInput] = useState('{\n  "version": "1.1",\n  "userId": "994A",\n  "apiConfig": {\n    "timeout": "5000",\n    "rateLimit": 100,\n    "updated_at": "2024-02-01"\n  },\n  "endpoints": ["/users"]\n}');
  const [diffResults, setDiffResults] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [parsedBase, setParsedBase] = useState(null);
  const [parsedTarget, setParsedTarget] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState(null);
  
  const [ignoreInput, setIgnoreInput] = useState('*_at, id, uuid');
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [filterMode, setFilterMode] = useState('All');

  const [baseUrl, setBaseUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [requestHeaders, setRequestHeaders] = useState('{\n  "Authorization": "Bearer token"\n}');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('');

  const handleLiveFetch = async () => {
    setIsFetching(true);
    setFetchError(null);
    setFetchStatus('Starting...');
    try {
      let headersTarget = {};
      try {
        if (requestHeaders.trim()) {
           headersTarget = JSON.parse(requestHeaders);
        }
      } catch (e) {
        throw new Error("Invalid format for Request Headers. Must be JSON.");
      }

      const fetchConfig = { method: httpMethod, headers: headersTarget };
      let baseResult = baseInput;
      let targetResult = targetInput;

      if (baseUrl) {
        setFetchStatus('Fetching baseline...');
        const resBase = await fetch(baseUrl, fetchConfig);
        if (!resBase.ok) throw new Error(`Baseline API failed: ${resBase.status} ${resBase.statusText}`);
        baseResult = await resBase.text();
        try {
          JSON.parse(baseResult);
        } catch (e) {
          throw new Error('Baseline API returned invalid JSON.');
        }
      }

      if (targetUrl) {
        setFetchStatus('Fetching target...');
        const resTarget = await fetch(targetUrl, fetchConfig);
        if (!resTarget.ok) throw new Error(`Target API failed: ${resTarget.status} ${resTarget.statusText}`);
        targetResult = await resTarget.text();
        try {
          JSON.parse(targetResult);
        } catch (e) {
          throw new Error('Target API returned invalid JSON.');
        }
      }

      setFetchStatus('Comparing...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (baseUrl) setBaseInput(baseResult);
      if (targetUrl) setTargetInput(targetResult);

    } catch (err) {
      setFetchError(err.message);
    } finally {
      setIsFetching(false);
      setFetchStatus('');
    }
  };

  const saveBaseline = () => {
    try {
      localStorage.setItem('diffForge_baseline', baseInput);
      alert('Baseline JSON saved to Local Storage.');
    } catch(e) {
      alert('Failed to save baseline.');
    }
  };

  const loadBaseline = () => {
    const saved = localStorage.getItem('diffForge_baseline');
    if (saved) {
      setBaseInput(saved);
    } else {
      alert('No saved baseline found in Local Storage.');
    }
  };

  const exportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      metrics: {
        breakingChanges: diffResults.filter(d => d.type === 'TYPE_CHANGE').length,
        riskyChanges: diffResults.filter(d => d.type === 'REMOVED').length,
        safeChanges: diffResults.filter(d => d.type === 'ADDED' || d.type === 'VALUE_CHANGE' || d.type === 'RENAMED').length,
      },
      differences: diffResults
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diffforge-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const changedPaths = useMemo(() => {
    const paths = new Set();
    diffResults.forEach(d => {
      let current = d.path;
      while (current) {
        paths.add(current);
        const lastDot = current.lastIndexOf('.');
        const lastBracket = current.lastIndexOf('[');
        const maxIdx = Math.max(lastDot, lastBracket);
        if (maxIdx > 0) {
          current = current.substring(0, maxIdx);
        } else {
           break;
        }
      }
      if (d.oldPath) {
        let currentOld = d.oldPath;
        while (currentOld) {
          paths.add(currentOld);
          const lastDot = currentOld.lastIndexOf('.');
          const lastBracket = currentOld.lastIndexOf('[');
          const maxIdx = Math.max(lastDot, lastBracket);
          if (maxIdx > 0) {
            currentOld = currentOld.substring(0, maxIdx);
          } else {
             break;
          }
        }
      }
    });
    return paths;
  }, [diffResults]);

  useEffect(() => {
    try {
      const baseObj = JSON.parse(baseInput);
      const targetObj = JSON.parse(targetInput);
      const ignorePatterns = ignoreInput.split(',').map(s => s.trim()).filter(Boolean);
      
      setParsedBase(baseObj);
      setParsedTarget(targetObj);
      setDiffResults(computeDiff(baseObj, targetObj, 'root', ignorePatterns));
      setParseError(null);
    } catch (err) {
      setParseError(err.message);
      setDiffResults([]);
    }
  }, [baseInput, targetInput, ignoreInput]);

  const handleDiffClick = (path, oldPath) => {
    setHighlightedPath(path);
    const targetPath = oldPath || path;
    setTimeout(() => {
       document.getElementById(`node-base-${targetPath}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
       document.getElementById(`node-target-${path}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100); // slight delay to allow tree expansion if needed in real apps, although we only collapse when it renders.
  };

  const breakingCount = diffResults.filter(d => d.type === 'TYPE_CHANGE').length;
  const riskyCount = diffResults.filter(d => d.type === 'REMOVED').length;
  const safeCount = diffResults.filter(d => d.type === 'ADDED' || d.type === 'VALUE_CHANGE' || d.type === 'RENAMED').length;

  const filteredDiffResults = diffResults.filter(diff => {
    if (filterMode === 'All') return true;
    if (filterMode === 'Breaking') return diff.type === 'TYPE_CHANGE';
    if (filterMode === 'Risky') return diff.type === 'REMOVED';
    if (filterMode === 'Safe') return ['ADDED', 'VALUE_CHANGE', 'RENAMED'].includes(diff.type);
    return true;
  });

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#0B0B0C', color: '#FFF', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.4 }}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#f6f9fd" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, padding: '40px', maxWidth: '1400px', margin: '0 auto' ,backdropFilter:'blur(25px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FileDiff size={32} color="#60A5FA" />
            <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>DiffForge</h1>
          </div>
          <p style={{ color: '#888', marginTop: '10px' }}>Semantic JSON regression testing. Detects additions, removals, renames, and structural breaking changes.</p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={14} color="#A855F7" /> IGNORE PATTERNS (Regex/Wildcard)
            </label>
            <input 
              type="text" 
              value={ignoreInput}
              onChange={(e) => setIgnoreInput(e.target.value)}
              placeholder="e.g. *_at, id, created_*"
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px 15px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flexBasis: '200px' }}>
            <button 
              onClick={saveBaseline}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', marginBottom: '10px' }}
            >
              <Save size={16} /> SAVE BASELINE
            </button>
            <button 
              onClick={loadBaseline}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
            >
              <FileJson size={16} /> LOAD BASELINE
            </button>
          </div>
          <div style={{ flexBasis: '300px' }}>
            <button 
              onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: showOnlyDiffs ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.05)', color: showOnlyDiffs ? '#60A5FA' : '#888', border: `1px solid ${showOnlyDiffs ? '#60A5FA' : 'rgba(255,255,255,0.1)'}`, padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
            >
              {showOnlyDiffs ? <EyeOff size={16} /> : <Eye size={16} />}
              {showOnlyDiffs ? 'SHOWING ONLY DIFFERENCES' : 'COLLAPSE UNCHANGED JSON'}
            </button>
          </div>
        </div>

        {/* Live Fetch Panel */}
        <div style={{ background: 'rgba(20, 20, 22, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Globe size={18} color="#60A5FA" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#E5E7EB' }}>Live Fetch Configuration</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div style={{ flexBasis: '150px' }}>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>METHOD</label>
              <select value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px 15px', borderRadius: '8px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>BASELINE API URL</label>
              <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.v1.example.com/data" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px 15px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>TARGET API URL</label>
              <input type="text" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://api.v2.example.com/data" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px 15px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>REQUEST HEADERS (JSON)</label>
              <textarea value={requestHeaders} onChange={(e) => setRequestHeaders(e.target.value)} spellCheck="false" style={{ width: '100%', height: '60px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#A855F7', padding: '10px 15px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <button disabled={isFetching || (!baseUrl && !targetUrl)} onClick={handleLiveFetch} style={{ flexBasis: '200px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: isFetching ? '#444' : '#60A5FA', color: '#FFF', border: 'none', borderRadius: '8px', cursor: (isFetching || (!baseUrl && !targetUrl)) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', marginTop: '24px', opacity: (isFetching || (!baseUrl && !targetUrl)) ? 0.5 : 1 }}>
              {isFetching ? <Loader2 size={16} className={isFetching ? "animate-spin rotate" : ""} style={isFetching ? { animation: "spin 1s linear infinite" } : {}} /> : <Cloud size={16} />}
              {isFetching ? fetchStatus || 'FETCHING...' : 'RUN LIVE DIFF'}
            </button>
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        </div>

        {fetchError ? (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: '12px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: '20px' }} />
            <h2 style={{ color: '#EF4444', margin: '0 0 10px 0', fontSize: '24px' }}>API Execution Failed</h2>
            <p style={{ color: '#E5E7EB', margin: '0 0 24px 0', maxWidth: '600px', lineHeight: '1.5' }}>{fetchError}</p>
            <button onClick={handleLiveFetch} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF4444', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s' }}>
              <RefreshCw size={16} /> Retry Fetch
            </button>
          </div>
        ) : (
          <>
            {/* Inputs vs Display Trees */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
              <JsonPanel
            title="BASELINE JSON"
            icon={FileJson}
            color="#A855F7"
            input={baseInput}
            setInput={setBaseInput}
            parsedObj={parsedBase}
            side="base"
            highlightedPath={highlightedPath}
            parseError={parseError}
            changedPaths={changedPaths}
            showOnlyDiffs={showOnlyDiffs}
          />
          <JsonPanel
            title="TARGET JSON"
            icon={FileJson}
            color="#A855F7"
            input={targetInput}
            setInput={setTargetInput}
            parsedObj={parsedTarget}
            side="target"
            highlightedPath={highlightedPath}
            parseError={parseError}
            changedPaths={changedPaths}
            showOnlyDiffs={showOnlyDiffs}
          />
        </div>

        {/* Parse Error */}
        {parseError && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #F87171', padding: '15px', borderRadius: '8px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
            <AlertTriangle size={20} />
            <strong>JSON Parse Error:</strong> {parseError}
          </div>
        )}

        {/* Analysis Panel */}
        {!parseError && (
          <>
            {/* Diff Summary Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <ShieldAlert size={32} color="#EF4444" />
                <div>
                  <div style={{ color: '#EF4444', fontSize: '24px', fontWeight: 'bold' }}>{breakingCount}</div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>BREAKING CHANGES</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid #F97316', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <AlertTriangle size={32} color="#F97316" />
                <div>
                  <div style={{ color: '#F97316', fontSize: '24px', fontWeight: 'bold' }}>{riskyCount}</div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>RISKY CHANGES</div>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <ShieldCheck size={32} color="#10B981" />
                <div>
                  <div style={{ color: '#10B981', fontSize: '24px', fontWeight: 'bold' }}>{safeCount}</div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>SAFE CHANGES</div>
                </div>
              </div>
            </div>

            <button 
              onClick={exportReport}
              style={{ width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
            >
              <Download size={16} color="#34D399" /> EXPORT REPORT
            </button>

            <div style={{ background: 'transparent', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                  <Zap size={20} color="#FBBF24" /> Diff Analysis
                </h3>
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {['All', 'Breaking', 'Risky', 'Safe'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setFilterMode(mode)}
                      style={{
                        background: filterMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: filterMode === mode ? '#FFF' : '#888',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDiffResults.length === 0 ? (
                <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '10px', padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                  No semantic differences found matching this filter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredDiffResults.map((diff, i) => {
                    let color = '#888';
                    let icon = null;
                    let bg = 'transparent';
                    
                    if (diff.type === 'ADDED') {
                      color = '#10B981'; // Green
                      bg = 'rgba(16,185,129,0.05)';
                      icon = <PlusCircle size={16} />;
                    } else if (diff.type === 'REMOVED') {
                      color = '#F97316'; // Orange/Yellow
                      bg = 'rgba(249,115,22,0.05)';
                      icon = <MinusCircle size={16} />;
                    } else if (diff.type === 'TYPE_CHANGE') {
                      color = '#EF4444'; // Red
                      bg = 'rgba(239,68,68,0.1)';
                      icon = <AlertTriangle size={16} color="#EF4444" />;
                    } else if (diff.type === 'VALUE_CHANGE') {
                      color = '#3B82F6'; // Blue
                      bg = 'rgba(59,130,246,0.05)';
                      icon = <AlertTriangle size={16} color="#3B82F6" style={{ opacity: 0.5 }} />;
                    } else if (diff.type === 'RENAMED') {
                      color = '#8B5CF6'; // Purple
                      bg = 'rgba(139,92,246,0.1)';
                      icon = <ArrowRightLeft size={16} color="#8B5CF6" />;
                    }

                    return (
                      <div 
                        key={i} 
                        onClick={() => handleDiffClick(diff.path, diff.oldPath)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', padding: '15px', background: bg, border: `1px solid ${color}33`, borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', cursor: 'pointer', transition: 'background-color 0.2s', ...(highlightedPath === diff.path ? { boxShadow: `0 0 10px ${color}66` } : {}) }}
                      >
                        <div style={{ color, display: 'flex', alignItems: 'center', gap: '8px', width: '180px', flexShrink: 0 }}>
                          {icon}
                          <span style={{ fontWeight: 'bold' }}>{diff.type === 'RENAMED' ? `[🔄 RENAME DETECTED] (Confidence: ${diff.confidence}%)` : diff.type}</span>
                        </div>
                        <div style={{ color: '#E5E7EB', fontWeight: 'bold', width: '250px', flexShrink: 0, wordBreak: 'break-all' }}>
                          {diff.path}
                        </div>
                        <div style={{ flex: 1, color: '#9CA3AF' }}>
                          {diff.type === 'TYPE_CHANGE' && (
                            <div>
                              <span style={{ color: '#EF4444', fontWeight: 'bold' }}>[BREAKING]</span> {diff.message}
                              <div style={{ color: '#EF4444', marginTop: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <AlertTriangle size={12} /> Type change may break frontend parsing.
                              </div>
                            </div>
                          )}
                          {diff.type === 'VALUE_CHANGE' && (
                            <div>
                              <span style={{ textDecoration: 'line-through', marginRight: '8px', opacity: 0.7 }}>{JSON.stringify(diff.baseValue)}</span>
                              <span style={{ color: '#3B82F6' }}>{JSON.stringify(diff.targetValue)}</span>
                            </div>
                          )}
                          {diff.type === 'RENAMED' && (
                            <div>
                              <span style={{ color: '#E5E7EB' }}>{diff.message}</span>
                            </div>
                          )}
                          {(diff.type === 'ADDED' || diff.type === 'REMOVED') && (
                            <div>
                              {JSON.stringify(diff.value)}
                              {diff.type === 'REMOVED' && (
                                <div style={{ color: '#F97316', marginTop: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <AlertTriangle size={12} /> Removed field may cause undefined errors.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}
