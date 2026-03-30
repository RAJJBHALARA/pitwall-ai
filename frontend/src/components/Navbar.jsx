import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Race Analysis', path: '/race-analysis' },
    { name: 'Rivalry Tracker', path: '/rivalry-tracker' },
    { name: 'Fantasy Picks', path: '/fantasy-picks' },
    { name: 'Lap Explainer', path: '/lap-explainer' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-[24px] border-b border-white/5 shadow-[0px_20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between px-6 md:px-8 h-20 w-full mx-auto max-w-screen-2xl">
        
        {/* Logo */}
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Gauge className="text-[#e10600]" size={32} />
            <span className="text-2xl font-bold tracking-tighter text-white font-['Space_Grotesk'] uppercase">PitWall AI</span>
          </motion.div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-['Space_Grotesk'] tracking-[-0.02em] uppercase">
          {links.map((link, i) => {
            const isActive = location.pathname === link.path;
            return (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  to={link.path}
                  className={`font-medium transition-colors ${
                    isActive
                      ? 'text-[#e10600] border-b-2 border-[#e10600] pb-1 cursor-default pointer-events-none'
                      : 'text-[#999999] hover:text-white hover:text-[#E10600]'
                  }`}
                >
                  {link.name}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            animate={{ 
              boxShadow: [
                "0 0 0px #E10600",
                "0 0 15px #E10600",
                "0 0 0px #E10600"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="hidden md:block bg-[#e10600] text-white px-6 py-2 rounded-xl font-['Space_Grotesk'] font-bold uppercase text-sm tracking-wider hover:bg-[#c00500] active:scale-95 transition-all"
          >
            Live Data
          </motion.button>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 top-20 bg-[#131313] z-40 flex flex-col items-center pt-8 gap-8 border-t border-white/5"
          >
            {links.map((link, i) => {
              const isActive = location.pathname === link.path;
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-wider ${
                      isActive ? 'text-[#e10600]' : 'text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              );
            })}
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 bg-[#e10600] text-white px-8 py-3 rounded-xl font-['Space_Grotesk'] font-bold uppercase tracking-wider"
              onClick={() => setMobileMenuOpen(false)}
            >
              Live Data
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
