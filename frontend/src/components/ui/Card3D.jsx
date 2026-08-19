import { motion } from 'framer-motion';

export function Card3D({ children, className = '', style = {} }) {
  return (
    <motion.div
      className={`card-3d ${className}`}
      whileHover={{ y: -4 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'calc(var(--radius) * 1.5)',
        willChange: 'transform',
        ...style,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </motion.div>
  );
}
