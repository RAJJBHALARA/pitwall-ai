import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, X } from 'lucide-react';
import { useMode } from '../context/ModeContext';

const FEATURES = [
  { emoji: '🏁', title: 'Race Analysis', desc: 'See who was fastest' },
  { emoji: '⚔️', title: 'Rivalry Tracker', desc: 'Compare two drivers' },
  { emoji: '🤖', title: 'Fantasy Picks', desc: 'AI team suggestions' },
  { emoji: '🏆', title: 'Standings', desc: 'Who is winning in 2026' },
  { emoji: '🔬', title: 'Lap Explainer', desc: 'Break down any lap' },
];

export default function WelcomeTutorial({ onStartTour, onSkip }) {
  const { isBeginnerMode } = useMode();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isBeginnerMode) return;
    if (localStorage.getItem('tutorial_seen') === 'true') return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [isBeginnerMode]);

  const handleStart = () => {
    setShow(false);
    // Small delay for exit animation before starting tour
    setTimeout(() => onStartTour?.(), 300);
  };

  const handleSkip = () => {
    setShow(false);
    localStorage.setItem('tutorial_seen', 'true');
    onSkip?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tutorial-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleSkip}
            className="fixed inset-0 z-[9998]"
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Card */}
          <motion.div
            key="tutorial-card"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: 0.1,
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-2xl overflow-hidden pointer-events-auto"
              style={{
                background: '#1a1a1a',
                borderTop: '4px solid #F59E0B',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.1)',
              }}
            >
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#999] hover:text-white transition-colors z-10"
              >
                <X size={16} />
              </button>

              <div className="p-8 pb-6 flex flex-col items-center">
                {/* Floating lightbulb icon */}
                <motion.div
                  animate={{ y: [-3, 3, -3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-6"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(245,158,11,0.25)',
                        '0 0 25px rgba(245,158,11,0.5)',
                        '0 0 10px rgba(245,158,11,0.25)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.15)' }}
                  >
                    <Lightbulb size={28} className="text-[#F59E0B]" />
                  </motion.div>
                </motion.div>

                {/* Heading */}
                <h2 className="font-['Space_Grotesk'] font-bold text-2xl text-white text-center mb-2">
                  Welcome to Race Control 👋
                </h2>
                <p className="text-[#999] text-sm text-center mb-8 font-['Inter']">
                  New to F1? Let us show you around.
                </p>

                {/* Feature pills grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
                  {FEATURES.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      whileHover={{
                        scale: 1.03,
                        borderColor: '#F59E0B',
                        transition: { duration: 0.15 },
                      }}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 transition-colors"
                      style={{ background: '#222' }}
                    >
                      <span className="text-xl flex-shrink-0">{f.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-['Space_Grotesk'] font-bold text-white text-sm truncate">
                          {f.title}
                        </p>
                        <p className="text-[#888] text-xs truncate">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Buttons */}
                <motion.button
                  onClick={handleStart}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="tutorial-shimmer-btn w-full py-3.5 rounded-xl font-['Space_Grotesk'] font-bold text-sm uppercase tracking-widest text-black flex items-center justify-center gap-2 mb-3"
                >
                  START EXPLORING
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>

                <button
                  onClick={handleSkip}
                  className="w-full py-3 text-[#777] hover:text-white text-xs font-['Space_Grotesk'] font-bold uppercase tracking-widest transition-colors"
                >
                  Skip Tutorial
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
