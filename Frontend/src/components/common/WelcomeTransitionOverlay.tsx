import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Terminal,
  Cpu,
  GraduationCap,
  Key,
} from 'lucide-react';
import { AmbientCanvas } from './AmbientCanvas';

export interface WelcomeEventData {
  type: 'login' | 'register';
  role: 'ADMIN' | 'STUDENT' | 'FACULTY' | string;
  name: string;
  department?: string;
  timestamp: number;
}

export const WelcomeTransitionOverlay: React.FC = () => {
  const [eventData, setEventData] = useState<WelcomeEventData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cirs_welcome_event');
      if (raw) {
        const parsed: WelcomeEventData = JSON.parse(raw);
        // Only trigger if recorded within the last 15 seconds
        if (Date.now() - parsed.timestamp < 15000) {
          setEventData(parsed);
          setIsVisible(true);
          sessionStorage.removeItem('cirs_welcome_event');
        } else {
          sessionStorage.removeItem('cirs_welcome_event');
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Sequential diagnostic checkmarks
    const t1 = setTimeout(() => setCompletedSteps((prev) => [...prev, 0]), 250);
    const t2 = setTimeout(() => setCompletedSteps((prev) => [...prev, 1]), 650);
    const t3 = setTimeout(() => setCompletedSteps((prev) => [...prev, 2]), 1050);
    const t4 = setTimeout(() => setCompletedSteps((prev) => [...prev, 3]), 1450);

    // Auto dismiss interval (2.4s)
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(dismissTimer);
    };
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!eventData) return null;

  const isAdmin = eventData.role?.toUpperCase() === 'ADMIN';
  const isRegister = eventData.type === 'register';

  const adminSteps = [
    'Multi-Factor Session Token Validated • Session Token Signed',
    'Physical Custody Vaults Decrypted • 0 Tamper Exceptions',
    'Real-Time Incident & Claims Queue Synchronized',
    'Security Telemetry Stream Online • 98.4% System Health',
  ];

  const studentSteps = [
    'Institutional Identity Verified • Campus Network Attached',
    'Active Case Dossiers & Match Radar Synchronized',
    'Smart Claim Dispatcher Online • Custody Protocol Ready',
    'Notification Channels Connected • 24/7 Security Link Active',
  ];

  const registerSteps = [
    'Institutional Credentials Seeded & Cryptographically Hashed',
    'Single-Use Digital Collection Pass Generated',
    'Campus Recovery Notification Channels Linked',
    'Institutional Member Pass Active • 100% Chain-of-Custody Ready',
  ];

  const activeSteps = isRegister ? registerSteps : isAdmin ? adminSteps : studentSteps;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-[#060709]/95 backdrop-blur-3xl select-none px-6"
        >
          {/* Ambient geometric constellations */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <AmbientCanvas particleCount={45} />
          </div>

          {/* Radial depth light */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

          {/* Central Modal Card */}
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: -10, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl p-8 sm:p-10 rounded-3xl bg-[#10131A]/90 border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-black font-display font-bold flex items-center justify-center text-sm shadow-md">
                  {isAdmin ? <ShieldCheck className="w-5 h-5 text-black" /> : isRegister ? <Sparkles className="w-5 h-5 text-black" /> : <GraduationCap className="w-5 h-5 text-black" />}
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
                    {isAdmin
                      ? 'SECURITY & AUDIT COMMAND • CLEARANCE L3'
                      : isRegister
                      ? 'MEMBERSHIP INITIALIZATION PROTOCOL'
                      : 'CAMPUS ITEM RECOVERY SYSTEM'}
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    GSFC University • CIRS Core v2.4
                  </h3>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-neutral-300">
                {isAdmin ? 'ADMIN' : 'STUDENT'}
              </span>
            </div>

            {/* Main Greeting & Status */}
            <div className="my-6">
              <div className="text-xs font-mono text-neutral-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isAdmin
                    ? 'SECURITY COMMAND CONSOLE INITIALIZED'
                    : isRegister
                    ? 'NEW REGISTRATION CONFIRMED'
                    : 'AUTHENTICATED SESSION READY'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                {isRegister
                  ? `Welcome to CIRS, ${eventData.name || 'Student'}`
                  : isAdmin
                  ? `Security Desk: ${eventData.name || 'Officer'}`
                  : `Welcome back, ${eventData.name || 'Student'}`}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {isAdmin
                  ? 'Decryption keys loaded. Custody lockers and real-time claim adjudication stream active.'
                  : isRegister
                  ? 'Your institutional profile has been provisioned. Digital custody passport is active.'
                  : 'Your academic lost & found dashboard is synchronized with campus custody desks.'}
              </p>
            </div>

            {/* Sequential Diagnostic Steps */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/[0.06] font-mono text-xs mb-6">
              {activeSteps.map((step, idx) => {
                const isDone = completedSteps.includes(idx);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: isDone ? 1 : 0.35, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center space-x-2.5"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 border-t-white animate-spin shrink-0" />
                    )}
                    <span className={isDone ? 'text-neutral-200' : 'text-neutral-500'}>
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Actions & Metrics */}
            <div className="flex items-center justify-between pt-2">
              <div className="hidden sm:flex items-center space-x-4 text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                  Latency: 18ms
                </span>
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-neutral-400" />
                  Argon2id OK
                </span>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-95 transition-all ml-auto shadow-md"
              >
                <span>{isAdmin ? 'Enter Security Console' : 'Proceed to Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
