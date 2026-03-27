import React from 'react';
import MockServer from './tools/MockServer';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css'; // Make sure this is imported!
import EnvValidator from './tools/EnvValidator';

// Import your tools
import HookLoop from './tools/HookLoop';
import JwtDecoder from './tools/JwtDecoder';

// Helper component for the sidebar links
const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`devforge-link ${isActive ? 'active' : ''}`}>
      <span style={{fontSize: '1.2rem'}}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default function App() {
  return (
    <Router>
      <div className="devforge-layout">
        
        {/* ---------------- SIDEBAR NAVIGATION ---------------- */}
        <div className="devforge-sidebar">
          
          <div className="devforge-brand">
            <h1 style={{color: '#58a6ff', margin: 0, fontSize: '24px'}}>🛠️ DevForge</h1>
          </div>

          <nav className="devforge-nav">
            <div className="nav-category">Network Tools</div>
            <SidebarLink to="/" icon="🪝" label="HookLoop" />
            <SidebarLink to="/mock" icon="🎭" label="API Mock Server" />
            <SidebarLink to="/env" icon="⚙️" label=".env Validator" />
            
            <div className="nav-category" style={{marginTop: '25px'}}>Utilities</div>
            <SidebarLink to="/jwt" icon="🔐" label="JWT Decoder" />
          </nav>
          
          <div style={{padding: '20px', borderTop: '1px solid #1f2937', fontSize: '14px', color: '#6b7280'}}>
            👨‍💻 Local Dev Workspace
          </div>
        </div>

        {/* ---------------- MAIN CANVAS ---------------- */}
        <div className="devforge-main">
          <Routes>
            {/* Tool #1: HookLoop */}
            <Route path="/" element={<HookLoop />} />
            
            {/* Tool #2: JWT Decoder */}
            <Route path="/jwt" element={<JwtDecoder />} />

            {/* Placeholder for Mock Server */}
            <Route path="/mock" element={<MockServer />} />

            <Route path="/env" element={<EnvValidator />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}