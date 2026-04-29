import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="login-container">
      {/* Animated background particles/orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-orb-icon"></div>
          <h2>CareGuard</h2>
          <p>You care for others. We care for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Email or Username" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>
          <button type="submit" className="login-btn-primary">
            Continue
          </button>
        </form>

        <div className="login-secondary">
          <a href="#" className="create-account-link">New here? Create account</a>
        </div>

        <div className="login-divider">
          <span>or continue with</span>
        </div>

        <div className="social-login">
          <button className="social-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button className="social-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.05 16.57c-.89 1.28-1.8 2.54-3.21 2.56-1.39.02-1.84-.83-3.41-.83-1.55 0-2.05.81-3.39.85-1.41.04-2.45-1.38-3.35-2.67-1.83-2.62-3.24-7.4-1.36-10.66.93-1.62 2.57-2.65 4.35-2.67 1.36-.02 2.65.92 3.48.92.83 0 2.37-1.12 4.02-.95 1.7.17 3.25.96 4.14 2.29-3.51 2.13-2.95 7.15.54 8.61-.75 1.83-1.6 3.82-2.82 5.55M15.42 5.06c.72-.88 1.2-2.11 1.07-3.32-1.05.04-2.33.7-3.08 1.58-.66.77-1.23 2.03-1.07 3.22 1.17.09 2.36-.6 3.08-1.48"/>
            </svg>
            Apple
          </button>
        </div>

        <div className="login-footer">
          Your privacy matters. No judgment. No pressure.
        </div>
      </div>
    </div>
  );
}
