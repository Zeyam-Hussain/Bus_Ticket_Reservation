import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';

const DatePickerField = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate available dates (today + next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  const formatDate = (date) => {
    if (!date) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDateShort = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const handleSelect = (date) => {
    onChange(date);
    setIsOpen(false);
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDateShort(date);
  };

  return (
    <motion.div
      className="relative space-y-2"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    >
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Date
      </label>

      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 text-left flex items-center justify-between transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
          <span className="text-lg font-medium text-white">
            {value ? formatDate(value) : 'Select date'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Date Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f3a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {availableDates.map((date, index) => {
                const isSelected = value && date.toDateString() === value.toDateString();
                
                return (
                  <motion.button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleSelect(date)}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-300 flex items-center justify-between group mb-1 ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'hover:bg-white/10'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-blue-400' : 'bg-gray-600'
                      }`} />
                      <div>
                        <div className="text-white font-medium">
                          {getDateLabel(date)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(date)}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-blue-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
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

export default DatePickerField;
