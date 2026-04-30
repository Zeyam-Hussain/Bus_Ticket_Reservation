import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Video import instead of image
import busVideo from '../assets/bus-video.mp4';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      if (data.status === 'success') {
        if (data.data.role === 'admin') {
          throw new Error('Please use the Admin Portal to log in as an administrator.');
        }
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/');
      } else {
        throw new Error(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* ── LEFT PANEL — White Background with Video & Features ──────────────── */}
      <aside className="hidden md:flex md:w-1/2 lg:w-[45%] flex-col bg-white p-8 lg:p-16 relative overflow-hidden">
        
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

        {/* Video Area (Bigger and nicely fitted) */}
        <div className="flex-1 flex items-center justify-center z-10 py-6 min-h-0">
          <div className="relative w-full">
            {/* Soft shadow/glow behind the video that perfectly fits it */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-200 to-blue-50 rounded-[2rem] blur-xl opacity-60"></div>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="relative w-full h-auto object-contain rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-100 transform hover:scale-[1.02] transition-transform duration-500"
            >
              <source src={busVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Beautifully styled Feature List */}
        <div className="z-10 mt-auto pt-6">
          <h3 className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-6 leading-tight">
            Journey with Confidence
          </h3>
          <ul className="space-y-4">
            {[
              'A heritage of reliability — operating since 2000.',
              'Safe & successful: over 200+ rides completed.',
              'Premier transport company recognized across Pakistan.',
            ].map((feat, i) => (
              <li 
                key={i} 
                className="group flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="p-1 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
                </div>
                <span className="text-base font-semibold text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── RIGHT PANEL — Form Area with Deep Blue Contrast ────────────────────────── */}
      <main className="flex flex-col flex-1 min-h-screen bg-gray-50 md:bg-gradient-to-br md:from-blue-900 md:via-blue-800 md:to-indigo-900 relative">
        
        {/* Subtle pattern overlay on the right side for desktop */}
        <div className="hidden md:block absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

        {/* Mobile-only top brand bar */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-white md:hidden">
          <div className="bg-blue-600 text-white font-black text-xs px-2 py-1 rounded shadow-sm relative z-10">
            ar.
          </div>
          <span className="text-lg font-black tracking-tight text-gray-900 relative z-10">AllRide</span>
        </div>

        {/* Centered card */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 z-10 w-full">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg bg-white rounded-[2rem] shadow-2xl border border-gray-100 md:border-none p-8 sm:p-10 md:p-14 lg:p-16 transform transition-all">
            
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
              Sign In
            </h1>
            <p className="text-sm font-medium text-gray-500 mb-8">
              Welcome back — enter your credentials to continue.
            </p>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-shake">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6" noValidate>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                  Email <span className="text-red-500 normal-case">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                             placeholder-gray-400 outline-none
                             focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                  Password <span className="text-red-500 normal-case">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                               placeholder-gray-400 outline-none
                               focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                               transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {showPwd
                      ? <EyeOff className="w-5 h-5" />
                      : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-4
                           bg-blue-600 hover:bg-blue-700
                           active:scale-[0.98]
                           text-white font-bold text-[15px] py-3.5 rounded-xl
                           shadow-[0_4px_14px_0_theme(colors.blue.300)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]
                           transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Signing in…' : 'Continue'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm font-medium text-gray-500 md:text-white/80 border-t border-gray-200 md:border-blue-800/30">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-600 md:text-white font-bold hover:underline transition-colors">
            Sign up here
          </Link>
        </footer>
      </main>
    </div>
  );
};

export default Login;