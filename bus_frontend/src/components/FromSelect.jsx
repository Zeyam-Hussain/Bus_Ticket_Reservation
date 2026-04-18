import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown } from 'lucide-react';

const FromSelect = ({ value, onChange, cities }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (city) => {
    onChange(city);
    setIsOpen(false);
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        From
      </label>
      
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 text-left flex items-center justify-between transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
          <span className="text-lg font-medium text-white">
            {value || 'Select departure city'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f3a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {cities.map((city, index) => (
              <motion.button
                key={city}
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full px-5 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 5 }}
              >
                <MapPin className="w-4 h-4 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
                <span className="text-white font-medium">{city}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FromSelect;
