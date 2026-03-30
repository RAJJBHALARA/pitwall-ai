import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useStaggerChildren(defaultDuration = 0.4, defaultStagger = 0.1) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Performance rule: cut duration by 30% if mobile, skip if reduced motion
  const duration = shouldReduceMotion ? 0 : isMobile ? defaultDuration * 0.7 : defaultDuration;
  // Performance rule: remove staggers above 0.3s total on mobile
  const stagger = shouldReduceMotion ? 0 : isMobile ? Math.min(defaultStagger, 0.3) : defaultStagger;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger } },
    exit: { transition: { staggerChildren: stagger, staggerDirection: -1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: isMobile ? 10 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration, ease: "easeOut" } },
    exit: { opacity: 0, y: isMobile ? -5 : -10, transition: { duration: duration * 0.8 } }
  };

  return { isMobile, shouldReduceMotion, containerVariants, itemVariants, duration, stagger };
}
