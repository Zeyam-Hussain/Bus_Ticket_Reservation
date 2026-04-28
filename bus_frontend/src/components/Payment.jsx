import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const T = {
  bg: '#080c1f',
  grad: 'linear-gradient(135deg, #080c1f 0%, #0d1235 55%, #131a42 100%)',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.09)',
  borderBright: 'rgba(255,255,255,0.18)',
  accent: '#f5c842',
  accentDark: '#c9a020',
  text: '#eef2ff',
  muted: '#8896b0',
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trip = {}, bus = {}, selectedSeats = [], seatGenders = {}, totalPrice = 0 } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorPop, setErrorPop] = useState(null);

  // Form states with functional demo placeholders
  const [cardName, setCardName] = useState('John Doe');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/26');
  const [cvv, setCvv] = useState('123');
  const [mobileNumber, setMobileNumber] = useState('0300 1234567');

  // Fallback check: if accessed directly without state, redirect
  useEffect(() => {
    if (selectedSeats.length === 0) {
      navigate('/book');
    }
  }, [selectedSeats, navigate]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'card' && (!cardName || !cardNumber || !expiry || !cvv)) {
        setErrorPop("Please fill all card details correctly.");
        return;
    }
    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !mobileNumber) {
        setErrorPop("Please enter your mobile number for the wallet.");
        return;
    }
    
    setLoading(true);
    setErrorPop(null);

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
          route_id: bus.id,
          seats: selectedSeats.map(id => ({ seat_id: id, gender: seatGenders[id] === 'male' ? 'Male' : 'Female' }))
      };

      const res = await fetch('/api/booking/book.php', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              ...(token ? {'Authorization': `Bearer ${token}`} : {})
          },
          body: JSON.stringify(payload)
      });
      const json = await res.json();
      
      if (res.ok && json.status === 'success') {
          // ── Step 2: Record payment for each booking & confirm it in DB ──────
          const bookingIds = json.booking_ids || [];
          const amountPerSeat = parseFloat((totalPrice / (bookingIds.length || 1)).toFixed(2));

          const paymentErrors = [];

          for (const bid of bookingIds) {
              try {
                  const payRes = await fetch('/api/payment/process.php', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({
                          booking_id: bid,
                          total_amount: amountPerSeat,
                          payment_method: paymentMethod  // card | bank | easypaisa | jazzcash
                      })
                  });

                  const payJson = await payRes.json();

                  if (!payRes.ok || payJson.status !== 'success') {
                      paymentErrors.push(payJson.message || `Payment failed for booking #${bid}.`);
                  }
              } catch (netErr) {
                  paymentErrors.push(`Network error for booking #${bid}. Check your connection.`);
              }
          }

          if (paymentErrors.length > 0) {
              // Bookings are in DB as 'pending' — surface the real error
              setErrorPop(
                  `Booking recorded but payment failed: ${paymentErrors[0]} ` +
                  `Please contact support with your booking reference.`
              );
              setLoading(false);
          } else {
              // ✅ All payments written to DB, bookings are now 'confirmed'
              setSuccess(true);
              setTimeout(() => navigate('/'), 3000);
          }
      } else {
          setErrorPop(json.message || 'Booking failed. Please try again.');
          setLoading(false);
      }
    } catch (error) {
      setErrorPop('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: T.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.borderBright}`, borderRadius: 24, padding: '50px 40px',
          textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          animation: 'fadeUp 0.5s ease', maxWidth: 450, width: '90%'
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style={{ color: '#fff', fontSize: 28, fontFamily: 'Syne, sans-serif', marginBottom: 12 }}>Payment Successful!</h2>
          <p style={{ color: T.muted, fontSize: 16 }}>Your seats have been successfully reserved and tickets are booked.</p>
          <div style={{ marginTop: 30, color: T.accent, fontSize: 14 }}>Redirecting to home...</div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`,
    color: '#fff', fontSize: 15, padding: '14px 16px', borderRadius: 12,
    fontFamily: 'DM Sans, sans-serif', outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLoad { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: ${T.accent} !important; box-shadow: 0 0 0 3px rgba(245,200,66,0.1); }
      `}</style>

      <div style={{ minHeight: '100vh', background: T.grad, fontFamily: 'DM Sans, sans-serif', color: T.text, padding: '40px 20px' }}>
        
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 40, animation: 'fadeUp 0.3s ease' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: T.muted, background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 14, transition: 'color 0.2s',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back
            </button>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, margin: 0, color: '#fff' }}>Secure Checkout</h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30, alignItems: 'start' }}>
            
            {/* Left Column: Payment Details */}
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: '30px', 
                backdropFilter: 'blur(20px)', boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
              }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: T.text, marginBottom: 20 }}>Select Payment Method</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 30 }}>
                  {[
                    { id: 'card', label: 'Credit Card', icon: '💳' },
                    { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
                    { id: 'easypaisa', label: 'EasyPaisa', icon: '📱' },
                    { id: 'jazzcash', label: 'JazzCash', icon: '💸' },
                  ].map(method => (
                    <div 
                      key={method.id} 
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: '16px', borderRadius: 16, border: `1px solid ${paymentMethod === method.id ? T.accent : T.border}`,
                        background: paymentMethod === method.id ? 'rgba(245,200,66,0.05)' : 'rgba(0,0,0,0.2)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)',
                        transform: paymentMethod === method.id ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{method.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: paymentMethod === method.id ? 700 : 500, color: paymentMethod === method.id ? T.accent : T.muted }}>
                        {method.label}
                      </span>
                      {paymentMethod === method.id && (
                         <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.accent, boxShadow: `0 0 8px ${T.accent}` }} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePayment}>
                  {paymentMethod === 'card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.3s ease' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cardholder Name</label>
                        <input type="text" placeholder="e.g. Test User" value={cardName} onChange={e => setCardName(e.target.value)} style={inputStyle} required />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <input type="text" placeholder="e.g. 4242 4242 4242 4242" maxLength="19" value={cardNumber} onChange={e => {
                                let val = e.target.value.replace(/\D/g, '');
                                val = val.replace(/(\d{4})/g, '$1 ').trim();
                                setCardNumber(val);
                            }} style={{ ...inputStyle, paddingLeft: 46 }} required />
                          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry Date</label>
                          <input type="text" placeholder="12/26" maxLength="5" value={expiry} onChange={e => {
                              let val = e.target.value.replace(/\D/g, '');
                              if(val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                              setExpiry(val);
                          }} style={inputStyle} required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CVC/CVV</label>
                          <input type="password" placeholder="123" maxLength="4" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, ''))} style={inputStyle} required />
                        </div>
                      </div>
                    </div>
                  )}

                  {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.3s ease' }}>
                       <div>
                        <label style={{ display: 'block', fontSize: 12, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Mobile Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 0300 1234567" 
                          value={mobileNumber} 
                          onChange={e => setMobileNumber(e.target.value)} 
                          style={inputStyle} 
                          required 
                        />
                      </div>
                      <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: `1px dashed ${T.borderBright}` }}>
                        <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>
                          A prompt will be sent to your mobile device.<br/>Please authorize the payment in your app.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                     <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: `1px dashed ${T.borderBright}` }}>
                        <p style={{ color: T.muted, fontSize: 14 }}>
                          You have selected <strong>Bank Transfer</strong>.<br/> 
                          Transfer instructions will be sent to your email after checkout.
                        </p>
                     </div>
                  )}

                  <div style={{ marginTop: 24, fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Payments are secure and encrypted
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Summary */}
            <div style={{ animation: 'fadeUp 0.5s ease' }}>
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: '30px', 
                backdropFilter: 'blur(20px)', position: 'sticky', top: 30
              }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: T.text, marginBottom: 20 }}>Order Summary</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{trip.fromCity || 'KAR'} → {trip.toCity || 'LAH'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bus</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{bus.company || 'All Ride'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ fontSize: 14, color: T.muted }}>Number of Seats</span>
                     <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selectedSeats.length}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ fontSize: 14, color: T.muted }}>Base Fare</span>
                     <span style={{ fontSize: 14, color: '#fff' }}>PKR {totalPrice.toLocaleString()}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ fontSize: 14, color: T.muted }}>Service Fee</span>
                     <span style={{ fontSize: 14, color: '#fff' }}>Free</span>
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderTop: `1px dashed ${T.borderBright}`, marginBottom: 24 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>Total Amount</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: T.accent }}>
                    PKR {totalPrice.toLocaleString()}
                  </span>
                </div>

                {errorPop && (
                   <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 12, color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
                     {errorPop}
                   </div>
                )}

                <button 
                  onClick={handlePayment} 
                  disabled={loading}
                  style={{
                    width: '100%', background: loading ? 'rgba(245,200,66,0.5)' : T.accent, color: '#080c1f', 
                    border: 'none', padding: '16px', borderRadius: 14, 
                    fontSize: 16, fontWeight: 800, fontFamily: 'Syne, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 8px 25px rgba(245,200,66,0.3)'
                  }}
                  onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(245,200,66,0.4)'; } }}
                  onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,200,66,0.3)'; } }}
                >
                  {loading ? (
                    <span style={{ display: 'inline-block', animation: 'pulseLoad 1s infinite' }}>Processing...</span>
                  ) : (
                    `Complete Payment`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
