import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const GenderToggle = ({ value, onChange }) => {
  const options = ['Male', 'Female'];

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Gender
      </label>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex gap-1.5">
        {options.map((option) => (
          <motion.button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              value === option
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            whileHover={{ scale: value === option ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {value === option && <User className="w-4 h-4" />}
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default GenderToggle;
