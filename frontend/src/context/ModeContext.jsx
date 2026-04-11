import { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useMode must be used within a ModeProvider');
  return context;
};

export const ModeProvider = ({ children }) => {
  const [isBeginnerMode, setIsBeginnerMode] = useState(() => {
    try {
      return localStorage.getItem('pitwall_mode') === 'beginner';
    } catch {
      return false;
    }
  });

  const [tutorialSeen, setTutorialSeen] = useState(() => {
    try {
      return localStorage.getItem('pitwall_tutorial_seen') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMode = () => {
    setIsBeginnerMode(prev => {
      const newMode = !prev;
      try {
        localStorage.setItem('pitwall_mode', newMode ? 'beginner' : 'expert');
      } catch {}
      return newMode;
    });
  };

  const dismissTutorial = () => {
    setTutorialSeen(true);
    try {
      localStorage.setItem('pitwall_tutorial_seen', 'true');
    } catch {}
  };

  return (
    <ModeContext.Provider value={{
      isBeginnerMode,
      toggleMode,
      tutorialSeen,
      dismissTutorial,
    }}>
      {children}
    </ModeContext.Provider>
  );
};

export default ModeContext;
