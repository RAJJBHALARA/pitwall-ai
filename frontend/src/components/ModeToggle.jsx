import { motion } from 'framer-motion';
import { useMode } from '../context/ModeContext';

export default function ModeToggle({ compact = false }) {
  const { isBeginnerMode, toggleMode } = useMode();

  return (
    <button
      onClick={toggleMode}
      className="relative flex items-center rounded-full overflow-hidden"
      style={{
        background: '#1c1b1b',
        width: compact ? 164 : 188,
        height: compact ? 32 : 38,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      aria-label={`Switch to ${isBeginnerMode ? 'Expert' : 'Beginner'} mode`}
    >
      {/* Sliding pill indicator */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-[2px] rounded-full"
        style={{
          width: compact ? 'calc(50% - 2px)' : 'calc(50% - 2px)',
          height: compact ? 28 : 34,
          left: isBeginnerMode ? 'calc(50%)' : '2px',
          background: isBeginnerMode
            ? 'linear-gradient(135deg, #F59E0B, #D97706)'
            : 'linear-gradient(135deg, #e10600, #b30500)',
          boxShadow: isBeginnerMode
            ? '0 0 16px rgba(245,158,11,0.4)'
            : '0 0 16px rgba(225,6,0,0.4)',
        }}
      />

      {/* Expert side */}
      <div
        className="relative z-10 flex items-center justify-center gap-1 flex-1 h-full cursor-pointer select-none"
        style={{
          color: isBeginnerMode ? '#666' : '#fff',
          transition: 'color 0.2s',
        }}
      >
        <span className="text-xs">🏁</span>
        <span
          className="font-['Space_Grotesk'] font-bold tracking-wider"
          style={{ fontSize: 11 }}
        >
          EXPERT
        </span>
      </div>

      {/* Beginner side */}
      <div
        className="relative z-10 flex items-center justify-center gap-1 flex-1 h-full cursor-pointer select-none"
        style={{
          color: isBeginnerMode ? '#fff' : '#666',
          transition: 'color 0.2s',
        }}
      >
        <span className="text-xs">👋</span>
        <span
          className="font-['Space_Grotesk'] font-bold tracking-wider"
          style={{ fontSize: 11 }}
        >
          BEGINNER
        </span>
      </div>
    </button>
  );
}
