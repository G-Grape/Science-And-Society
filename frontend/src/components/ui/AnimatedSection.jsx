import { motion, useReducedMotion } from 'framer-motion';
import { useDeviceDetect } from '../../lib/useDeviceDetect';

const variantsMap = {
  up: {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 15 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function AnimatedSection({ children, direction = 'up', delay = 0, className = '', style = {}, ...props }) {
  const variants = variantsMap[direction] || variantsMap.up;
  const { isMobile } = useDeviceDetect();
  const prefersReducedMotion = useReducedMotion();

  // For reduced motion users or if delay would be too long, fade only
  const activeVariants = prefersReducedMotion ? variantsMap.fade : variants;

  return (
    <motion.div
      className={className}
      style={{ willChange: 'transform, opacity', ...style }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: isMobile ? '0px' : '-20px' }}
      transition={{
        duration: prefersReducedMotion ? 0.1 : (isMobile ? 0.3 : 0.4),
        delay: prefersReducedMotion ? 0 : delay,
        ease: 'easeOut',
      }}
      variants={activeVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger Container ───────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export function StaggerContainer({ children, className = '', style = {}, ...props }) {
  const { isMobile } = useDeviceDetect();

  return (
    <motion.div
      className={className}
      style={{ willChange: 'opacity', ...style }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: isMobile ? '0px' : '-10px' }}
      variants={containerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger Item ────────────────────────────────────────────────── */
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export function StaggerItem({ children, className = '', style = {}, ...props }) {
  return (
    <motion.div
      className={className}
      style={{ willChange: 'transform, opacity', ...style }}
      variants={itemVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}
