import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Activity, Trophy, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Hide on scroll down
      } else {
        setIsVisible(true); // Show on scroll up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Analysis', path: '/race-analysis', icon: Activity },
    { label: 'Fantasy', path: '/fantasy-picks', icon: Trophy },
    { label: 'Laps', path: '/lap-explainer', icon: Timer },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9900] w-[90%] max-w-sm md:hidden"
        >
          <div
            style={{
              background: 'rgba(8, 8, 8, 0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
            }}
            className="p-2 shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex justify-between items-center relative overflow-hidden"
          >
            {/* Subtle top glare */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {navItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-[#888] hover:text-[#e9bcb5]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                      className="relative z-10"
                    >
                      <item.icon
                        size={22}
                        className={`mb-1 transition-colors ${
                          isActive && item.label === 'Fantasy'
                            ? 'text-[#47efda]'
                            : isActive
                            ? 'text-[#e10600]'
                            : ''
                        }`}
                      />
                    </motion.div>
                    
                    <span className="text-[9px] font-['Space_Grotesk'] font-bold uppercase tracking-widest relative z-10">
                      {item.label}
                    </span>

                    {/* Active State Background/Glow */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileNavIndicator"
                        className={`absolute inset-0 rounded-xl opacity-20 border ${
                          item.label === 'Fantasy'
                            ? 'bg-[#01d2be] border-[#01d2be]'
                            : 'bg-[#e10600] border-[#e10600]'
                        }`}
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
