// import React from 'react';
// import MockServer from './tools/MockServer';
// import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
// import './App.css'; // Make sure this is imported!
// import EnvValidator from './tools/EnvValidator';
// import Services from './components/Services';

// // Import your tools
// import HookLoop from './tools/HookLoop';
// import JwtDecoder from './tools/JwtDecoder';

// // Helper component for the sidebar links
// const SidebarLink = ({ to, icon, label }) => {
//   const location = useLocation();
//   const isActive = location.pathname === to;
  
//   return (
//     <Link to={to} className={`devforge-link ${isActive ? 'active' : ''}`}>
//       <span style={{fontSize: '1.2rem'}}>{icon}</span>
//       <span>{label}</span>
//     </Link>
//   );
// };

// export default function App() {
//   return (
//     <Router>
//       <div className="devforge-layout">
        
//         {/* ---------------- SIDEBAR NAVIGATION ---------------- */}
//         <div className="devforge-sidebar">
          
//           <div className="devforge-brand">
//             <h1 style={{color: '#58a6ff', margin: 0, fontSize: '24px'}}>🛠️ DevForge</h1>
//           </div>

//           <nav className="devforge-nav">
//             <div className="nav-category">Network Tools</div>
//             <SidebarLink to="/" icon="🪝" label="HookLoop" />
//             <SidebarLink to="/mock" icon="🎭" label="API Mock Server" />
//             <SidebarLink to="/env" icon="⚙️" label=".env Validator" />
            
//             <div className="nav-category" style={{marginTop: '25px'}}>Utilities</div>
//             <SidebarLink to="/jwt" icon="🔐" label="JWT Decoder" />
//           </nav>
          
//           <div style={{padding: '20px', borderTop: '1px solid #1f2937', fontSize: '14px', color: '#6b7280'}}>
//             👨‍💻 Local Dev Workspace
//           </div>
//         </div>

//         {/* ---------------- MAIN CANVAS ---------------- */}
//         <div className="devforge-main">
//           <Routes>
//             {/* Tool #1: HookLoop */}
//             <Route path="/" element={<HookLoop />} />
            
//             {/* Tool #2: JWT Decoder */}
//             <Route path="/jwt" element={<JwtDecoder />} />

//             {/* Placeholder for Mock Server */}
//             <Route path="/mock" element={<MockServer />} />

//             <Route path="/env" element={<EnvValidator />} />
//           </Routes>
//         </div>

//       </div>
//     </Router>
//   );
// }

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Import your components
import Login from './Login'; 
import HookLoop from './tools/HookLoop';
import MockServer from './tools/MockServer';
import EnvValidator from './tools/EnvValidator';
import JwtDecoder from './tools/JwtDecoder';
import RequestForge from './tools/RequestForge';
import SchemaForge from './tools/SchemaForge';
import DotGrid from './components/DotGrid';
import ClickSpark from './components/ClickSpark';

const SidebarLink = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} onClick={onClick} className={`minimal-nav-link ${isActive ? 'active' : ''}`}>
      <span className="minimal-nav-icon">{icon}</span>
      <span className="minimal-nav-label">{label}</span>
    </Link>
  );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!token) {
    return <Login onLogin={(newToken) => setToken(newToken)} />;
  }

  return (
    <Router>
      <ClickSpark
        sparkColor='#fff'
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
      <style>{` 
        :root {
          --bg-base: rgba(11, 11, 12, 0.3);
          --bg-surface: rgba(255, 255, 255, 0.05);
          --bg-hover: rgba(255, 255, 255, 0.1);
          --border-subtle: rgba(255, 255, 255, 0.05);
          --text-primary: #EDEDED;
          --text-secondary: #888888;
          --accent-blurple: #5E6AD2;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: transparent;
          color: var(--text-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        
        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: transparent;
        }

        /* --- MOBILE HEADER --- */
        .mobile-header {
          display: none;
          height: 60px;
          width: 100%;
          background-color: var(--bg-base);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          box-sizing: border-box;
          position: fixed;
          top: 0;
          z-index: 50;
        }

        .hamburger-btn {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 5px;
        }

        /* --- SIDEBAR --- */
        .sidebar {
          width: 260px;
          background-color: var(--bg-base);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          z-index: 40;
        }

        .brand-header {
          height: 80px;
          display: flex;
          align-items: center;
          padding: 0 24px;
        }

        .brand-header h1 {
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .nav-section {
          flex: 1;
          padding: 10px 12px;
          overflow-y: auto;
        }

        .nav-group-title {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 20px 12px 8px 12px;
        }

        .minimal-nav-link {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          margin-bottom: 4px;
          border-radius: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .minimal-nav-link:hover {
          background-color: var(--bg-surface);
          color: var(--text-primary);
        }

        .minimal-nav-link.active {
          background-color: var(--bg-surface);
          color: var(--text-primary);
          font-weight: 500;
        }

        .minimal-nav-icon {
          margin-right: 12px;
          font-size: 1.1rem;
          opacity: 0.8;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid var(--border-subtle);
        }

        .logout-btn {
          width: 100%;
          padding: 10px;
          background-color: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background-color: var(--bg-hover);
          color: #EF4444;
          border-color: #EF4444;
        }

        /* --- MAIN CONTENT --- */
        .main-content {
          flex: 1;
          background-color: transparent;
          overflow-y: auto;
          position: relative;
        }

        /* --- RESPONSIVE QUERIES --- */
        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }
          
          .sidebar {
            position: fixed;
            top: 60px; /* Below mobile header */
            left: 0;
            bottom: 0;
            width: 100%;
            background-color: var(--bg-base);
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .brand-header {
            display: none; /* Hide in mobile since it's in the top bar */
          }

          .main-content {
            margin-top: 60px; /* Make room for mobile header */
          }
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      <div className="app-container" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
            <DotGrid dotSize={3} gap={10} />
        </div>
        {/* Mobile Top Navigation Bar */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
             <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>DevForge</h1>
          </div>
          <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
              )}
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="brand-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" style={{ marginRight: '12px' }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <h1>DevForge</h1>
          </div>

          <nav className="nav-section">
            <div className="nav-group-title">Observability</div>
            <SidebarLink to="/" icon="⚡" label="Traffic Inspector" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/mock" icon="🎭" label="API Synthesizer" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/forge" icon="🚀" label="Request Forge" onClick={() => setIsMobileMenuOpen(false)} />

            <div className="nav-group-title">Security & Utilities</div>
            <SidebarLink to="/env" icon="🔐" label="Env Validator" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/jwt" icon="🎫" label="JWT Decoder" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/schema" icon="🏗️" label="Schema Forge" onClick={() => setIsMobileMenuOpen(false)} />
          </nav>
          
          <div className="sidebar-footer">
            <button onClick={() => setToken(null)} className="logout-btn">
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HookLoop token={token} />} />
            <Route path="/mock" element={<MockServer token={token} />} />
            <Route path="/forge" element={<RequestForge />} />
            <Route path="/jwt" element={<JwtDecoder />} />
            <Route path="/schema" element={<SchemaForge />} />
            <Route path="/env" element={<EnvValidator />} />
          </Routes>
        </main>
      </div>
      </ClickSpark>
    </Router>
  );
}