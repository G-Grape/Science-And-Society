import { motion } from 'framer-motion';

const line1 = {
  closed: { rotate: 0, y: 0, opacity: 1 },
  open:   { rotate: 45, y: 7, opacity: 1 },
};
const line2 = {
  closed: { opacity: 1, x: 0 },
  open:   { opacity: 0, x: -6 },
};
const line3 = {
  closed: { rotate: 0, y: 0, opacity: 1 },
  open:   { rotate: -45, y: -7, opacity: 1 },
};
const dot = {
  closed: { scale: 1, x: 0, opacity: 1 },
  open:   { scale: 0, opacity: 0 },
};

const transition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };

export default function ElegantMenuIcon({ isOpen }) {
  const state = isOpen ? 'open' : 'closed';

  return (
    <motion.svg
      width="22"
      height="16"
      viewBox="0 0 22 16"
      fill="none"
      animate={state}
      initial="closed"
      style={{ overflow: 'visible' }}
    >
      {/* Line 1 — top */}
      <motion.rect
        x="0" y="0" width="22" height="2" rx="1"
        fill="currentColor"
        variants={line1}
        transition={transition}
        style={{ originX: '11px', originY: '1px' }}
      />
      {/* Line 2 — middle (shorter, with accent dot) */}
      <motion.rect
        x="0" y="7" width="15" height="2" rx="1"
        fill="currentColor"
        variants={line2}
        transition={transition}
      />
      {/* Accent dot on middle line */}
      <motion.circle
        cx="19" cy="8" r="2"
        fill="currentColor"
        variants={dot}
        transition={transition}
        style={{ opacity: 0.55 }}
      />
      {/* Line 3 — bottom */}
      <motion.rect
        x="0" y="14" width="22" height="2" rx="1"
        fill="currentColor"
        variants={line3}
        transition={transition}
        style={{ originX: '11px', originY: '15px' }}
      />
    </motion.svg>
  );
}
