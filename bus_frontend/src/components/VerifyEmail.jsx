import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [shake, setShake] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      // Redirect to register if email is not available in state
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    // Only allow numeric input
    if (value && isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    // Allow only one character
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move focus back on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the fully complete 6-digit code.');
      triggerShake();
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/verify_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      if (data.status === 'success') {
        // Redirect to login after successful verification
        navigate('/login', { state: { message: 'Verification successful! You can now log in.' } });
      } else {
        throw new Error(data.message || 'Invalid OTP.');
      }
    } catch (err) {
      setError(err.message);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsResending(true);
    
    try {
      const response = await fetch('/api/user/resend_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code.');
      }

      // Reset timer and clear OTP inputs
      setTimeLeft(180);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* ── LEFT PANEL — White Background ────────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-5/12 lg:w-[45%] flex-col bg-white p-8 lg:p-12 relative overflow-hidden">
        {/* Soft elegant background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-blue-50 opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 rounded-full bg-indigo-50 opacity-50 blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex flex-shrink-0 items-center gap-3 z-10 mb-6">
          <div className="bg-blue-600 text-white font-black text-base px-2.5 py-1.5 rounded-lg shadow-md shadow-blue-200">
            ar.
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">AllRide</span>
        </div>

        {/* Centered Message Content for verify page */}
        <div className="flex-1 flex flex-col justify-center z-10 pr-4">
            <div className="p-4 rounded-2xl bg-blue-50 w-20 h-20 flex items-center justify-center mb-8 shadow-inner shadow-blue-100/50 border border-blue-100">
               <CheckCircle2 className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-6 leading-tight">
                Thank you for choosing us.
            </h3>
            <p className="text-lg text-gray-600 mb-4 font-medium leading-relaxed">
                We’re committed to making your journey smooth, safe, and entirely reliable.
            </p>
            <p className="text-lg text-gray-600 font-medium leading-relaxed">
                Your account security is our ultimate priority. Complete verification to unlock full access to AllRide.
            </p>
        </div>
      </aside>

      {/* ── RIGHT PANEL — Form Area with Deep Blue Contrast ────────────────────────── */}
      <main className="flex flex-col flex-1 min-h-screen bg-gray-50 md:bg-gradient-to-br md:from-blue-900 md:via-blue-800 md:to-indigo-900 relative">
        {/* Subtle pattern overlay */}
        <div className="hidden md:block absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

        {/* Mobile-only top brand bar */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-white md:hidden">
          <div className="bg-blue-600 text-white font-black text-xs px-2 py-1 rounded shadow-sm relative z-10">
            ar.
          </div>
          <span className="text-lg font-black tracking-tight text-gray-900 relative z-10">AllRide</span>
        </div>

        {/* Centered card */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 md:px-10 z-10">
          <div className={`w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 md:border-none p-8 sm:p-10 transform transition-all ${shake ? 'animate-shake' : ''}`}>
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>

            {/* Back link */}
            <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline mb-8 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Sign Up
            </Link>

            {/* Heading */}
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-sm font-medium text-gray-500 mb-8 max-w-xs">
              Enter the 6-digit code sent to <span className="font-bold text-gray-800">{email}</span>
            </p>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 transition-all">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-8" noValidate>

              {/* OTP Inputs */}
              <div className="flex justify-between gap-2 sm:gap-3 overflow-visible">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-10 sm:w-12 h-14 sm:h-16 text-center text-2xl font-bold rounded-xl border ${
                        digit ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-900'
                    } outline-none placeholder-gray-300
                    focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/20 focus:scale-105
                    shadow-sm transition-all duration-200`}
                    maxLength={1}
                  />
                ))}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || otp.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 mt-4
                           bg-blue-600 hover:bg-blue-700
                           active:scale-[0.98]
                           text-white font-bold text-[15px] py-3.5 rounded-xl
                           shadow-[0_4px_14px_0_theme(colors.blue.300)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]
                           transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            {/* Timer / Resend */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-[13px] font-medium">
                {timeLeft > 0 ? (
                    <div className="text-gray-500 flex items-center justify-center gap-2">
                        Didn't receive code? Resend in <span className="font-bold tracking-wider text-gray-800 tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                ) : (
                    <div className="text-gray-500">
                        Didn't receive code?{' '}
                        <button 
                            type="button"
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-blue-600 font-bold hover:underline transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                            {isResending && <Loader2 className="w-3 h-3 animate-spin"/>}
                            {isResending ? 'Resending...' : 'Resend'}
                        </button>
                    </div>
                )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
