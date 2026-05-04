import React, { useState } from 'react';
import LightRays from './components/LightRays';

// Embedded SVGs for the Obsidian Command theme
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);


export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    try {
      setErrorMsg('');
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      if (data.token && onLogin) {
        onLogin(data.token);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async () => {
    try {
      setErrorMsg('');
      const response = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      // Auto-login after successful registration
      handleLogin();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="devforge-login-page" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Background LightRays Effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>
      
      <style>{`
        .devforge-login-page {
          background-color: #0D0D12;
          color: #EDEDED;
          font-family: 'Inter', -apple-system, sans-serif;
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 10;
          padding: 2vh 4vw;
          box-sizing: border-box;
        }

        .sc-text { font-variant: small-caps; letter-spacing: 0.1em; font-size: 0.8em; color: #888888; font-weight: 500; }

        header { width: 100%; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 20; }
        nav a { text-decoration: none; margin-left: 20px; transition: color 0.2s; }
        nav a:hover { color: #EDEDED; }

        .login-card-layout { display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; max-width: 500px; position: relative; z-index: 20; }

        .devforge-title-logo-block { display: flex; align-items: center; margin-bottom: 20px; color: #EDEDED; }
        .devforge-main-title { font-size: 1.8em; font-weight: 700; }
        .devforge-logo-divider { margin: 0 15px; font-size: 1.5em; color: #EDEDED; }
        .obsidian-command-title { position: relative; color: #D88CFF; text-shadow: 0 0 20px hsl(271, 76%, 83%, 0.5); font-size: 2.2em; font-weight: 700; }
        .obsidian-command-title::after { content: ""; position: absolute; width: 10px; height: 10px; background-color: #00E5FF; border-radius: 50%; right: -25px; top: 5px; box-shadow: 0 0 15px #00E5FF, 0 0 30px hsl(186, 100%, 50%, 0.5); }
        .devforge-uplink-subtext { color: #888888; margin-bottom: 40px; }

        .authenticate-form-card { background-color: #141417; border-radius: 12px; width: 120%; padding: 30px; box-sizing: border-box; border: 1px solid hsl(314, 100%, 20%); position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .authenticate-form-card::after { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, hsl(186, 100%, 50%, 0.3), hsl(186, 100%, 50%, 0.05), hsl(186, 100%, 50%, 0.3)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: exclude; pointer-events: none; }

        .form-row-label-row { color: #A0A0A0; margin-bottom: 8px; font-weight: 600; font-size: 0.9em; display: flex; justify-content: flex-start; width: 100%; }
        .access-cipher-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; width: 100%; }

        .uplink-input-group { position: relative; margin-bottom: 25px; width: 100%; }
        .uplink-input-group input { width: 100%; background-color: #0D0D12; color: #EDEDED; border: 1px solid #1F1F22; border-radius: 8px; padding: 15px 15px 15px 50px; font-size: 1em; font-family: 'Inter', sans-serif; box-sizing: border-box; outline: none; transition: border-color 0.2s, background-color 0.2s; }
        .uplink-input-group input::placeholder { color: #555; font-weight: 400; }
        .uplink-input-group input:focus { border-color: hsl(186, 100%, 50%); background-color: hsl(186, 100%, 2%, 0.5); }
        .uplink-input-icon { position: absolute; left: 15px; top: 15px; color: #555; pointer-events: none; }
        .uplink-input-group input:focus + .uplink-input-icon { color: hsl(186, 100%, 50%); }
        .cipher-visibility-icon { position: absolute; right: 15px; top: 15px; color: #888; cursor: pointer; transition: color 0.2s; }
        .cipher-visibility-icon:hover { color: #EDEDED; }

        .forgot-keys-link { font-variant: small-caps; color: hsl(271, 76%, 70%); text-decoration: underline; cursor: pointer; }

        .remember-switch-wrapper { display: flex; align-items: center; margin-bottom: 25px; width: 100%; justify-content: flex-start; }

        .uplink-authenticate-btn { width: 100%; background: linear-gradient(135deg, hsl(271, 76%, 53%), hsl(271, 76%, 83%)); color: #0D0D12; border: none; border-radius: 8px; padding: 15px; font-size: 1.1em; font-weight: 700; font-variant: small-caps; letter-spacing: 0.05em; cursor: pointer; transition: transform 0.1s, box-shadow 0.2s; margin-bottom: 20px; position: relative; box-shadow: 0 0 10px hsl(271, 76%, 53%, 0.3); }
        .uplink-authenticate-btn:hover { transform: translateY(-2px); box-shadow: 0 0 15px hsl(271, 76%, 53%, 0.5), 0 0 30px hsl(271, 76%, 53%, 0.2); }
        .uplink-authenticate-btn:active { transform: translateY(0); }

        .uplink-sub-callout { color: #A0A0A0; margin-bottom: 10px; width: 100%; text-align: center; }
        .register-node-uplink-btn { background-color: transparent; color: #EDEDED; border: none; display: flex; align-items: center; justify-content: center; width: 100%; font-weight: 600; cursor: pointer; transition: color 0.2s; }
        .register-node-uplink-btn:hover { color: hsl(271, 76%, 83%); }

        footer { width: 100%; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 20; }
        .footer-icon { color: #888; font-size: 1.1em; margin-right: 10px; }
      `}</style>

      
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 10 }}>
        <div className="login-card-layout">
          <div className="devforge-title-logo-block">
            <span className="devforge-main-title">DEVFORGE</span>
          </div>
          <p className="devforge-uplink-subtext sc-text">Initialize secure uplink to the central forge.</p>
          
          <div className="authenticate-form-card">
            <div className="form-row-label-row sc-text">IDENTITY VECTOR</div>
            <div className="uplink-input-group">
              <div className="uplink-input-icon"><UserIcon /></div>
              <input 
                type="text" 
                placeholder="username_or_email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="access-cipher-container">
              <div className="form-row-label-row sc-text" style={{ marginBottom: 0 }}>ACCESS CIPHER</div>
      
            </div>
            <div className="uplink-input-group">
              <div className="uplink-input-icon"><LockIcon /></div>
              <input 
                type="password" 
                placeholder="............"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="cipher-visibility-icon"><EyeIcon /></div>
            </div>
            

            
            {errorMsg && <div style={{ color: 'hsl(0, 100%, 70%)', marginBottom: '15px', fontSize: '0.9em' }}>{errorMsg}</div>}

            <button onClick={handleLogin} className="uplink-authenticate-btn">AUTHENTICATE</button>
            <p className="uplink-sub-callout sc-text">NEW NODE IN THE CLUSTER?</p>
            <button onClick={handleRegister} className="register-node-uplink-btn">Register Node<ArrowRightIcon /></button>
          </div>
        </div>
      </main>
    </div>
  );
}