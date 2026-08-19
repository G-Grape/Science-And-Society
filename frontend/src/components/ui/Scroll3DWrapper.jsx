import { motion } from 'framer-motion';
import { useDeviceDetect } from '../../lib/useDeviceDetect';

export function Scroll3DWrapper({ children, direction = 'up' }) {
  const { isMobile, isHeavyAnimationSafe } = useDeviceDetect();

  let initialX = 0;
  let initialY = isMobile ? 50 : 80;
  let initialRotateY = 0;

  if (direction === 'left') {
    initialX = isMobile ? -40 : -120;
    initialY = isMobile ? 20 : 40;
    initialRotateY = isHeavyAnimationSafe ? -15 : 0;
  } else if (direction === 'right') {
    initialX = isMobile ? 40 : 120;
    initialY = isMobile ? 20 : 40;
    initialRotateY = isHeavyAnimationSafe ? 15 : 0;
  }

  return (
    <div style={{
      perspective: isHeavyAnimationSafe ? '1600px' : 'none',
      transformStyle: isHeavyAnimationSafe ? 'preserve-3d' : 'flat',
      overflow: 'visible',
    }}>
      <motion.div
        initial={{ opacity: 0, y: initialY, x: initialX, rotateX: isHeavyAnimationSafe ? -10 : 0, rotateY: initialRotateY, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, x: 0, rotateX: 0, rotateY: 0, scale: 1 }}
        viewport={{ once: true, margin: isMobile ? '0px' : '-5%' }}
        transition={{ duration: isMobile ? 0.6 : 0.8, type: 'spring', bounce: 0.1 }}
        style={{ transformOrigin: 'center center', willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
