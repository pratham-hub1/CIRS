import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { AmbientCanvas } from '../../components/common/AmbientCanvas';
import { celebrateConfetti } from '../../lib/confetti';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your university email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      celebrateConfetti();
      success('Authenticated successfully. Welcome back!');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-white flex flex-col lg:grid lg:grid-cols-12 relative overflow-hidden selection:bg-white selection:text-black font-sans">
      {/* Background Animated Particle Canvas */}
      <AmbientCanvas particleCount={55} />

      {/* Left Column: Brand Showcase & Institutional Telemetry (Desktop) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-white/[0.06]">
        {/* Top bar */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black font-display font-bold flex items-center justify-center text-sm tracking-wider shadow-sm">
            CI
          </div>
          <div>
            <span className="font-display font-bold tracking-tight text-white text-base">
              CIRS
            </span>
            <span className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              GSFC UNIVERSITY
            </span>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="max-w-xl space-y-6 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CENTRAL RECOVERY SYSTEM • LIVE TELEMETRY</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-display font-semibold tracking-tight text-white leading-[1.15]">
            Autonomous item recovery across campus grounds.
          </h1>

          <p className="text-base text-neutral-400 font-normal leading-relaxed">
            A unified institutional network pairing lost and found articles with multi-attribute AI correlation and cryptographic custody verification.
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-2xl font-display font-semibold text-white">98.4%</div>
              <div className="text-xs text-neutral-400 mt-1">Resolution Rate</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-2xl font-display font-semibold text-white">&lt; 24h</div>
              <div className="text-xs text-neutral-400 mt-1">Custody Turnaround</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-2xl font-display font-semibold text-white">100%</div>
              <div className="text-xs text-neutral-400 mt-1">Audit Traceability</div>
            </div>
          </div>
        </div>

        {/* Bottom Security Pledge */}
        <div className="flex items-center space-x-3 text-xs text-neutral-400 pt-6 border-t border-white/[0.06]">
          <ShieldCheck className="w-4 h-4 text-neutral-300 shrink-0" />
          <span>Restricted to verified students, faculty members, and security personnel.</span>
        </div>
      </div>

      {/* Right Column: Interactive Sign In Card */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative z-10 my-auto w-full">
        <FadeIn className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-white text-black font-display font-bold flex items-center justify-center text-sm mx-auto mb-3">
              CI
            </div>
            <h1 className="text-2xl font-display font-bold text-white">CIRS</h1>
            <p className="text-xs text-neutral-400 mt-1">Campus Item Recovery System • GSFC University</p>
          </div>

          <div className="bg-[#12151D]/90 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-white/[0.08] shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-display font-semibold text-white tracking-tight">
                  Sign In
                </h2>
                <span className="text-[11px] font-mono text-neutral-400">GSFC SSO</span>
              </div>
              <p className="text-xs text-neutral-400">
                Enter your institutional credentials to access your cases.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  University Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gsfcuniversity.ac.in"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  Must end with @gsfcuniversity.ac.in
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full py-2.5 text-xs font-semibold mt-2"
              >
                <span>Authenticate Session</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-neutral-400">
              Need an institutional account?{' '}
              <Link to="/register" className="font-semibold text-white hover:underline">
                Create one now
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>End-to-End Encrypted Session • Argon2id Key Derivation</span>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
