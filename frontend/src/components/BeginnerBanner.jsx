import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '../context/ModeContext';

export default function BeginnerBanner() {
  const { isBeginnerMode } = useMode();

  return (
    <AnimatePresence>
      {isBeginnerMode && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="beginner-banner-scanline w-full flex items-center justify-center gap-2 py-2 px-4"
          style={{
            background: 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.08) 50%, rgba(245,158,11,0.15) 100%)',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <span className="text-sm">👋</span>
          <span
            className="font-['Space_Grotesk'] text-[11px] font-semibold tracking-wider"
            style={{ color: '#F59E0B' }}
          >
            BEGINNER MODE ACTIVE
          </span>
          <span className="text-[#F59E0B]/60 text-[11px] font-['Space_Grotesk']">
            — We're keeping things simple for you
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
