import { useState, useEffect } from 'react';

export default function MeditationModal({ onClose }) {
  const [phase, setPhase] = useState('Inhale...');

  useEffect(() => {
    // A simple 4-4-4 breathing cycle state machine
    let cycle = 0;
    
    const runCycle = () => {
      setPhase('Breathe In...');
      setTimeout(() => {
        setPhase('Hold...');
        setTimeout(() => {
          setPhase('Breathe Out...');
        }, 4000);
      }, 4000);
    };

    runCycle();
    const intervalId = setInterval(runCycle, 12000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="meditation-overlay">
      <div className="meditation-card glass-card">
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        
        <h3>Take a Moment</h3>
        <p className="meditation-subtitle">Follow the orb. Breathe deeply.</p>

        <div className="orb-container">
          <div className="breathing-orb"></div>
          <div className="orb-text">{phase}</div>
        </div>

      </div>
    </div>
  );
}
