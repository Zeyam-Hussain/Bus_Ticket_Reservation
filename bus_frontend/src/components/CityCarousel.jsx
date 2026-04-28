import React from 'react';
import { motion } from 'framer-motion';

import karachiImg from '../assets/Karachi.jpg';
import lahoreImg from '../assets/Lahore.jpg';
import islamabadImg from '../assets/Islamabad.jpg';
import peshawarImg from '../assets/Peshawar.jpg';

const LEFT_CITIES = [
  { id: 1, name: 'Karachi', image: karachiImg },
  { id: 2, name: 'Lahore', image: lahoreImg },
];

const RIGHT_CITIES = [
  { id: 3, name: 'Islamabad', image: islamabadImg },
  { id: 4, name: 'Peshawar', image: karachiImg },
];

const CityCard = ({ city }) => (
  <motion.div
    className="flex-shrink-0 w-40 h-28 md:w-48 md:h-32 rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg"
    whileHover={{
      scale: 1.05,
      transition: { duration: 0.3 }
    }}
  >
    {/* Image Background */}
    <img 
      src={city.image} 
      alt={city.name} 
      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

    {/* City Name */}
    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
      <h3 className="text-white font-bold text-base md:text-lg tracking-tight">
        {city.name}
      </h3>
      <p className="text-white/70 text-[10px] md:text-xs mt-0.5 md:mt-1">
        Explore routes
      </p>
    </div>

    {/* Animated border */}
    <motion.div
      className="absolute inset-0 border-2 border-white/20 rounded-2xl"
      whileHover={{
        borderColor: "rgba(255, 255, 255, 0.5)",
      }}
    />

    {/* Shine effect on hover */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      initial={{ x: '-100%' }}
      whileHover={{
        x: '100%',
        transition: { duration: 0.6 }
      }}
    />
  </motion.div>
);

const CityCarousel = () => {
  return (
    <div className="relative w-full px-6 md:px-12 mb-12">
      {/* Premium Header Section */}
      <div className="mb-10 text-center md:text-left">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-blue-400 text-xs font-bold tracking-[0.3em] uppercase mb-2 block">
            Exclusive Routes
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Premium Destinations
          </h2>
          <div className="h-1 w-20 bg-blue-500 rounded-full mb-4 mx-auto md:mx-0" />
          <p className="text-gray-400 max-w-2xl text-sm md:text-base">
            Discover the convenience of traveling across Pakistan's most prominent cities with our luxury bus service. Experience comfort and safety on every mile of your journey.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Left Cities */}
        <div className="flex flex-wrap gap-4 md:gap-8 justify-center md:justify-start w-full md:w-auto">
          {LEFT_CITIES.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>

        {/* Right Cities */}
        <div className="flex flex-wrap gap-4 md:gap-8 justify-center md:justify-end w-full md:w-auto">
          {RIGHT_CITIES.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>

      {/* Bottom decorative line */}
      <motion.div
        className="mt-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </div>
  );
};

export default CityCarousel;
