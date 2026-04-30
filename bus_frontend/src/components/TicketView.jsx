import React from 'react';
import { Plane } from 'lucide-react';

const TicketView = ({ ticket }) => {
  if (!ticket) return null;

  const {
    booking_id,
    source_city,
    destination_city,
    departure_time,
    seat_number,
    passenger_name,
    registration_number
  } = ticket;

  // Format date and time
  let date = 'N/A';
  let time = 'N/A';
  if (departure_time) {
    const d = new Date(departure_time);
    date = d.toISOString().split('T')[0].replace(/-/g, '/');
    time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const name = passenger_name || 'GUEST PASSENGER';
  const flight = registration_number || 'BUS-01';
  const seat = seat_number || 'N/A';
  const gate = 'MAIN';

  // Extract short codes for cities (first 3 letters usually)
  const sourceCode = (source_city || 'SRC').substring(0, 3).toUpperCase();
  const destCode = (destination_city || 'DST').substring(0, 3).toUpperCase();

  return (
    <div className="flex flex-col md:flex-row w-full max-w-[900px] mx-auto rounded-2xl overflow-hidden shadow-2xl relative font-sans" style={{ isolation: 'isolate' }}>
      
      {/* LEFT SIDE (Dark Blue) */}
      <div className="relative flex-1 bg-[#050B14] text-white p-6 md:p-10 flex flex-col justify-between overflow-hidden min-h-[300px]">
        {/* World Map Background (SVG Pattern) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 Q 50 10 50 50 T 90 90' stroke='white' fill='none' stroke-width='2' opacity='0.5'/%3E%3Ccircle cx='20' cy='30' r='2' fill='white'/%3E%3Ccircle cx='80' cy='60' r='3' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover'
        }}></div>

        {/* Top Row */}
        <div className="relative z-10 flex justify-between items-start mb-8">
          <h1 className="text-3xl md:text-4xl tracking-widest font-serif">Boarding Pass</h1>
          <div className="flex gap-8 text-right">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Passenger:</p>
              <p className="text-sm font-semibold">{name}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Bus / Flight:</p>
              <p className="text-sm font-semibold">{flight}</p>
            </div>
          </div>
        </div>

        {/* Middle Row (Cities) */}
        <div className="relative z-10 flex justify-between items-center my-8 md:my-12 px-4">
          <div className="text-4xl md:text-5xl font-black tracking-wider uppercase text-center w-1/3">
            {source_city || 'CITY'}
          </div>
          
          <div className="flex-1 flex justify-center items-center">
             <Plane className="w-16 h-16 md:w-24 md:h-24 text-white transform rotate-45" strokeWidth={1} />
          </div>

          <div className="text-4xl md:text-5xl font-black tracking-wider uppercase text-center w-1/3">
            {destination_city || 'CITY'}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="relative z-10 grid grid-cols-4 gap-4 mt-auto border-t border-white/10 pt-6">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Date:</p>
            <p className="text-sm md:text-base font-semibold">{date}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Time:</p>
            <p className="text-sm md:text-base font-semibold">{time}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Gate:</p>
            <p className="text-sm md:text-base font-semibold">{gate}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Seat:</p>
            <p className="text-sm md:text-base font-semibold">{seat}</p>
          </div>
        </div>

        {/* Barcode on Dark Side (from the second image provided) */}
        <div className="absolute bottom-6 right-8 hidden md:block">
            <div className="h-10 w-40" style={{
                background: 'repeating-linear-gradient(to right, white, white 2px, transparent 2px, transparent 4px, white 4px, white 5px, transparent 5px, transparent 8px, white 8px, white 12px, transparent 12px, transparent 14px)'
            }}></div>
            <p className="text-[8px] text-center mt-1 text-gray-400 tracking-widest">{booking_id}0003554562</p>
        </div>
      </div>

      {/* RIGHT SIDE (Light/White) - Tear off section */}
      <div className="relative bg-[#F8F9FA] text-[#050B14] w-full md:w-[300px] p-6 md:p-8 flex flex-col justify-between border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gray-300">
        
        {/* Top */}
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Passenger:</p>
                <p className="text-base font-bold">{name}</p>
            </div>
            <div className="text-right">
                <p className="text-[14px] font-black uppercase tracking-wider">{source_city}</p>
                <Plane className="w-5 h-5 ml-auto my-1 transform rotate-45" />
                <p className="text-[14px] font-black uppercase tracking-wider">{destination_city}</p>
            </div>
        </div>

        {/* Middle */}
        <div className="my-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Bus / Flight:</p>
            <p className="text-base font-bold">{flight}</p>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Date:</p>
                <p className="text-sm font-bold">{date}</p>
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Time:</p>
                <p className="text-sm font-bold">{time}</p>
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gate:</p>
                <p className="text-sm font-bold">{gate}</p>
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Seat:</p>
                <p className="text-sm font-bold">{seat}</p>
            </div>
        </div>

        {/* Vertical Barcode */}
        <div className="absolute right-4 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 flex items-center gap-1">
            <p className="text-[6px] transform -rotate-90 origin-right text-gray-500 whitespace-nowrap">00035545620</p>
            <div className="w-10 h-32 md:h-48" style={{
                background: 'repeating-linear-gradient(to bottom, #050B14, #050B14 2px, transparent 2px, transparent 4px, #050B14 4px, #050B14 5px, transparent 5px, transparent 8px, #050B14 8px, #050B14 12px, transparent 12px, transparent 14px)'
            }}></div>
        </div>
      </div>
      
    </div>
  );
};

export default TicketView;
