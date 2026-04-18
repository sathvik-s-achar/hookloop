import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Power, Terminal, Zap, Globe, Shield, Plus, Trash2, Activity } from 'lucide-react';

export default function ChaosProxy() {
  const [engaged, setEngaged] = useState(false);
  const [targetBaseUrl, setTargetBaseUrl] = useState('http://localhost:5000');
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ passed: 0, dropped: 0, delayed: 0, mutatedReq: 0, mutatedRes: 0, overloaded: 0 });

  // New Rule Form State
  const [newRule, setNewRule] = useState({ route: '/api/.*', method: 'ALL', priority: 1, errorRate: 0, latency: 0, mutateReq: false, mutateRes: false });
  const [socket, setSocket] = useState(null);

  // Connect to the V5 Backend Engine
  useEffect(() => {
    const s = io('http://localhost:4005');
    setSocket(s);

    // Listen for Telemetry
    s.on('chaos_log', (newLog) => {
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    });

    // Listen for Live Metrics
    s.on('metrics_sync', (newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => s.disconnect();
  }, []);

  // Send Engine State when it changes
  useEffect(() => {
    if (socket) {
      socket.emit('update_engine', { masterEngaged: engaged, targetBaseUrl });
    }
  }, [engaged, targetBaseUrl, socket]);

  // Send Rules when they change
  useEffect(() => {
    if (socket) {
      socket.emit('update_rules', rules);
    }
  }, [rules, socket]);

  const addRule = () => {
    setRules([...rules, { ...newRule, active: true, id: Date.now() }]);
  };

  const removeRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const clearLogs = () => setLogs([]);

  const MetricCard = ({ title, value, color }) => (
    <div style={{ background: 'rgba(20,20,22,0.8)', border: `1px solid ${color}40`, borderRadius: '12px', padding: '15px', flex: 1 }}>
      <div style={{ color: '#888', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
      <div style={{ color, fontSize: '24px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#0B0B0C', color: '#FFF', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: 'relative', zIndex: 1, padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header & Master Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
              <Zap size={32} color="#F87171" style={{ filter: 'drop-shadow(0 0 8px rgba(248,113,113,0.5))' }} />
              <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0, letterSpacing: '-0.5px' }}>Chaos Proxy Engine V5</h1>
            </div>
            <p style={{ color: '#888', margin: 0, fontSize: '15px' }}>Rule-based network degradation and payload mutation.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#888' }}>TARGET BASE URL</label>
              <input 
                type="text" 
                value={targetBaseUrl}
                onChange={(e) => setTargetBaseUrl(e.target.value)}
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#60A5FA', fontSize: '16px', outline: 'none', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <button
              onClick={() => setEngaged(!engaged)}
              style={{ width: '50px', height: '50px', borderRadius: '50%', background: engaged ? '#F87171' : '#2A2A2E', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: engaged ? '0 0 30px rgba(248,113,113,0.6)' : 'inset 0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.3s ease' }}
            >
              <Power size={24} color={engaged ? '#FFF' : '#666'} />
            </button>
          </div>
        </div>

        {/* Live Observability Metrics */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <MetricCard title="PASSED" value={metrics.passed} color="#34D399" />
          <MetricCard title="DROPPED" value={metrics.dropped} color="#F87171" />
          <MetricCard title="DELAYED" value={metrics.delayed} color="#FBBF24" />
          <MetricCard title="REQ MUTATED" value={metrics.mutatedReq} color="#F59E0B" />
          <MetricCard title="RES MUTATED" value={metrics.mutatedRes} color="#A855F7" />
          <MetricCard title="OVERLOADED" value={metrics.overloaded} color="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* Rule Builder Form */}
          <div style={{ background: 'rgba(20,20,22,0.6)', border: '1px solid #333', borderRadius: '16px', padding: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Shield size={18} color="#60A5FA" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>New Chaos Rule</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input type="text" placeholder="Route Regex (e.g. /api/users)" value={newRule.route} onChange={e => setNewRule({...newRule, route: e.target.value})} style={{ background: '#000', border: '1px solid #333', color: '#FFF', padding: '10px', borderRadius: '6px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }} />
              <select value={newRule.method} onChange={e => setNewRule({...newRule, method: e.target.value})} style={{ background: '#000', border: '1px solid #333', color: '#FFF', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                <option value="ALL">ALL METHODS</option><option value="GET">GET</option><option value="POST">POST</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#888' }}>PRIORITY</label>
                <input type="number" value={newRule.priority} onChange={e => setNewRule({...newRule, priority: Number(e.target.value)})} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#FFF', padding: '8px', borderRadius: '6px', marginTop: '5px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#F87171' }}>DROP RATE %</label>
                <input type="number" min="0" max="100" value={newRule.errorRate} onChange={e => setNewRule({...newRule, errorRate: Number(e.target.value)})} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#FFF', padding: '8px', borderRadius: '6px', marginTop: '5px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#FBBF24' }}>LATENCY (ms)</label>
                <input type="number" min="0" value={newRule.latency} onChange={e => setNewRule({...newRule, latency: Number(e.target.value)})} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#FFF', padding: '8px', borderRadius: '6px', marginTop: '5px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A855F7' }}>
                <input type="checkbox" checked={newRule.mutateReq} onChange={e => setNewRule({...newRule, mutateReq: e.target.checked})} /> Corrupt Request
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A855F7' }}>
                <input type="checkbox" checked={newRule.mutateRes} onChange={e => setNewRule({...newRule, mutateRes: e.target.checked})} /> Corrupt Response
              </label>
            </div>

            <button onClick={addRule} style={{ width: '100%', background: '#3B82F6', color: '#FFF', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Deploy Rule
            </button>
          </div>

          {/* Active Rules Table */}
          <div style={{ background: 'rgba(20,20,22,0.6)', border: '1px solid #333', borderRadius: '16px', padding: '25px', overflowY: 'auto', maxHeight: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Activity size={18} color="#34D399" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Active Firewall Rules</h3>
            </div>
            
            {rules.length === 0 ? (
               <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>No active rules. Traffic is flowing safely.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rules.sort((a,b) => b.priority - a.priority).map((r) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${r.errorRate > 0 ? '#F87171' : r.latency > 0 ? '#FBBF24' : '#A855F7'}` }}>
                    <div>
                      <div style={{ color: '#FFF', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{r.method} {r.route}</div>
                      <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                        Priority: {r.priority} | Drop: {r.errorRate}% | Delay: {r.latency}ms | Mutate: {r.mutateReq ? 'REQ ' : ''}{r.mutateRes ? 'RES' : ''}
                      </div>
                    </div>
                    <button onClick={() => removeRule(r.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Terminal Log */}
        <div style={{ background: '#050505', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '12px 20px', borderBottom: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={16} color="#888" />
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>LIVE MUTATION LOG</span>
            </div>
            <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>CLEAR</button>
          </div>
          
          <div style={{ height: '300px', padding: '20px', overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: '1.6' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '8px', opacity: 0.9 }}>
                <span style={{ color: '#555' }}>[{log.timestamp}]</span>
                <span style={{ color: '#A855F7', width: '40px' }}>{log.method}</span>
                <span style={{ color: '#E0E0E0', width: '200px' }}>{log.route}</span>
                <span style={{ color: '#666', width: '60px' }}>{log.latency}ms</span>
                <span style={{ color: log.color, fontWeight: '600', width: '100px' }}>[{log.type}]</span>
                <span style={{ color: '#888', fontStyle: 'italic' }}>Rule: {log.ruleTriggered}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}