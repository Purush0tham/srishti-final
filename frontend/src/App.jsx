import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import './index.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
      {isAuthenticated ? (
        <ChatInterface />
      ) : (
        <Login onLogin={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}
