// dashboard/src/Login.jsx
import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegistering ? '/register' : '/login';
    
    try {
      const res = await axios.post(`http://localhost:4000${endpoint}`, {
        email,
        password
      });

      if (isRegistering) {
        alert('✅ Account created! Please log in.');
        setIsRegistering(false); // Switch back to login mode
      } else {
        // Success! Send the token up to App.jsx
        onLogin(res.data.token); 
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="subtitle">HookLoop Enterprise</p>
        
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary">
            {isRegistering ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <p className="switch-mode">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <span onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? ' Log In' : ' Register'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;