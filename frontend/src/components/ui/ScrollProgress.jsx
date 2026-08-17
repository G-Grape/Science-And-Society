import { motion, useScroll, useSpring } from 'framer-motion';
import { useDeviceDetect } from '../../lib/useDeviceDetect';

export function ScrollProgress() {
  const { isMobile } = useDeviceDetect();
  const { scrollYProgress } = useScroll();
  
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scaleX = isMobile ? scrollYProgress : springProgress;

  return (
    <motion.div
      className="scroll-progress-bar"
      style={{ scaleX }}
    />
  );
}
