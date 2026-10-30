import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useVelocity, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, Cpu, Key, FileCheck2, ChevronDown, Activity, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { AmbientCanvas } from '../../components/common/AmbientCanvas';
import { GlassCard } from '../../components/common/GlassCard';
import { DynamicTicker } from '../../components/common/DynamicTicker';
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

  // Subtle & warm spring bounce on text when scrolling or wheeling
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Primary text spring (stiffness: 160, damping: 24, mass: 0.6) - warm, organic
  const smoothVelocity = useSpring(scrollVelocity, {
    stiffness: 160,
    damping: 24,
    mass: 0.6,
  });
  const textBounceY = useTransform(smoothVelocity, [-1200, 0, 1200], [4.5, 0, -4.5]);

  // Secondary text spring (slightly softer for organic micro-lag)
  const smoothVelocitySubtle = useSpring(scrollVelocity, {
    stiffness: 120,
    damping: 22,
    mass: 0.8,
  });
  const subtextBounceY = useTransform(smoothVelocitySubtle, [-1200, 0, 1200], [6, 0, -6]);

  // Interactive mouse wheel impulse
  const wheelOffset = useMotionValue(0);
  const smoothWheel = useSpring(wheelOffset, { stiffness: 180, damping: 22, mass: 0.5 });

  useEffect(() => {
    let decayTimer: any;
    const handleWheel = (e: WheelEvent) => {
      const delta = Math.max(-6, Math.min(6, e.deltaY * 0.035));
      wheelOffset.set(delta);
      clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        wheelOffset.set(0);
      }, 60);
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(decayTimer);
    };
  }, [wheelOffset]);

  const combinedBounceY = useTransform(
    [textBounceY, smoothWheel],
    ([scrollVal, wheelVal]: any) => Number(scrollVal) + Number(wheelVal)
  );

  const combinedSubtextBounceY = useTransform(
    [subtextBounceY, smoothWheel],
    ([scrollVal, wheelVal]: any) => Number(scrollVal) + Number(wheelVal) * 1.2
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your university email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login({ email: email.trim(), password });
      try {
        sessionStorage.setItem(
          'cirs_welcome_event',
          JSON.stringify({
            type: 'login',
            role: loggedUser?.role || 'STUDENT',
            name: loggedUser?.name || email.trim().split('@')[0],
            timestamp: Date.now(),
          })
        );
      } catch {
        // storage fallback
      }
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
    <div className="min-h-screen bg-[#08090C] text-white flex flex-col relative overflow-x-hidden selection:bg-white selection:text-black font-sans scroll-smooth">
      {/* Background Animated Particle Canvas with Dynamic Scroll Warp */}
      <AmbientCanvas particleCount={95} />

      {/* Hero Section: Split-Screen Sign In */}
      <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 relative z-10 w-full">
        {/* Left Column: Brand Showcase & Institutional Telemetry (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-white/[0.06]">
          {/* Top bar */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black font-display font-bold flex items-center justify-center text-sm tracking-wider shadow-sm">
              CI
            </div>
            <motion.div style={{ y: combinedBounceY }}>
              <span className="font-display font-bold tracking-tight text-white text-base">
                CIRS
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                GSFC UNIVERSITY
              </span>
            </motion.div>
          </div>

          {/* Center Hero Copy */}
          <div className="max-w-xl space-y-6 my-auto py-12">
            <motion.div
              style={{ y: combinedBounceY }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CENTRAL RECOVERY SYSTEM • LIVE TELEMETRY</span>
            </motion.div>

            <motion.h1
              style={{ y: combinedBounceY }}
              className="text-4xl xl:text-5xl font-display font-semibold tracking-tight text-white leading-[1.15]"
            >
              Autonomous item recovery across campus grounds.
            </motion.h1>

            <motion.p
              style={{ y: combinedSubtextBounceY }}
              className="text-base text-neutral-400 font-normal leading-relaxed"
            >
              A unified institutional network pairing lost and found articles with multi-attribute AI correlation and cryptographic custody verification.
            </motion.p>

            {/* Metric cards */}
            <motion.div
              style={{ y: combinedSubtextBounceY }}
              className="grid grid-cols-3 gap-3 pt-4"
            >
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
            </motion.div>
          </div>

          {/* Bottom Security Pledge & Scroll Anchor */}
          <motion.div
            style={{ y: combinedSubtextBounceY }}
            className="flex items-center justify-between text-xs text-neutral-400 pt-6 border-t border-white/[0.06]"
          >
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-neutral-300 shrink-0" />
              <span>Restricted to verified students, faculty members, and security personnel.</span>
            </div>
            <a
              href="#architecture"
              className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <span>Platform Architecture</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </a>
          </motion.div>
        </div>

        {/* Right Column: Interactive Sign In Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative z-10 my-auto w-full">
          <FadeIn className="w-full max-w-md">
            {/* Mobile Header */}
            <motion.div style={{ y: combinedBounceY }} className="lg:hidden text-center mb-8">
              <div className="w-11 h-11 rounded-xl bg-white text-black font-display font-bold flex items-center justify-center text-sm mx-auto mb-3">
                CI
              </div>
              <h1 className="text-2xl font-display font-bold text-white">CIRS</h1>
              <p className="text-xs text-neutral-400 mt-1">Campus Item Recovery System • GSFC University</p>
            </motion.div>

            {/* Interactive Sign-In GlassCard with 3D Tilt & Specular Sheen Hover Effect */}
            <GlassCard
              enableTilt
              enableSheen
              className="p-7 sm:p-9 rounded-3xl border border-white/[0.08] hover:border-white/[0.22] hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-all duration-300 space-y-6"
            >
              <motion.div style={{ y: combinedBounceY }}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-display font-semibold text-white tracking-tight">
                    Sign In
                  </h2>
                  <span className="text-[11px] font-mono text-neutral-400">GSFC SSO</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Enter your institutional credentials to access your cases.
                </p>
              </motion.div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div style={{ y: combinedSubtextBounceY }}>
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
                </motion.div>

                <motion.div style={{ y: combinedSubtextBounceY }}>
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
                </motion.div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
                  className="w-full py-2.5 text-xs font-semibold mt-2"
                >
                  Authenticate Session
                </Button>
              </form>

              <motion.div
                style={{ y: combinedSubtextBounceY }}
                className="pt-4 border-t border-white/[0.06] text-center text-xs text-neutral-400"
              >
                Need an institutional account?{' '}
                <Link to="/register" className="font-semibold text-white hover:underline">
                  Create one now
                </Link>
              </motion.div>
            </GlassCard>

            <motion.div
              style={{ y: combinedSubtextBounceY }}
              className="mt-6 text-center text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>End-to-End Encrypted Session • Argon2id Key Derivation</span>
            </motion.div>
          </FadeIn>
        </div>
      </div>

      {/* Scrollable Architectural Capabilities Section */}
      <div id="architecture" className="relative z-10 w-full border-t border-white/[0.06] bg-[#0A0D14]/80 backdrop-blur-md">
        <DynamicTicker className="border-b border-white/[0.08]" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <motion.div
              style={{ y: combinedBounceY }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>INSTITUTIONAL RECOVERY INFRASTRUCTURE</span>
            </motion.div>
            <motion.h2
              style={{ y: combinedBounceY }}
              className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight"
            >
              Engineered for campus-wide recovery precision.
            </motion.h2>
            <motion.p
              style={{ y: combinedSubtextBounceY }}
              className="text-sm text-neutral-400 leading-relaxed"
            >
              CIRS replaces manual lost &amp; found registries with automated multi-attribute matching,
              cryptographic token redemption, and real-time physical custody ledgering.
            </motion.p>
          </div>

          <motion.div
            style={{ y: combinedSubtextBounceY }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            <GlassCard enableTilt enableSheen className="p-7 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                <Cpu className="w-5 h-5 text-neutral-200" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Multi-Attribute AI Correlation
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Automated matching engine scans category, chromatic profiles, brand markings, and geo-spatial timestamp logs to surface verified lost/found pairs.
              </p>
              <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Neural matching threshold: 85%+</span>
              </div>
            </GlassCard>

            <GlassCard enableTilt enableSheen className="p-7 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                <Key className="w-5 h-5 text-neutral-200" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Cryptographic Custody Pass
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Approved claimants receive a single-use digital redemption token. Physical custody desks scan and burn tokens upon verified property handover.
              </p>
              <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero identity impersonation risk</span>
              </div>
            </GlassCard>

            <GlassCard enableTilt enableSheen className="p-7 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                <FileCheck2 className="w-5 h-5 text-neutral-200" />
              </div>
              <h3 className="text-base font-semibold text-white">
                100% Chain-of-Custody Audit
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Immutable event stream records every intake, security locker transfer, claimant appeal, and custodian resolution with cryptographic verification.
              </p>
              <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SHA-256 tamper-evident telemetry</span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Institutional Tenancy Footer */}
          <motion.div
            style={{ y: combinedSubtextBounceY }}
            className="pt-12 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-neutral-400">GSFC UNIVERSITY INSTANCE • CIRS v2.4</span>
            </div>
            <span>End-to-End Encrypted Session • Authorized Academic Personnel Only</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
