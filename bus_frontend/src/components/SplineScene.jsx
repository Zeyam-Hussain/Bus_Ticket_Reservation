import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Spline from '@splinetool/react-spline';

const SplineScene = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
    >
      {/* Floating animation container */}
      <motion.div
        className="w-full h-full"
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Loading fallback */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        )}

        {/* Spline 3D Scene */}
        <Spline
          scene="https://prod.spline.design/hJN0MuroerpN0Dse/scene.splinecode"
          className="bg-transparent"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: 'transparent',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out'
          }}
          onLoad={() => setIsLoading(false)}
        />
      </motion.div>

      {/* Glow effect behind 3D object */}
      <motion.div
        className="absolute inset-0 -z-10 blur-[100px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 100%)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default SplineScene;
