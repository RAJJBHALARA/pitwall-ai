import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Race Analysis', path: '/race-analysis' },
    { name: 'Rivalry Tracker', path: '/rivalry-tracker' },
    { name: 'Fantasy Picks', path: '/fantasy-picks' },
    { name: 'Standings', path: '/standings' },
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "#0a0a0a",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem"
            }}
          >
            {/* Close Button Top Right */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                color: "white",
                fontSize: "1.5rem",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            {/* Nav links centered in middle */}
            {links.map((link, i) => {
              const isActive = location.pathname === link.path;
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document.body.style.overflow = "unset";
                    }}
                    style={{
                      color: isActive ? "#e10600" : "white",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      textDecoration: "none",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase"
                    }}
                    className="font-['Space_Grotesk']"
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
              className="mt-4 bg-[#e10600] text-white px-8 py-3 rounded-xl font-['Space_Grotesk'] font-bold uppercase tracking-wider"
              onClick={() => {
                setMobileMenuOpen(false);
                document.body.style.overflow = "unset";
              }}
            >
              Live Data
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
