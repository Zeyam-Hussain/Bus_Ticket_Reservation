import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FromSelect from './FromSelect';
import ToSelect from './ToSelect';
import GenderToggle from './GenderToggle';
import DatePickerField from './DatePickerField';
import SearchButton from './SearchButton';
import CityCarousel from './CityCarousel';
// import SplineScene from './SplineScene';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'];

const Book = () => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [gender, setGender] = useState('');
  const [date, setDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  // Trigger initial animation
  useEffect(() => {
    setTimeout(() => setShowForm(true), 300);
  }, []);

  // Determine available cities for "To" (exclude selected "From" city)
  const availableToCities = CITIES.filter(city => city !== fromCity);

  // Check if all fields are filled
  const isFormComplete = fromCity && toCity && gender && date;

  const handleSearch = () => {
    console.log('Search:', { fromCity, toCity, gender, date });
    // Navigate to BookResult with state
    navigate('/book-result', { 
      state: { 
        fromCity, 
        toCity, 
        gender, 
        date: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1638] to-[#1a1f3a] text-white font-sans overflow-hidden relative">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          className="px-6 md:px-12 pt-8 pb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-[1600px] mx-auto w-full relative z-20">

          {/* LEFT: Booking Form */}
          <motion.div
            className="space-y-8 relative z-50"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: showForm ? 1 : 0, x: showForm ? 0 : -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Title */}
            <div className="space-y-3">
              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Where are you
                <br />
                going?
              </motion.h1>
              <motion.p
                className="text-gray-400 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Book your journey with premium comfort
              </motion.p>
            </div>

            {/* Glassmorphism Card Container */}
            <motion.div
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            >
              {/* FROM Field */}
              <FromSelect
                value={fromCity}
                onChange={setFromCity}
                cities={CITIES}
              />

              {/* TO Field - appears after FROM is selected */}
              <AnimatePresence>
                {fromCity && (
                  <ToSelect
                    value={toCity}
                    onChange={setToCity}
                    cities={availableToCities}
                  />
                )}
              </AnimatePresence>

              {/* GENDER & DATE Row - appears after TO is selected */}
              <AnimatePresence>
                {toCity && (
                  <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    {/* GENDER Toggle */}
                    <GenderToggle
                      value={gender}
                      onChange={setGender}
                    />

                    {/* DATE Picker */}
                    <DatePickerField
                      value={date}
                      onChange={setDate}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SEARCH Button - appears when all fields are filled */}
              <AnimatePresence>
                {isFormComplete && (
                  <SearchButton onClick={handleSearch} />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* RIGHT: 3D Spline Scene */}
          <div className="hidden lg:block relative h-[600px]">
            {/* <SplineScene /> */}
          </div>
        </div>

        {/* Mobile 3D Scene (below form on mobile) */}
        <div className="lg:hidden px-6 pb-8">
          <div className="relative h-[400px] rounded-3xl overflow-hidden">
            {/* <SplineScene /> */}
          </div>
        </div>

        {/* Bottom City Carousel */}
        <div className="pb-12">
          <CityCarousel />
        </div>
      </div>
    </div>
  );
};

export default Book;
