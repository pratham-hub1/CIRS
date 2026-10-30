import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Cpu, Key, FileCheck2, ChevronDown, Activity, Award, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { AmbientCanvas } from '../../components/common/AmbientCanvas';
import { GlassCard } from '../../components/common/GlassCard';
import { DynamicTicker } from '../../components/common/DynamicTicker';
import { celebrateConfetti } from '../../lib/confetti';
import { useWarmTextBounce } from '../../hooks/useWarmTextBounce';
import { TypewriterText } from '../../components/common/TypewriterText';

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

  // Subtle, warm spring bounce on text when scrolling, wheeling, or swiping
  const { titleBounceY, bodyBounceY, subtextBounceY } = useWarmTextBounce();

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
            <div>
              <motion.span style={{ y: titleBounceY }} className="inline-block font-display font-bold tracking-tight text-white text-base">
                CIRS
              </motion.span>
              <motion.span style={{ y: subtextBounceY }} className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                GSFC UNIVERSITY
              </motion.span>
            </div>
          </div>

          {/* Center Hero Copy */}
          <div className="max-w-xl space-y-6 my-auto py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                <TypewriterText text="CENTRAL RECOVERY SYSTEM • LIVE TELEMETRY" speed={16} delay={100} cursor={false} />
              </motion.span>
            </div>

            <motion.h1
              style={{ y: titleBounceY }}
              className="text-4xl xl:text-5xl font-display font-semibold tracking-tight text-white leading-[1.15]"
            >
              <TypewriterText text="Autonomous item recovery across campus grounds." speed={26} delay={250} />
            </motion.h1>

            <motion.p
              style={{ y: bodyBounceY }}
              className="text-base text-neutral-400 font-normal leading-relaxed"
            >
              <TypewriterText
                text="A unified institutional network pairing lost and found articles with multi-attribute AI correlation and cryptographic custody verification."
                speed={12}
                delay={900}
                cursor={false}
              />
            </motion.p>

            {/* Metric cards (Containers stay completely fixed; only typography bounces) */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <motion.div style={{ y: titleBounceY }} className="text-2xl font-display font-semibold text-white">
                  98.4%
                </motion.div>
                <motion.div style={{ y: subtextBounceY }} className="text-xs text-neutral-400 mt-1">
                  Resolution Rate
                </motion.div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <motion.div style={{ y: titleBounceY }} className="text-2xl font-display font-semibold text-white">
                  &lt; 24h
                </motion.div>
                <motion.div style={{ y: subtextBounceY }} className="text-xs text-neutral-400 mt-1">
                  Custody Turnaround
                </motion.div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <motion.div style={{ y: titleBounceY }} className="text-2xl font-display font-semibold text-white">
                  100%
                </motion.div>
                <motion.div style={{ y: subtextBounceY }} className="text-xs text-neutral-400 mt-1">
                  Audit Traceability
                </motion.div>
              </div>
            </div>
          </div>

          {/* Bottom Security Pledge & Scroll Anchor */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-neutral-300 shrink-0" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                Restricted to verified students, faculty members, and security personnel.
              </motion.span>
            </div>
            <a
              href="#architecture"
              className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                Platform Architecture
              </motion.span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </a>
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
              <motion.h1 style={{ y: titleBounceY }} className="text-2xl font-display font-bold text-white">
                CIRS
              </motion.h1>
              <motion.p style={{ y: subtextBounceY }} className="text-xs text-neutral-400 mt-1">
                <TypewriterText text="Campus Item Recovery System • GSFC University" speed={20} delay={200} />
              </motion.p>
            </div>

            {/* Interactive Sign-In GlassCard with 3D Tilt & Specular Sheen Hover Effect */}
            <GlassCard
              enableTilt
              enableSheen
              className="p-7 sm:p-9 rounded-3xl border border-white/[0.08] hover:border-white/[0.22] hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-all duration-300 space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <motion.h2 style={{ y: titleBounceY }} className="text-xl font-display font-semibold text-white tracking-tight">
                    <TypewriterText text="Sign In" speed={40} delay={350} />
                  </motion.h2>
                  <motion.span style={{ y: subtextBounceY }} className="text-[11px] font-mono text-neutral-400 inline-block">
                    GSFC SSO
                  </motion.span>
                </div>
                <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400">
                  <TypewriterText text="Enter your institutional credentials to access your cases." speed={16} delay={650} cursor={false} />
                </motion.p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <motion.label
                    style={{ y: subtextBounceY }}
                    htmlFor="email"
                    className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                  >
                    University Email Address
                  </motion.label>
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
                      className="block w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
                    />
                  </div>
                  <motion.p style={{ y: subtextBounceY }} className="mt-1.5 text-[11px] text-neutral-500 inline-block">
                    Must end with @gsfcuniversity.ac.in
                  </motion.p>
                </div>

                <div>
                  <motion.label
                    style={{ y: subtextBounceY }}
                    htmlFor="password"
                    className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                  >
                    Password
                  </motion.label>
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
                      className="block w-full pl-10 pr-10 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
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
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
                  className="w-full py-2.5 text-xs font-semibold mt-2"
                >
                  <motion.span style={{ y: subtextBounceY }} className="inline-block">
                    Authenticate Session
                  </motion.span>
                </Button>
              </form>

              <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-neutral-400">
                <motion.span style={{ y: subtextBounceY }} className="inline-block">
                  Need an institutional account?{' '}
                  <Link to="/register" className="font-semibold text-white hover:underline">
                    Create one now
                  </Link>
                </motion.span>
              </div>
            </GlassCard>

            <div className="mt-6 text-center text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                End-to-End Encrypted Session • Argon2id Key Derivation
              </motion.span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Scrollable Architectural Capabilities Section */}
      <div id="architecture" className="relative z-10 w-full border-t border-white/[0.06] bg-[#0A0D14]/80 backdrop-blur-md">
        <DynamicTicker className="border-b border-white/[0.08]" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                INSTITUTIONAL RECOVERY INFRASTRUCTURE
              </motion.span>
            </div>
            <motion.h2
              style={{ y: titleBounceY }}
              className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight"
            >
              Engineered for campus-wide recovery precision.
            </motion.h2>
            <motion.p
              style={{ y: bodyBounceY }}
              className="text-sm text-neutral-400 leading-relaxed"
            >
              CIRS replaces manual lost &amp; found registries with automated multi-attribute matching,
              cryptographic token redemption, and real-time physical custody ledgering.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <GlassCard enableTilt enableSheen className="p-7 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                <Cpu className="w-5 h-5 text-neutral-200" />
              </div>
              <motion.h3 style={{ y: titleBounceY }} className="text-base font-semibold text-white">
                Multi-Attribute AI Correlation
              </motion.h3>
              <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 leading-relaxed">
                Automated matching engine scans category, chromatic profiles, brand markings, and geo-spatial timestamp logs to surface verified lost/found pairs.
              </motion.p>
              <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <motion.span style={{ y: subtextBounceY }} className="inline-block">
                  Neural matching threshold: 85%+
                </motion.span>
              </div>
            </GlassCard>

            <GlassCard enableTilt enableSheen className="p-7 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                <Key className="w-5 h-5 text-neutral-200" />
              </div>
              <motion.h3 style={{ y: titleBounceY }} className="text-base font-semibold text-white">
                Cryptographic Custody Pass
              </motion.h3>
              <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 leading-relaxed">
                Approved claimants receive a single-use digital redemption token. Physical custody desks scan and burn tokens upon verified property handover.
              </motion.p>
              <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <motion.span style={{ y: subtextBounceY }} className="inline-block">
                  Zero identity impersonation risk
                </motion.span>
              </div>
            </GlassCard>

            <GlassCard enableTilt enableSheen className="p-7 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                <FileCheck2 className="w-5 h-5 text-neutral-200" />
              </div>
              <motion.h3 style={{ y: titleBounceY }} className="text-base font-semibold text-white">
                100% Chain-of-Custody Audit
              </motion.h3>
              <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 leading-relaxed">
                Immutable event stream records every intake, security locker transfer, claimant appeal, and custodian resolution with cryptographic verification.
              </motion.p>
              <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <motion.span style={{ y: subtextBounceY }} className="inline-block">
                  SHA-256 tamper-evident telemetry
                </motion.span>
              </div>
            </GlassCard>
          </div>

          {/* Institutional Tenancy Footer */}
          <div className="pt-12 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <motion.span style={{ y: subtextBounceY }} className="font-mono text-neutral-400 inline-block">
                GSFC UNIVERSITY INSTANCE • CIRS v2.4
              </motion.span>
            </div>
            <motion.span style={{ y: subtextBounceY }} className="inline-block">
              End-to-End Encrypted Session • Authorized Academic Personnel Only
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
};
