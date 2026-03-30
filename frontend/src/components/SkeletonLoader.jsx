import { motion } from 'framer-motion';

export default function SkeletonLoader({ type = 'default', className = '' }) {
  const shimmerStyle = {
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s infinite linear'
  };

  if (type === 'driver') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`bg-[#1c1b1b] rounded-2xl overflow-hidden border border-white/5 ${className}`}
      >
        <div className="h-48 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" style={shimmerStyle} />
        <div className="p-6 space-y-3">
          <div className="h-5 w-32 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded" style={shimmerStyle} />
          <div className="h-3 w-20 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded" style={shimmerStyle} />
          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
            <div className="h-4 w-16 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded" style={shimmerStyle} />
            <div className="h-8 w-24 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-lg" style={shimmerStyle} />
          </div>
        </div>
        <style>{`
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0 }
            100% { background-position: -200% 0 }
          }
        `}</style>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`relative overflow-hidden bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-lg ${className}`}
      style={shimmerStyle}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </motion.div>
  );
}
