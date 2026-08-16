import { motion } from 'framer-motion';

export function GoldUnderline({ width = 260 }) {
  // A slight organic wave to simulate hand-drawn ink
  const d = `M4 6 C ${width * 0.2} 2, ${width * 0.4} 8, ${width * 0.58} 5 S ${width * 0.85} 7, ${width - 4} 5`;

  return (
    <svg
      width={width}
      height={10}
      viewBox={`0 0 ${width} 10`}
      fill="none"
      style={{ display: 'block', marginTop: '0.3rem', overflow: 'visible' }}
    >
      <motion.path
        d={d}
        stroke="#c9a84c"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{
          pathLength: { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 },
          opacity: { duration: 0.3, delay: 0.2 }
        }}
      />
    </svg>
  );
}
