import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim() || !formData.password) {
            setError('All fields are required.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/user/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed. Please try again.');
            }

            if (data.status === 'success') {
                if (data.data.role === 'admin') {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    localStorage.setItem('user', JSON.stringify(data.data));
                    navigate('/dashboard');
                } else {
                    throw new Error('Unauthorized. Admin access required.');
                }
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

            {/* ── LEFT PANEL — Deep Blue Background (matches Register panel palette) ── */}
            <aside className="hidden md:flex md:w-5/12 lg:w-[45%] flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 lg:p-12 relative overflow-hidden">

                {/* Subtle radial overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

                {/* Brand */}
                <div className="flex flex-shrink-0 items-center gap-3 z-10 mb-10">
                    <div className="bg-white text-gray-900 font-black text-base px-2.5 py-1.5 rounded-lg shadow-md">
                        ar.
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white">AllRide Admin</span>
                </div>

                {/* Hero Text */}
                <div className="z-10 flex-1 flex flex-col justify-center">
                    <div className="p-3 bg-white/10 w-fit rounded-2xl mb-6 backdrop-blur-sm border border-white/10">
                        <ShieldCheck className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                        System<br />
                        <span className="text-gray-400">Administration.</span>
                    </h2>
                    <p className="text-gray-300 text-base font-medium mb-12 max-w-xs leading-relaxed">
                        Secure portal for authorized personnel only. Please sign in with your administrator credentials to continue.
                    </p>
                </div>
            </aside>

            {/* ── RIGHT PANEL — White background with form ────────────────────────── */}
            <main className="flex flex-col flex-1 min-h-screen bg-gray-50 md:bg-white relative">

                {/* Mobile-only top brand bar */}
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-white md:hidden sticky top-0 z-20 shadow-sm">
                    <div className="bg-gray-900 text-white font-black text-xs px-2 py-1 rounded shadow-sm relative z-10">
                        ar.
                    </div>
                    <span className="text-lg font-black tracking-tight text-gray-900 relative z-10">AllRide Admin</span>
                </div>

                {/* Centered card */}
                <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 md:px-10 z-10">
                    <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl md:shadow-none border border-gray-100 md:border-none p-6 sm:p-10">

                        {/* Heading */}
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                            Admin Access
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mb-7">
                            Enter your credentials to access the dashboard.
                        </p>

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-3 mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-shake">
                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4" noValidate>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                                    Email <span className="text-red-500 normal-case">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="admin@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                             placeholder-gray-400 outline-none
                             focus:border-gray-500 focus:bg-white focus:ring-4 focus:ring-gray-500/10
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
                                        name="password"
                                        type={showPwd ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        placeholder="Enter administrator password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                               placeholder-gray-400 outline-none
                               focus:border-gray-500 focus:bg-white focus:ring-4 focus:ring-gray-500/10
                               transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((v) => !v)}
                                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 mt-6
                           bg-gray-900 hover:bg-black
                           active:scale-[0.98]
                           text-white font-bold text-[15px] py-3.5 rounded-xl
                           shadow-[0_4px_14px_0_theme(colors.gray.300)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)]
                           transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {isLoading ? 'Authenticating…' : 'Login as Admin'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-6 text-center text-sm font-medium text-gray-500 border-t border-gray-100">
                    Need an admin account?{' '}
                    <Link to="/admin-auth-register" className="text-gray-900 font-bold hover:underline transition-colors">
                        Register here
                    </Link>
                </footer>
            </main>
        </div>
    );
};

export default AdminLogin;
