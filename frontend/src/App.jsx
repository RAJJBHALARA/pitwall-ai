import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import RaceAnalysis from './pages/RaceAnalysis';
import RivalryTracker from './pages/RivalryTracker';
import FantasyPicks from './pages/FantasyPicks';
import LapExplainer from './pages/LapExplainer';
import Standings from './pages/Standings';
import DriverCareer from './pages/DriverCareer';

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="race-analysis" element={<RaceAnalysis />} />
          <Route path="rivalry-tracker" element={<RivalryTracker />} />
          <Route path="fantasy-picks" element={<FantasyPicks />} />
          <Route path="lap-explainer" element={<LapExplainer />} />
          <Route path="standings" element={<Standings />} />
          <Route path="career" element={<DriverCareer />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
