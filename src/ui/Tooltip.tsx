import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Tooltip: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => {
  const [show, setShow] = useState(false);
  
  if (!label) {
    return <>{children}</>;
  }
  
  return (
    <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ position: 'relative' }}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="glass-tier-3"
            style={{
              position: 'absolute', bottom: '110%', left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '6px', padding: '4px 8px',
              fontSize: '11px', color: 'var(--ee-text-primary)',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              zIndex: 99999
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
