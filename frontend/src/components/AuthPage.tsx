import { useState, useEffect, useRef } from 'react';
import { Sun, Mail, Lock, User, ArrowRight, Eye, EyeOff, Zap, BarChart2, Leaf, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { motion, useAnimation, useInView, Variants } from 'framer-motion';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#F59E0B' };
    return { score, label: 'Strong', color: '#22C55E' };
}

type Mode = 'signin' | 'signup';

const SPRING: any = { type: "spring", stiffness: 300, damping: 20 };
const BOUNCE_SPRING: any = { type: "spring", stiffness: 400, damping: 15, mass: 0.8 };

const STAGGER_CONTAINER: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const FADE_UP: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: BOUNCE_SPRING }
};

const FEATURE_LIST: Variants = {
    hidden: { opacity: 0, x: -30 },
    show: { opacity: 1, x: 0, transition: SPRING }
};

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { signIn } = useAuthStore();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }
        if (mode === 'signup' && !name.trim()) {
            setError('Please enter your name.');
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { name } }
                });
                if (error) throw error;
                if (data.session) {
                    signIn(data.session.access_token, data.session.user);
                } else {
                    setError('Please check your email to verify your account.');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session) {
                    signIn(data.session.access_token, data.session.user);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
        }
    };

    const toggleMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setError('');
    };

    return (
        <div className="min-h-screen bg-[#060B12] flex overflow-hidden relative font-['DM_Sans',sans-serif] ss-root">

            {/* NOISE & GRID */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.25]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
                }}
            />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* DYNAMIC ORBS TRACKING MOUSE */}
            <motion.div
                className="absolute w-[600px] h-[600px] bg-[#FF6B1A]/10 rounded-full blur-[120px] pointer-events-none"
                animate={{
                    x: mousePos.x - 300,
                    y: mousePos.y - 300,
                }}
                transition={{ type: "tween", ease: "circOut", duration: 1.5 }}
            />
            <motion.div
                className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-[#0A84FF]/10 rounded-full blur-[100px] pointer-events-none"
                animate={{
                    x: mousePos.x * -0.2,
                    y: mousePos.y * -0.2,
                }}
                transition={{ type: "tween", ease: "circOut", duration: 2 }}
            />

            {/* Left Panel — Branding (Hidden on Mobile) */}
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={BOUNCE_SPRING}
                className="hidden lg:flex flex-col justify-between w-[480px] bg-[#0A111C]/60 backdrop-blur-2xl border-r border-[#1E3550] p-12 z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
            >
                <div className="relative z-10">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...BOUNCE_SPRING, delay: 0.2 }}
                        className="flex items-center gap-4 mb-16"
                    >
                        <motion.div
                            whileHover={{ rotate: 90, scale: 1.1 }}
                            transition={SPRING}
                            className="w-12 h-12 bg-gradient-to-br from-[#FF6B1A] to-[#FF9A5C] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,107,26,0.4)]"
                        >
                            <Sun size={26} className="text-white" />
                        </motion.div>
                        <div>
                            <span className="text-[#FF6B1A] font-extrabold text-2xl tracking-tight uppercase" style={{ fontFamily: 'Bebas Neue' }}>Solar</span>
                            <span className="text-white font-extrabold text-2xl tracking-tight uppercase" style={{ fontFamily: 'Bebas Neue' }}>Scope</span>
                        </div>
                    </motion.div>

                    {/* Tagline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...BOUNCE_SPRING, delay: 0.3 }}
                        className="text-4xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight"
                    >
                        Unlock your rooftop's <br />
                        <span className="bg-gradient-to-r from-[#FF6B1A] to-[#FF9A5C] bg-clip-text text-transparent inline-block mt-2">solar potential</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-[#8BA7C2] text-lg leading-relaxed mb-12"
                    >
                        AI + GIS platform that estimates rooftop solar energy using OpenStreetMap data, NASA POWER irradiance, and precision PV simulation.
                    </motion.p>

                    {/* Feature pills */}
                    <motion.div
                        variants={STAGGER_CONTAINER}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {[
                            { icon: Zap, text: 'Instant solar analysis in under 3 seconds', color: 'text-[#FF6B1A]', bg: 'bg-[#FF6B1A]/10', border: 'border-[#FF6B1A]/20' },
                            { icon: BarChart2, text: 'Monthly generation forecasts with financial ROI', color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/10', border: 'border-[#0A84FF]/20' },
                            { icon: Leaf, text: 'CO₂ impact tracking and environmental reports', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20' },
                        ].map((feat, i) => (
                            <motion.div
                                key={feat.text}
                                variants={FEATURE_LIST}
                                whileHover={{ scale: 1.02, x: 5 }}
                                className={`flex items-center gap-4 ${feat.bg} rounded-xl p-4 border ${feat.border} backdrop-blur-md transition-colors`}
                            >
                                <div className={`p-2 rounded-lg bg-[#060B12]/50 ${feat.border} border`}>
                                    <feat.icon size={20} className={feat.color} />
                                </div>
                                <span className="text-[#E8F4FD] font-medium text-sm">{feat.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-[#4A7FA5] text-xs" style={{ fontFamily: 'IBM Plex Mono' }}
                >
                    SOLARSCOPE V1.0 · © 2025
                </motion.p>
            </motion.div>

            {/* Right Panel — Auth Form */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={BOUNCE_SPRING}
                    className="w-full max-w-[440px] relative z-10 bg-[#0A111C]/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-[#1E3550] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B1A] to-[#FF9A5C] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,107,26,0.5)]">
                            <Sun size={20} className="text-white" />
                        </div>
                        <span className="text-[#FF6B1A] font-extrabold text-2xl tracking-tight uppercase" style={{ fontFamily: 'Bebas Neue' }}>Solar</span>
                        <span className="text-white font-extrabold text-2xl tracking-tight uppercase" style={{ fontFamily: 'Bebas Neue' }}>Scope</span>
                    </div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 text-center sm:text-left"
                    >
                        <h2 className="text-3xl font-bold bg-gradient-to-b from-white to-[#8BA7C2] bg-clip-text text-transparent">
                            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-[#8BA7C2] text-sm mt-3 font-medium">
                            {mode === 'signin'
                                ? 'Sign in to access your satellite solar workspace'
                                : 'Get started with instant rooftop analysis'}
                        </p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div layout variants={STAGGER_CONTAINER} initial="hidden" animate="show" className="space-y-5">
                            {/* Name (Sign Up only) */}
                            {mode === 'signup' && (
                                <motion.div variants={FADE_UP} layoutId="nameField">
                                    <label htmlFor="name" className="block text-[#4A7FA5] text-[11px] uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
                                        <User size={12} /> Full Name
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-[#060B12] border border-[#1E3550] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#4A7FA5]
                                                       focus:outline-none focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10 transition-all duration-300"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Email */}
                            <motion.div variants={FADE_UP} layoutId="emailField">
                                <label htmlFor="email" className="block text-[#4A7FA5] text-[11px] uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
                                    <Mail size={12} /> Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full bg-[#060B12] border border-[#1E3550] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#4A7FA5]
                                                   focus:outline-none focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/10 transition-all duration-300"
                                    />
                                </div>
                            </motion.div>

                            {/* Password */}
                            <motion.div variants={FADE_UP} layoutId="passwordField">
                                <label htmlFor="password" className="block text-[#4A7FA5] text-[11px] uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
                                    <Lock size={12} /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full bg-[#060B12] border border-[#1E3550] rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-[#4A7FA5]
                                                   focus:outline-none focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/10 transition-all duration-300 font-data"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-white transition-colors p-1"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </motion.button>
                                </div>

                                {/* Password Strength Meter */}
                                {mode === 'signup' && password.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-3 overflow-hidden"
                                    >
                                        <div className="flex gap-1.5 mb-2">
                                            {[1, 2, 3, 4, 5].map((i) => {
                                                const strength = getPasswordStrength(password);
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        layout
                                                        className="h-1.5 flex-1 rounded-full bg-[#1E3550]"
                                                    >
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: i <= strength.score ? '100%' : '0%' }}
                                                            transition={SPRING}
                                                            style={{ background: strength.color }}
                                                        />
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="flex items-start gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[13px] px-4 py-3.5 rounded-xl font-medium"
                                >
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Submit */}
                            <motion.div variants={FADE_UP} layoutId="submitBtn" className="pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,107,26,0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3
                                             bg-gradient-to-r from-[#FF6B1A] to-[#FF9A5C] hover:from-[#e55a0f] hover:to-[#e58245]
                                             text-white font-bold py-4 rounded-xl text-[15px] shadow-[0_4px_14px_0_rgba(255,107,26,0.39)]
                                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}
                                            <motion.div
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            >
                                                <ArrowRight size={18} />
                                            </motion.div>
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-8 text-center">
                        <p className="text-[#8BA7C2] text-sm font-medium">
                            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-[#FF6B1A] font-bold hover:text-[#FF9A5C] hover:underline underline-offset-4 transition-all ml-1"
                            >
                                {mode === 'signin' ? 'Sign up for free' : 'Sign in securely'}
                            </button>
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#1E3550]" />
                        <span className="text-[#4A7FA5] text-[11px] font-bold uppercase tracking-widest">Or Connect With</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#1E3550]" />
                    </div>

                    {/* Google OAuth Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 53, 80, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 bg-[#060B12] border border-[#1E3550] hover:border-[#4A7FA5] rounded-xl py-3.5 text-sm text-white font-medium transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
