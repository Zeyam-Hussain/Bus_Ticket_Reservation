import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────
   COLOR SYSTEM — extracted from Book.jsx
   bg: #0a0e27 → #0f1638 → #1a1f3a
   card: rgba(255,255,255,0.05)
   border: rgba(255,255,255,0.10)
   accent: #f5c842  (gold CTA, contrasts dark)
   accent2: #4ade80 (seat badge green)
   text: #ffffff / #a0aec0 (gray-400)
───────────────────────────────────────── */

const THEME = {
  bg: 'linear-gradient(135deg, #0a0e27 0%, #0f1638 50%, #1a1f3a 100%)',
  card: 'rgba(255,255,255,0.04)',
  cardHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.09)',
  borderHover: 'rgba(255,255,255,0.18)',
  accent: '#f5c842',
  accentDark: '#c9a020',
  seatBadge: '#4ade80',
  seatBadgeBg: 'rgba(74,222,128,0.15)',
  text: '#ffffff',
  muted: '#a0aec0',
  tabActive: 'rgba(245,200,66,0.15)',
};

/* ─────────────── DATA FETCHING & FORMATTING ─────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const calculateDuration = (startStr, endStr) => {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr.replace(' ', 'T'));
  const end = new Date(endStr.replace(' ', 'T'));
  let diffMs = end - start;
  // If arrival is before departure, assume it's next day
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
};

const getAmenities = (busType) => {
  if (!busType) return ['ac'];
  const type = busType.toLowerCase();
  if (type.includes('business') || type.includes('sleeper')) return ['wifi', 'usb', 'ac', 'water', 'tv'];
  if (type.includes('executive') || type.includes('premium')) return ['wifi', 'ac', 'tv', 'usb'];
  if (type.includes('non-ac')) return ['water'];
  return ['ac', 'water']; // default for AC/Standard
};

/* ─────────────── ICONS ─────────────────── */
const AmenityIcon = ({ type }) => {
  const icons = {
    wifi: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    ),
    usb: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M12 2v8"/><path d="M9 5l3-3 3 3"/><path d="M7 14h10l-1 5H8l-1-5z"/>
      </svg>
    ),
    ac: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M8 16L4 20"/><path d="M16 16l4 4"/><path d="M12 2v20"/><path d="M2 12h20"/>
        <path d="M8 8L4 4"/><path d="M16 8l4-4"/>
      </svg>
    ),
    water: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ),
    tv: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 2l-4 5-4-5"/>
      </svg>
    ),
  };
  return <span style={{ color: THEME.muted }}>{icons[type]}</span>;
};

/* ─────────────── BUS ANIMATION ─────────────────── */
const BusRoute = ({ departure, arrival, duration, from, to, index }) => {
  const busRef = useRef(null);
  useEffect(() => {
    let frame;
    // Apply a staggered starting position based on index (simulating a delay)
    let pos = (index * 40) % 100;
    const tick = () => {
      pos = (pos + 0.15) % 100;
      if (busRef.current) busRef.current.style.left = `${pos}%`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [index]);

  return (
    <div style={{ flex: 1, minWidth: 0, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Times row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: THEME.muted, marginBottom: 2 }}>Departure</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: THEME.text, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{departure}</div>
          <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>{from.slice(0,3).toUpperCase()}</div>
        </div>
        <div style={{ fontSize: 11, color: THEME.muted }}>{duration}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: THEME.muted, marginBottom: 2 }}>Arrival</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: THEME.text, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{arrival}</div>
          <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>{to.slice(0,3).toUpperCase()}</div>
        </div>
      </div>

      {/* Dotted line + animated bus */}
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        {/* Dotted line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          borderTop: `2px dashed rgba(255,255,255,0.18)`,
          transform: 'translateY(-50%)'
        }} />
        {/* Arrow head */}
        <div style={{
          position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderLeft: '8px solid rgba(255,255,255,0.3)',
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
        }} />
        {/* Animated bus */}
        <div
          ref={busRef}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%) translateX(-50%)',
            willChange: 'left',
            zIndex: 2,
            filter: 'drop-shadow(0 0 6px rgba(245,200,66,0.7))',
          }}
        >
          <svg viewBox="0 0 36 18" width="36" height="18" fill="none">
            {/* Bus body */}
            <rect x="1" y="2" width="32" height="13" rx="3" fill="#f5c842" opacity="0.9"/>
            {/* Windows */}
            <rect x="4" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
            <rect x="11" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
            <rect x="18" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
            <rect x="25" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
            {/* Wheels */}
            <circle cx="8" cy="15.5" r="2.5" fill="#1a1f3a" stroke="#f5c842" strokeWidth="1"/>
            <circle cx="26" cy="15.5" r="2.5" fill="#1a1f3a" stroke="#f5c842" strokeWidth="1"/>
            {/* Headlight */}
            <rect x="30" y="6" width="3" height="4" rx="1" fill="#fff" opacity="0.8"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── PRICE PANEL ─────────────────── */
