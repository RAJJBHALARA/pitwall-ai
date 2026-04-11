import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function CustomDropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && <label className="text-[10px] font-bold text-[#e9bcb5] tracking-widest uppercase px-1">{label}</label>}
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
          }}
          className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.06] transition-all cursor-pointer group"
        >
          <span className="font-['Space_Grotesk'] font-bold text-sm tracking-tight text-white">{value}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-[#999999] group-hover:text-[#ffb4a8] transition-colors" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{
                transformOrigin: 'top',
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
              }}
              className="absolute z-50 w-full mt-2 shadow-2xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((opt) => {
                  const isActive = opt === value;
                  return (
                    <div
                      key={opt}
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      style={{
                        borderLeft: isActive ? '2px solid #E10600' : '2px solid transparent',
                      }}
                      className={`px-4 py-3 text-sm font-['Space_Grotesk'] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'text-white bg-white/[0.05]'
                          : 'text-[#999999] hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
