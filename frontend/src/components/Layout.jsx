import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Navbar from './Navbar';

export default function Layout() {
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    const handleSlow = (e) => setShowSlowWarning(e.detail);
    window.addEventListener('slow-api', handleSlow);
    return () => window.removeEventListener('slow-api', handleSlow);
  }, []);

  return (
    <div className="dark min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-['Inter']">
      <Navbar />
      <AnimatePresence>
        {showSlowWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-md"
          >
            <div className="bg-[#1c1b1b] border border-[#e10600]/30 shadow-[0_10px_30px_rgba(225,6,0,0.4)] rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#e10600] shrink-0 mt-0.5" />
              <div>
                <p className="font-['Space_Grotesk'] font-bold text-sm text-white uppercase tracking-widest mb-1">Building Cache</p>
                <p className="text-xs text-[#e9bcb5] font-['Inter'] leading-relaxed">
                  Downloading telemetry data for this session. This may take up to 60 seconds. Thank you for your patience.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="pt-20 pb-24 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