const PricePanel = ({ price, seatsLeft }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 140 }}>
    <div style={{
      background: THEME.seatBadgeBg,
      border: `1px solid rgba(74,222,128,0.3)`,
      color: THEME.seatBadge,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {seatsLeft} Seats left
    </div>
    <div style={{
      background: THEME.accent,
      borderRadius: 14,
      padding: '14px 20px',
      textAlign: 'center',
      minWidth: 130,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#ffd54f'; e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = THEME.accent; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ fontSize: 11, color: '#1a1200', fontWeight: 500, marginBottom: 2 }}>Starting from</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0a0e27', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
        PKR {price.toLocaleString()}
      </div>
    </div>
  </div>
);

/* ─────────────── BUS CARD ─────────────────── */
const BusCard = ({ bus, index }) => {
  const [hovered, setHovered] = useState(false);
  const style = {
    background: hovered ? THEME.cardHover : THEME.card,
    border: `1px solid ${hovered ? THEME.borderHover : THEME.border}`,
    borderRadius: 20,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset' : '0 4px 16px rgba(0,0,0,0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    cursor: 'pointer',
    animationDelay: `${index * 80}ms`,
    animationFillMode: 'both',
    animation: 'fadeUp 0.5s ease forwards',
    opacity: 0,
  };

  return (
    <div style={style} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* LEFT: Company info + amenities */}
      <div style={{ minWidth: 160, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: THEME.text, fontFamily: 'Syne, sans-serif', marginBottom: 2 }}>
          {bus.company}
        </div>
        <div style={{ fontSize: 10, color: THEME.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Company Name
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#c4cfe8', marginBottom: 1 }}>
          {bus.type}
        </div>
        <div style={{ fontSize: 10, color: THEME.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Bus Type
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {bus.amenities.map(a => (
            <span key={a} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <AmenityIcon type={a} />
            </span>
          ))}
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ width: 1, alignSelf: 'stretch', background: THEME.border, flexShrink: 0 }} />

      {/* CENTER: Route animation */}
      <BusRoute
        departure={bus.departure}
        arrival={bus.arrival}
        duration={bus.duration}
        from={bus.from}
        to={bus.to}
        index={index}
      />

      {/* DIVIDER */}
      <div style={{ width: 1, alignSelf: 'stretch', background: THEME.border, flexShrink: 0 }} />

      {/* RIGHT: Price */}
      <PricePanel price={bus.price} seatsLeft={bus.seatsLeft} />
    </div>
  );
};

/* ─────────────── FILTER TABS ─────────────────── */
const FilterTabs = ({ active, setActive }) => {
  const tabs = ['Cheapest', 'Recommended', 'Highest'];
  return (
    <div style={{
      display: 'inline-flex',
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      borderRadius: 16,
      padding: 4,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: active === tab ? 700 : 500,
            fontFamily: 'Syne, sans-serif',
            color: active === tab ? THEME.accent : THEME.muted,
            background: active === tab ? THEME.tabActive : 'transparent',
            borderColor: active === tab ? `rgba(245,200,66,0.3)` : 'transparent',
            borderStyle: 'solid',
            borderWidth: 1,
            transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)',
            transform: active === tab ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

/* ─────────────── HERO SECTION ─────────────────── */
const HeroSection = ({ from, to, gender, date }) => (
  <div style={{
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 20,
    padding: '20px 28px',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    flexWrap: 'wrap',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    animation: 'fadeUp 0.5s ease forwards',
    opacity: 0,
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: THEME.accent, letterSpacing: '0.12em', textTransform: 'uppercase', width: '100%', marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>
      ✦ Trip Details
    </div>
    {[
      { label: 'From', value: from },
      { label: 'To', value: to },
      { label: 'Gender', value: gender },
      { label: 'Travel Date', value: date },
    ].map((item, i) => (
      <React.Fragment key={item.label}>
        <div style={{ flex: '1 1 120px', minWidth: 100 }}>
          <div style={{ fontSize: 11, color: THEME.muted, marginBottom: 4, letterSpacing: '0.04em' }}>{item.label}:</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text, fontFamily: 'Syne, sans-serif' }}>{item.value}</div>
        </div>
        {i < 3 && (
          <div style={{ width: 1, height: 40, background: THEME.border, margin: '0 20px', flexShrink: 0 }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// Sorting handled dynamically in BusResults hook

/* ─────────────── CURSOR GLOW ─────────────────── */
const CursorGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const move = e => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px';
        ref.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div ref={ref} style={{
      position: 'fixed', pointerEvents: 'none', zIndex: 9999,
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(100,130,255,0.07) 0%, transparent 70%)',
      transform: 'translate(-50%,-50%)',
      transition: 'opacity 0.3s',
    }} />
  );
};

/* ─────────────── MAIN COMPONENT ─────────────────── */
const BusResults = () => {
  const location = useLocation();
  const { 
    fromCity = 'Karachi', 
    toCity = 'Rawalpindi', 
    gender = 'Male', 
    date = 'Nov 15th, 2024' 
  } = location.state || {};

  const [activeFilter, setActiveFilter] = useState('Recommended');
  const [busesData, setBusesData] = useState([]);
  const [displayedBuses, setDisplayedBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/route/search.php?source=${encodeURIComponent(fromCity)}&destination=${encodeURIComponent(toCity)}`);
        const json = await res.json();
        
        if (json.status === 'success' && json.data) {
          const mapped = json.data.map((r) => ({
            id: r.route_id,
            company: 'All Ride',
            type: r.bus_type || 'Standard',
            from: r.source_city,
            to: r.destination_city,
            departure: formatTime(r.departure_time),
            arrival: formatTime(r.arrival_time),
            duration: calculateDuration(r.departure_time, r.arrival_time),
            price: parseFloat(r.base_fare),
            seatsLeft: r.available_seats !== null ? parseInt(r.available_seats) : parseInt(r.total_capacity || 40),
            amenities: getAmenities(r.bus_type)
          }));
          setBusesData(mapped);
        } else {
          setBusesData([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to securely connect to the database. Please try again.');
        setBusesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have both cities
    if (fromCity && toCity) {
      fetchRoutes();
    } else {
      setIsLoading(false);
    }
  }, [fromCity, toCity]);

  useEffect(() => {
    let sorted = [...busesData];
    if (activeFilter === 'Cheapest') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (activeFilter === 'Highest') {
      sorted.sort((a, b) => b.price - a.price);
    }
    setDisplayedBuses(sorted);
  }, [busesData, activeFilter]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb1 {
          0%,100% { transform: scale(1); opacity: 0.3; }
          50%      { transform: scale(1.2); opacity: 0.5; }
        }
        @keyframes orb2 {
          0%,100% { transform: scale(1.2); opacity: 0.2; }
          50%      { transform: scale(1); opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <CursorGlow />

      <div style={{
        minHeight: '100vh',
        background: THEME.bg,
        fontFamily: 'DM Sans, sans-serif',
        color: THEME.text,
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-10%', right: '20%',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            borderRadius: '50%', animation: 'orb1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '25%',
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
            borderRadius: '50%', animation: 'orb2 10s ease-in-out infinite',
          }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

          {/* Page title */}
          <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease forwards', opacity: 0 }}>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800, lineHeight: 1.1,
              background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Available Buses
            </h1>
            <p style={{ color: THEME.muted, marginTop: 6, fontSize: 15 }}>
              Select your preferred journey below
            </p>
          </div>

          {/* Hero section */}
          <div style={{ marginBottom: 24 }}>
            <HeroSection from={fromCity} to={toCity} gender={gender} date={date} />
          </div>

          {/* Filter tabs */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <FilterTabs active={activeFilter} setActive={setActiveFilter} />
            <div style={{ color: THEME.muted, fontSize: 13 }}>
              <span style={{ color: THEME.text, fontWeight: 600 }}>{displayedBuses.length}</span> buses found
            </div>
          </div>

          {/* Bus list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: THEME.muted, fontSize: 16, animation: 'fadeUp 0.5s ease forwards' }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${THEME.border}`, borderTopColor: THEME.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                Searching best routes...
              </div>
            ) : error ? (
              <div style={{
                textAlign: 'center', padding: '80px 20px', background: THEME.card,
                border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 24,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                animation: 'fadeUp 0.6s ease forwards'
              }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#f87171', marginBottom: 12 }}>
                  Connection Failed
                </h2>
                <p style={{ color: THEME.muted, fontSize: 16, maxWidth: 450, margin: '0 auto', lineHeight: 1.6 }}>{error}</p>
              </div>
            ) : displayedBuses.length > 0 ? (
              displayedBuses.map((bus, i) => (
                <BusCard key={bus.id} bus={bus} index={i} />
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: THEME.card,
                border: `1px solid ${THEME.border}`,
                borderRadius: 24,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                animation: 'fadeUp 0.6s ease forwards',
              }}>
                <div style={{
                  width: 80, height: 80, margin: '0 auto 24px',
                  background: 'radial-gradient(circle, rgba(245,200,66,0.15) 0%, transparent 70%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: `1px solid rgba(245,200,66,0.3)`
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.5" width="36" height="36">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: THEME.text, marginBottom: 16 }}>
                  Route Not Available
                </h2>
                <p style={{ color: THEME.muted, fontSize: 16, maxWidth: 450, margin: '0 auto', lineHeight: 1.6 }}>
                  We couldn't find any "All Ride" buses traveling from <strong style={{color: THEME.text}}>{fromCity}</strong> to <strong style={{color: THEME.text}}>{toCity}</strong> on the selected date. Please try adjusting your route.
                </p>
              </div>
            )}
          </div>

          {/* Bottom spacing */}
          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

export default BusResults;