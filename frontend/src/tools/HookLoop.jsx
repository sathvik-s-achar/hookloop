// src/tools/HookLoop.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode"; 
import { io } from "socket.io-client";
import JsonView from '../JsonView'; 
import Antigravity from '../components/Antigravity';
import { Search, Bell, User, Trash2, BarChart2, CheckCircle2, Clock } from 'lucide-react';
import CountUp from '../components/CountUp';
export default function HookLoop({ token }) { 
  const [userId, setUserId] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHook, setSelectedHook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [latencyList, setLatencyList] = useState([]);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [signatureStatus, setSignatureStatus] = useState('none');
  const [targetUrl, setTargetUrl] = useState('http://localhost:5001/api/webhooks/stripe');

  useEffect(() => {
    const verifySignature = async () => {
      if (!selectedHook || !webhookSecret) {
        setSignatureStatus('none');
        return;
      }
      try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const bodyStr = typeof selectedHook.body === 'string' ? selectedHook.body : JSON.stringify(selectedHook.body);
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyStr));
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const incomingSig = selectedHook.headers?.['x-signature'] || selectedHook.headers?.['x-hub-signature-256'] || selectedHook.headers?.['signature'] || selectedHook.headers?.['X-Signature'];
        
        if (!incomingSig) {
          setSignatureStatus('none');
          return;
        }
        
        const cleanIncoming = incomingSig.replace('sha256=', '');
        if (cleanIncoming === signatureHex) {
          setSignatureStatus('verified');
        } else {
          setSignatureStatus('forged');
        }
      } catch (err) {
        console.error(err);
        setSignatureStatus('forged');
      }
    };
    verifySignature();
  }, [selectedHook, webhookSecret]);

  useEffect(() => {
    if (token) {
      try {
        if (typeof token === 'string' && token.split('.').length >= 2) {
          const decoded = jwtDecode(token);
          setUserId(decoded.id);
        } else {
          console.warn('Invalid token format, using dummy userId');
          setUserId('dummy-user-id');
        }
      } catch (error) {
        console.error('Error decoding JWT:', error);
        setUserId('dummy-user-id');
      }
    }
  }, [token]);

  const fetchWebhooks = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:4000/webhooks', { headers: { Authorization: `Bearer ${token}` } });
      setWebhooks(res.data);
      if (res.data.length > 0) {
        setSelectedHook(res.data[0]); // Select latest by default
      }
    } catch (error) { console.error("Error fetching data:", error); }
  };

  useEffect(() => {
    if (!token || !userId) return;
    fetchWebhooks(); 
    const socket = io("http://localhost:4000");
    socket.emit("join_room", userId);
    socket.on("new_webhook", (newHook) => {
      const ts = newHook.timestamp || new Date().toISOString();
      const hookTime = new Date(ts.includes('Z') ? ts : ts + 'Z').getTime();
      const lat = Math.max(2, Date.now() - hookTime); // real-time pseudo latency computation
      setLatencyList(prev => [...prev.slice(-19), lat]); // retain rolling memory 

      setWebhooks((prev) => {
        const updated = [newHook, ...prev];
        if (updated.length === 1) setSelectedHook(newHook);
        return updated;
      });
    });
    return () => socket.disconnect();
    
  }, [token, userId]);

  const handleClearHistory = async () => {
    if (!window.confirm("Delete all captured traffic?")) return;
    try {
      await axios.delete('http://localhost:4000/webhooks', { headers: { Authorization: `Bearer ${token}` }}); 
      setWebhooks([]); 
      setSelectedHook(null);
    } catch (error) { alert("Failed to clear data."); }
  };

  const handleQuickReplay = async (id, overrideBody = null) => {
    setLoading(true);
    try {
      const payload = { targetUrl };
      if (overrideBody) payload.overrideBody = overrideBody;
      
      await axios.post(`http://localhost:4000/replay/${id}`, payload, { headers: { Authorization: `Bearer ${token}` }});
    } catch (error) { alert('Replay Failed.'); }
    setLoading(false);
  };

  const filteredWebhooks = webhooks.filter((hook) => {
    const searchLower = searchTerm.toLowerCase();
    const bodyString = JSON.stringify(hook.body || {}).toLowerCase();
    const methodStr = (hook.method || '').toLowerCase();
    const idStr = (hook.id || hook._id || '').toString().toLowerCase();
    return methodStr.includes(searchLower) || idStr.includes(searchLower) || bodyString.includes(searchLower);
  });

  const chartData = useMemo(() => {
    const BINS = 11;
    if (!webhooks || webhooks.length === 0) {
      const defaultData = [...Array(BINS)].map(() => ({ height: 4, count: 0, timeLabel: 'No traffic', shortTimeLabel: '--:--' }));
      return { data: defaultData, maxCount: 0 };
    }
    
    const times = webhooks.map(h => {
      const ts = h.timestamp || new Date().toISOString();
      return new Date(ts.includes('Z') ? ts : ts + 'Z').getTime();
    });
    let maxTime = Math.max(...times);
    let minTime = Math.min(...times);
    
    if (maxTime - minTime < 1000) minTime = maxTime - 300000; // 5 min minimum buffer
    
    const range = maxTime - minTime;
    const binSize = range / BINS;
    
    const data = new Array(BINS).fill(0);
    times.forEach(t => {
      let idx = Math.floor((t - minTime) / binSize);
      if (idx >= BINS) idx = BINS - 1;
      if (idx < 0) idx = 0;
      data[idx]++;
    });
    
    const maxCount = Math.max(...data, 1);
    const result = data.map((val, i) => {
      const binStart = new Date(minTime + i * binSize);
      const binEnd = new Date(minTime + (i + 1) * binSize);
      const formatTime = (d) => {
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
      };
      return {
        height: Math.max(4, (val / maxCount) * 100),
        count: val,
        timeLabel: `${formatTime(binStart)} - ${formatTime(binEnd)}`,
        shortTimeLabel: formatTime(binStart) // for x-axis
      };
    });
    
    return { data: result, maxCount: data.every(v => v===0) ? 0 : maxCount };
  }, [webhooks]);

  // Derived real-time metrics
  const validPayloads = webhooks.filter(h => h.body && Object.keys(h.body).length > 0).length;
  const successRate = webhooks.length > 0 ? ((validPayloads / webhooks.length) * 100).toFixed(1) : "100.0";
  const currentAvgLatency = latencyList.length > 0 
    ? Math.round(latencyList.reduce((a, b) => a + b, 0) / latencyList.length) 
    : (webhooks.length > 0 ? 14 : 0);

  return (
    
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#0B0B0C' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} waveAmplitude={1} particleSize={1.5} lerpSpeed={0.05} color="#8B5CF6" autoAnimate particleVariance={1} rotationSpeed={0} depthFactor={1} pulseSpeed={3} particleShape="capsule" fieldStrength={10} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'rgba(11, 11, 12, 0.85)' }}>
        <style>{`
          * {
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          
          /* LAYOUT */
          .hookloop-layout {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100vh;
            color: #E2E8F0;
          }

          /* TOP BAR */
          .hl-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .hl-topbar-left {
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .hl-logo {
            font-size: 1.1rem;
            font-weight: 700;
            color: #ffffff;
            margin-right: 16px;
          }

          .hl-tab {
            color: #8B8B9B;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: color 0.2s;
          }
          
          .hl-tab:hover { color: #ffffff; }
          .hl-tab.active {
            color: #8B5CF6;
            border-bottom: 1px solid #8B5CF6;
            padding-bottom: 4px;
          }

          .hl-topbar-right {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .hl-search-box {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            padding: 6px 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            width: 250px;
          }

          .hl-search-input {
            background: transparent;
            border: none;
            color: #E2E8F0;
            outline: none;
            margin-left: 8px;
            font-size: 0.85rem;
            width: 100%;
          }
          
          .hl-search-input::placeholder { color: #6B7280; }

          /* WORKSPACE CONTENT */
          .hl-workspace {
            flex: 1;
            padding: 32px;
            overflow-y: auto;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
          }

          /* HEADER */
          .hl-header-area {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 32px;
          }

          .hl-title-group { display: flex; align-items: baseline; gap: 16px; margin-bottom: 12px; }
          .hl-title { font-size: 1.75rem; font-weight: 600; color: #ffffff; margin: 0; }
          .hl-subtitle { color: #8B5CF6; font-family: monospace; font-size: 0.9rem; }
          .hl-description { color: #8B8B9B; font-size: 0.9rem; margin: 0; max-width: 600px; line-height: 1.5; }

          .hl-btn-purge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(220, 38, 38, 0.1);
            color: #F87171;
            border: 1px solid rgba(220, 38, 38, 0.2);
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
          }
          
          .hl-btn-purge:hover { background: rgba(220, 38, 38, 0.2); }

          /* CARDS */
          .hl-metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-bottom: 40px;
          }

          .hl-metric-card {
            background: transparent;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .hl-metric-header {
            display: flex;
            justify-content: space-between;
            color: #8B8B9B;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
          }

          .hl-metric-value {
            font-size: 2.25rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
          }

          .hl-metric-subline { font-size: 0.8rem; color: #10B981; }
          .hl-metric-subline.gray { color: #6B7280; }

          /* MOCK CHART */
          .hl-chart-section {
            margin-bottom: 40px;
          }
          .hl-chart-header {
            display: flex;
            justify-content: space-between;
            color: #8B8B9B;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
          }

          .hl-chart-area {
            height: 200px;
            background: transparent;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            display: flex;
            align-items: flex-end;
            padding: 0 40px 24px 40px; /* added space for axis labels */
            gap: 2px;
            position: relative;
            background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 100% 40px, 10% 100%;
          }
          
          .hl-y-axis {
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: 0.6rem;
            color: #6B7280;
            padding-top: 8px;
          }
          
          .hl-chart-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            height: 100%;
            position: relative;
          }

          .hl-bar {
            width: 100%;
            background: rgba(139, 92, 246, 0.4);
            border-top: 2px solid #8B5CF6;
            min-height: 4px;
            transition: height 0.3s;
            cursor: crosshair;
          }
          
          .hl-bar:hover { background: rgba(139, 92, 246, 0.6); }
          
          .hl-x-label {
            position: absolute;
            bottom: -20px;
            font-size: 0.6rem;
            color: #6B7280;
            white-space: nowrap;
          }

          /* SPLIT PANEL */
          .hl-split-panel {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 24px;
            margin-bottom: 60px;
            min-height: 400px;
          }

          .hl-panel-box {
            background: transparent;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .hl-panel-header {
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .hl-panel-title {
            color: #ffffff;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          /* RESPONSIVE DESIGN */
          @media (max-width: 1024px) {
            .hl-metrics-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .hl-split-panel {
              grid-template-columns: 1fr;
            }
            .hl-topbar {
              flex-wrap: wrap;
              gap: 16px;
              padding: 16px;
            }
          }

          @media (max-width: 768px) {
            .hl-metrics-grid {
              grid-template-columns: 1fr;
            }
            .hl-header-area {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
            .hl-btn-purge {
              width: 100%;
              justify-content: center;
            }
            .hl-topbar-right {
              width: 100%;
              justify-content: space-between;
            }
            .hl-search-box {
              flex: 1;
              max-width: none;
            }
            .hl-statusbar {
              flex-direction: column;
              height: auto;
              padding: 12px;
              gap: 8px;
            }
            .hl-status-left, .hl-status-right {
              width: 100%;
              justify-content: space-between;
            }
            .hl-workspace {
              padding: 16px;
            }
            .hl-chart-area {
              padding: 0 16px 24px 16px;
            }
          }

          /* TABLE */
          .hl-table-container {
            flex: 1;
            overflow-y: auto;
          }

          .hl-table {
            width: 100%;
            border-collapse: collapse;
          }

          .hl-table th {
            text-align: left;
            padding: 16px 24px;
            color: #6B7280;
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .hl-table td {
            padding: 16px 24px;
            font-size: 0.85rem;
            color: #E2E8F0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            cursor: pointer;
          }

          .hl-row:hover td { background: rgba(255, 255, 255, 0.03); }
          .hl-row.selected td { background: rgba(139, 92, 246, 0.1); border-left: 2px solid #8B5CF6; }

          .hl-badge-post { background: rgba(139, 92, 246, 0.2); color: #C4B5FD; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
          .hl-badge-get { background: rgba(16, 185, 129, 0.2); color: #6EE7B7; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
          
          .hl-action-text { color: #C4B5FD; font-weight: 600; font-size: 0.75rem; }

          /* PAYLOAD VIEWER */
          .hl-payload-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            background: #0B0B0C;
          }
          .hl-payload-content pre { background: transparent !important; border: none; padding: 0; margin: 0; font-size: 0.85rem; }

          /* STATUS BAR */
          .hl-statusbar {
            height: 40px;
            background: rgba(15, 15, 18, 0.95);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            font-size: 0.75rem;
            color: #8B8B9B;
            font-weight: 600;
          }
          
          .hl-status-left { display: flex; align-items: center; gap: 24px; }
          .hl-status-right { display: flex; align-items: center; gap: 24px; }
          
          .dot-green { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }

          /* MODAL */
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .modal-content {
            background: #111112;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 24px;
            border-radius: 8px;
            width: 500px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .modal-content h2 { margin-top: 0; color: #ffffff; font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; }
          .hl-textarea {
            width: 100%;
            background: #0B0B0C;
            color: #A5D6FF;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            resize: vertical;
            margin-bottom: 20px;
            outline: none;
          }
          .hl-textarea:focus { border-color: #8B5CF6; }
          .modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
          .btn-cancel { background: transparent; color: #8B8B9B; border: 1px solid rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 4px; cursor: pointer; }
          .btn-cancel:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
          .btn-fire { background: #8B5CF6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
          .btn-fire:hover { background: #7C3AED; }

          /* BUTTON ACTIONS */
          .hl-btn-action {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #E2E8F0;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
            cursor: pointer;
            text-transform: uppercase;
            transition: all 0.2s;
          }
          .hl-btn-action:hover { background: rgba(255, 255, 255, 0.1); }
          .hl-btn-action.replay {
            background: rgba(16, 185, 129, 0.15);
            color: #10B981;
            border-color: rgba(16, 185, 129, 0.3);
          }
          .hl-btn-action.replay:hover { background: rgba(16, 185, 129, 0.25); }
          .hl-btn-action.edit {
            background: rgba(139, 92, 246, 0.15);
            color: #C4B5FD;
            border-color: rgba(139, 92, 246, 0.3);
          }
          .hl-btn-action.edit:hover { background: rgba(139, 92, 246, 0.25); }

          .hl-btn-action.chaos { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border-color: rgba(245, 158, 11, 0.3); }
          .hl-btn-action.chaos:hover { background: rgba(245, 158, 11, 0.25); }
          .hl-btn-action.diff { background: rgba(59, 130, 246, 0.15); color: #93C5FD; border-color: rgba(59, 130, 246, 0.3); }
          .hl-btn-action.diff:hover { background: rgba(59, 130, 246, 0.25); }

          .sig-badge { margin-left: 8px; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
          .sig-verified { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
          .sig-forged { background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        `}</style>

        <div className="hookloop-layout">
          
          <div className="hl-topbar">
            <div className="hl-topbar-left">
              <div className="hl-logo">DevForge</div>
            </div>
            
            <div className="hl-topbar-right">
              <div className="hl-search-box">
                <Search size={14} color="#6B7280" />
                <input 
                  type="text" 
                  className="hl-search-input" 
                  placeholder="Filter hooks..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Bell size={18} color="#8B8B9B" />
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2E3039', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#E2E8F0" />
              </div>
            </div>
          </div>

          <div className="hl-workspace">
            
            <div className="hl-header-area">
              <div>
                <div className="hl-title-group">
                  <h1 className="hl-title">Traffic Inspector</h1>
                  
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8B8B9B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Unique Endpoint</span>
                  <code style={{ color: '#10B981', fontSize: '0.85rem', fontFamily: 'monospace' }}>http://localhost:4000/webhook/{userId || '...'}</code>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(11, 11, 12, 0.5)', padding: '6px 12px', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', marginLeft: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8B8B9B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Replay Target URL</span>
                  <input 
                    type="text" 
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="Enter target URL..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#A5D6FF',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.85rem',
                      outline: 'none',
                      width: '300px'
                    }}
                  />
                </div>
              </div>
              
              <button className="hl-btn-purge" onClick={handleClearHistory}>
                <Trash2 size={16} /> PURGE LOGS
              </button>
            </div>

            <div className="hl-metrics-grid">
              
              <div className="hl-metric-card">
                <div className="hl-metric-header">
                  <span>TOTAL REQUESTS</span>
                  <BarChart2 size={16} color="#8B5CF6"/>
                </div>
                <div>
                  <div className="hl-metric-value">
                    <CountUp from={0} to={webhooks.length} duration={1} />
                  </div>
                  <div className="hl-metric-subline">↗ Active session total</div>
                </div>
              </div>

              <div className="hl-metric-card">
                <div className="hl-metric-header">
                  <span>VALID PAYLOADS</span>
                  <CheckCircle2 size={16} color="#10B981" />
                </div>
                <div>
                  <div className="hl-metric-value">
                    <CountUp from={0} to={successRate} duration={1} />%
                  </div>
                  <div style={{ height: '4px', background: '#383b47', marginTop: '12px', display: 'flex', gap: '4px' }}>
                    <div style={{ width: `${Math.round(successRate)}%`, background: '#10B981', borderRadius: '2px' }}></div>
                    <div style={{ width: `${100 - Math.round(successRate)}%`, background: '#2E3039', borderRadius: '2px' }}></div>
                  </div>
                </div>
              </div>

              <div className="hl-metric-card">
                <div className="hl-metric-header">
                  <span>AVG LIVE LATENCY</span>
                  <Clock size={16} color="#6B7280" />
                </div>
                <div>
                  <div className="hl-metric-value">
                    <CountUp from={0} to={currentAvgLatency} duration={1} />
                    <span style={{ fontSize: '1.25rem', color: '#8B8B9B', marginLeft: '4px' }}>ms</span>
                  </div>
                  <div className="hl-metric-subline gray">P99: {Math.max(0, Math.round(currentAvgLatency * 1.8))}MS | P95: {Math.max(0, Math.round(currentAvgLatency * 1.3))}MS</div>
                </div>
              </div>

            </div>

            <div className="hl-chart-section">
              <div className="hl-chart-header">
                <span>TRAFFIC DISTRIBUTION (24H)</span>
                <span style={{ display: 'flex', gap: '16px', fontSize: '0.65rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="dot-purple" style={{ width: '6px', height: '6px', background: '#8B5CF6', borderRadius: '50%' }}></div> POST</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="dot-green" style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></div> GET</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="dot-white" style={{ width: '6px', height: '6px', background: '#E2E8F0', borderRadius: '50%' }}></div> PUT</span>
                </span>
              </div>
              <div className="hl-chart-area">
                <div className="hl-y-axis">
                  <span>{chartData.maxCount}</span>
                  <span>{Math.floor(chartData.maxCount / 2)}</span>
                  <span>0</span>
                </div>
                {chartData.data.map((item, i) => (
                  <div key={i} className="hl-chart-column">
                    <div 
                      className="hl-bar" 
                      style={{ height: `${item.height}%` }}
                      title={`${item.count} requests (${item.timeLabel})`}
                    ></div>
                    {/* Show label for every other column to prevent crowding */}
                    {i % 2 === 0 && <div className="hl-x-label">{item.shortTimeLabel}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="hl-split-panel">
              <div className="hl-panel-box">
                <div className="hl-panel-header">
                  <span className="hl-panel-title">LIVE STREAM</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#10B981' }}>
                    <div className="dot-green"></div> Connected: 127.0.0.1
                  </div>
                </div>
                <div className="hl-table-container">
                  <table className="hl-table">
                    <thead>
                      <tr>
                        <th>TRACE ID</th>
                        <th>METHOD</th>
                        <th>TIMESTAMP</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWebhooks.map((hook, idx) => (
                        <tr 
                          key={hook.id || hook._id || idx} 
                          className={`hl-row ${(selectedHook?.id || selectedHook?._id) === (hook.id || hook._id) ? 'selected' : ''}`}
                          onClick={() => setSelectedHook(hook)}
                        >
                          <td style={{ fontFamily: 'monospace', color: '#A1A1AA' }}>
                            tr_92k_{String(hook.id || hook._id || idx).substring(0,4)}
                          </td>
                          <td>
                            <span className={(hook.method === 'POST' || hook.method === 'post') ? 'hl-badge-post' : 'hl-badge-get'}>
                              {hook.method || 'GET'}
                            </span>
                          </td>
                          <td style={{ color: '#8B8B9B', fontFamily: 'monospace' }}>
                            {(() => {
                              const ts = hook.timestamp || new Date().toISOString();
                              const d = new Date(ts.includes('Z') ? ts : ts + 'Z');
                              let hours = d.getHours();
                              const minutes = d.getMinutes().toString().padStart(2, '0');
                              const seconds = d.getSeconds().toString().padStart(2, '0');
                              const ampm = hours >= 12 ? 'PM' : 'AM';
                              hours = hours % 12;
                              hours = hours ? hours : 12; // the hour '0' should be '12'
                              return `${hours}:${minutes}:${seconds} ${ampm}`;
                            })()}
                          </td>
                          <td className="hl-action-text">PAYLOAD</td>
                        </tr>
                      ))}
                      {filteredWebhooks.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>
                            {webhooks.length > 0 ? "No webhooks match your search filter." : "Awaiting incoming webhooks..."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hl-panel-box">
                <div className="hl-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <span className="hl-panel-title" style={{ color: '#8B8B9B', display: 'flex', alignItems: 'center', gap: '16px', width: '100%', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>Payload: <span style={{ color: '#E2E8F0', fontFamily: 'monospace', marginLeft: '6px' }}>
                      {selectedHook ? `tr_92k_${String(selectedHook.id || selectedHook._id).substring(0,4)}` : '---'}
                    </span>
                    {signatureStatus === 'verified' && <span className="sig-badge sig-verified">[VERIFIED]</span>}
                    {signatureStatus === 'forged' && <span className="sig-badge sig-forged">[FORGED]</span>}
                    </span>
                    
                    {selectedHook && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="hl-btn-action edit" onClick={() => { 
                          setEditBody(JSON.stringify(selectedHook.body || {}, null, 2)); 
                          setIsModalOpen(true); 
                        }}>Edit</button>
                        <button className="hl-btn-action replay" onClick={() => handleQuickReplay(selectedHook.id || selectedHook._id)} disabled={loading}>Replay</button>
                      </div>
                    )}
                  </span>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8B8B9B', textTransform: 'uppercase' }}>HMAC Secret:</span>
                    <input 
                      type="password"
                      placeholder="Enter secret to verify signature..."
                      value={webhookSecret}
                      onChange={e => setWebhookSecret(e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#E2E8F0',
                        fontSize: '0.75rem',
                        outline: 'none',
                        flex: 1
                      }}
                    />
                  </div>
                </div>
                <div className="hl-payload-content">
                  {selectedHook ? (
                    <JsonView data={selectedHook.body} />
                  ) : (
                    <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>Select a trace to inspect payload.</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="hl-statusbar">
            <div className="hl-status-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                <div className="dot-green"></div> BACKEND ONLINE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={12} /> :4000
              </div>
            </div>
            <div className="hl-status-right">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> LAST UPDATE: {new Date().toTimeString().split(' ')[0].substring(0, 8)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleClearHistory}>
                <Trash2 size={12} /> PURGE ALL
              </div>
            </div>
          </div>

          {/* EDIT MODAL */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Edit Payload</h2>
                <textarea 
                  rows={12} 
                  value={editBody} 
                  onChange={(e) => setEditBody(e.target.value)}
                  className="hl-textarea"
                />
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button className="btn-fire" onClick={() => {
                     try {
                       const parsed = JSON.parse(editBody);
                       handleQuickReplay(selectedHook.id || selectedHook._id, parsed).then(() => {
                         setIsModalOpen(false);
                       }).catch(() => alert('Replay Failed.'));
                     } catch(e) {
                       alert('Invalid JSON! Please check format.');
                     }
                  }}>Confirm & Replay</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
    
  
    
  );
}



