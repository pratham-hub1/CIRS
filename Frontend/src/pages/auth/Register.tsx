import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Activity,
  Cpu,
  Key,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Campus } from '../../types/auth';
import { Role } from '../../types/enums';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { AmbientCanvas } from '../../components/common/AmbientCanvas';
import { GlassCard } from '../../components/common/GlassCard';
import { DynamicTicker } from '../../components/common/DynamicTicker';
import { celebrateConfetti } from '../../lib/confetti';
import { useWarmTextBounce } from '../../hooks/useWarmTextBounce';
import { KineticText } from '../../components/common/KineticText';
import { KineticCard } from '../../components/common/KineticCard';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [campusId, setCampusId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic campus loading state
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(true);
  const [campusLoadError, setCampusLoadError] = useState<string | null>(null);

  // Subtle, warm spring bounce on text when scrolling, wheeling, or swiping
  const { titleBounceY, bodyBounceY, subtextBounceY } = useWarmTextBounce();

  const fetchCampuses = async () => {
    setIsLoadingCampuses(true);
    setCampusLoadError(null);
    try {
      const data = await authService.getCampuses();
      const list = Array.isArray(data) ? data : [];
      setCampuses(list);
      if (list.length === 1) {
        setCampusId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load campuses:', err);
      setCampusLoadError(err.message || 'Unable to connect to campus directory server.');
    } finally {
      setIsLoadingCampuses(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  const handleCampusChange = (newCampusId: string) => {
    setCampusId(newCampusId);
    setDepartmentId(''); // Clear department when campus changes
  };

  const selectedCampus = campuses.find((c) => c.id === campusId);
  const availableDepartments = selectedCampus?.departments || [];

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@gsfcuniversity.ac.in')) {
      setErrorMessage(
        'Registration is restricted to university email domains ending in @gsfcuniversity.ac.in',
      );
      return;
    }

    if (!campusId) {
      setErrorMessage('Please select your university campus.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const regUser = await register({
        name: name.trim(),
        email: trimmedEmail,
        password,
        campusId,
        departmentId: departmentId.trim() || undefined,
        role,
      });
      try {
        sessionStorage.setItem(
          'cirs_welcome_event',
          JSON.stringify({
            type: 'register',
            role: regUser?.role || role || 'STUDENT',
            name: name.trim() || trimmedEmail.split('@')[0],
            timestamp: Date.now(),
          })
        );
      } catch {
        // storage fallback
      }
      celebrateConfetti();
      success('Institutional profile registered successfully. Welcome to CIRS!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your credentials.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-white flex flex-col relative overflow-x-hidden selection:bg-white selection:text-black font-sans scroll-smooth">
      {/* Background Animated Particle Canvas with Luminous Calm Parallax */}
      <AmbientCanvas particleCount={72} />

      {/* Hero Registration Section */}
      <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 relative z-10 w-full">
        {/* Left Column: Platform Onboarding & Institutional Guarantees (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-white/[0.06]">
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
                INSTITUTIONAL REGISTRATION
              </motion.span>
            </div>
          </div>

          {/* Center Showcase */}
          <div className="max-w-xl space-y-6 my-auto py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                <KineticText text="CAMPUS ENROLLMENT PROTOCOL" mode="char" stagger={0.016} delay={0.1} repeatOnView={true} />
              </motion.span>
            </div>

            <motion.h1
              style={{ y: titleBounceY }}
              className="text-4xl xl:text-5xl font-display font-semibold tracking-tight text-white leading-[1.15]"
            >
              <KineticText text="Join the recovery ecosystem of GSFC University." mode="char" stagger={0.024} delay={0.25} repeatOnView={true} />
            </motion.h1>

            <motion.p
              style={{ y: bodyBounceY }}
              className="text-base text-neutral-400 font-normal leading-relaxed"
            >
              <KineticText
                text="Create an account to report missing belongings, track recovery progress in real time, and verify property claims through campus security."
                mode="word"
                stagger={0.045}
                delay={0.65}
                repeatOnView={true}
              />
            </motion.p>

            <div className="space-y-3.5 pt-2">
              <KineticCard delay={0.35} repeatOnView={true} threshold={0.1}>
                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] transition-all">
                  <CheckCircle2 className="w-5 h-5 text-neutral-300 shrink-0 mt-0.5" />
                  <div>
                    <motion.h4 style={{ y: titleBounceY }} className="text-sm font-semibold text-white">
                      Automated Matching Radar
                    </motion.h4>
                    <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 mt-0.5">
                      Instant candidate correlation when matching lost reports and found articles appear.
                    </motion.p>
                  </div>
                </div>
              </KineticCard>

              <KineticCard delay={0.5} repeatOnView={true} threshold={0.1}>
                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] transition-all">
                  <ShieldCheck className="w-5 h-5 text-neutral-300 shrink-0 mt-0.5" />
                  <div>
                    <motion.h4 style={{ y: titleBounceY }} className="text-sm font-semibold text-white">
                      Cryptographic Collection Pass
                    </motion.h4>
                    <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 mt-0.5">
                      Single-use digital token issued for secure physical custody handover.
                    </motion.p>
                  </div>
                </div>
              </KineticCard>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-neutral-300 shrink-0" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                Institutional tenancy strictly validated against official campus records.
              </motion.span>
            </div>
            <a
              href="#registration-details"
              className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                Protocol Specs
              </motion.span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </a>
          </div>
        </div>

        {/* Right Column: Registration Form with 3D Tilt & Specular Sheen GlassCard */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative z-10 my-auto w-full">
          <KineticCard delay={0.25} duration={0.65} repeatOnView={true} threshold={0.1} className="w-full max-w-lg">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-11 h-11 rounded-xl bg-white text-black font-display font-bold flex items-center justify-center text-sm mx-auto mb-3">
                CI
              </div>
              <motion.h1 style={{ y: titleBounceY }} className="text-2xl font-display font-bold text-white">
                Create an Account
              </motion.h1>
              <motion.p style={{ y: subtextBounceY }} className="text-xs text-neutral-400 mt-1">
                <KineticText text="GSFC University • Campus Item Recovery System" mode="char" stagger={0.02} delay={0.2} repeatOnView={true} />
              </motion.p>
            </div>

            {/* Interactive Registration GlassCard with 3D Tilt & Specular Sheen Hover Effect */}
            <GlassCard
              enableTilt
              enableSheen
              className="p-7 sm:p-9 rounded-3xl border border-white/[0.08] hover:border-white/[0.22] hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-all duration-300 space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <motion.h2 style={{ y: titleBounceY }} className="text-xl font-display font-semibold text-white tracking-tight">
                    <KineticText text="Register Account" mode="char" stagger={0.04} delay={0.3} repeatOnView={true} />
                  </motion.h2>
                  <motion.span style={{ y: subtextBounceY }} className="text-[11px] font-mono text-neutral-400 inline-block">
                    Step 1 of 1
                  </motion.span>
                </div>
                <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400">
                  <KineticText text="Register with your official student or faculty credentials." mode="word" stagger={0.05} delay={0.5} repeatOnView={true} />
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
                    className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                  >
                    Full Name
                  </motion.label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <motion.label
                    style={{ y: subtextBounceY }}
                    className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                  >
                    University Email Address
                  </motion.label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rollnumber@gsfcuniversity.ac.in"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
                    />
                  </div>
                  <motion.p style={{ y: subtextBounceY }} className="mt-1 text-[11px] text-neutral-500 inline-block">
                    Must end with @gsfcuniversity.ac.in
                  </motion.p>
                </div>

                {/* Campus Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <motion.label
                      style={{ y: subtextBounceY }}
                      className="inline-block text-xs font-medium text-neutral-300"
                    >
                      Campus Facility <span className="text-neutral-400">*</span>
                    </motion.label>
                    {isLoadingCampuses && (
                      <span className="text-[11px] text-neutral-400 flex items-center font-mono">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Querying directory...
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Building className="w-4 h-4" />
                    </div>
                    <select
                      required
                      disabled={isLoadingCampuses || campuses.length === 0}
                      value={campusId}
                      onChange={(e) => handleCampusChange(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white font-mono disabled:opacity-50"
                    >
                      <option value="" className="bg-[#12151D]">
                        {isLoadingCampuses
                          ? 'Loading campus directory...'
                          : campuses.length === 0
                          ? 'No campuses available'
                          : '-- Select your campus --'}
                      </option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#12151D]">
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {campusLoadError && (
                    <div className="mt-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center justify-between">
                      <span className="flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0 text-rose-400" />
                        {campusLoadError}
                      </span>
                      <button
                        type="button"
                        onClick={fetchCampuses}
                        className="underline font-bold ml-2 text-white"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Department Selection */}
                  <div>
                    <motion.label
                      style={{ y: subtextBounceY }}
                      className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Department (Optional)
                    </motion.label>
                    <select
                      disabled={!campusId || availableDepartments.length === 0}
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="block w-full py-2.5 px-3 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white disabled:opacity-40"
                    >
                      <option value="" className="bg-[#12151D]">
                        {!campusId
                          ? 'Select campus first'
                          : availableDepartments.length === 0
                          ? 'No specific departments'
                          : '-- Select department --'}
                      </option>
                      {availableDepartments.map((d) => (
                        <option key={d.id} value={d.id} className="bg-[#12151D]">
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <motion.label
                      style={{ y: subtextBounceY }}
                      className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Role Designation
                    </motion.label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="block w-full py-2.5 px-3 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white"
                    >
                      <option value={Role.STUDENT} className="bg-[#12151D]">Student</option>
                      <option value={Role.FACULTY} className="bg-[#12151D]">Faculty Member</option>
                    </select>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <motion.label
                      style={{ y: subtextBounceY }}
                      className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Password (8+ chars)
                    </motion.label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-9 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password && (
                      <div className="mt-1.5 flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength >= step
                                ? passwordStrength <= 2
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <motion.label
                      style={{ y: subtextBounceY }}
                      className="inline-block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Confirm Password
                    </motion.label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-black/40 text-white placeholder-neutral-500 font-mono transition-all"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
                  className="w-full py-2.5 text-xs font-semibold mt-2"
                >
                  Create Institutional Account
                </Button>
              </form>

              <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-neutral-400">
                <motion.span style={{ y: subtextBounceY }} className="inline-block">
                  Already registered?{' '}
                  <Link to="/login" className="font-semibold text-white hover:underline">
                    Sign in to your account
                  </Link>
                </motion.span>
              </div>
            </GlassCard>

            <div className="mt-6 text-center text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                Identity Verification via GSFC Directory Services
              </motion.span>
            </div>
          </KineticCard>
        </div>
      </div>

      {/* Scrollable Protocol Specs Section */}
      <div id="registration-details" className="relative z-10 w-full border-t border-white/[0.06] bg-[#0A0D14]/80 backdrop-blur-md">
        <DynamicTicker className="border-b border-white/[0.08]" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <motion.span style={{ y: subtextBounceY }} className="inline-block">
                <KineticText text="ONBOARDING GOVERNANCE & TRUST" mode="char" stagger={0.016} delay={0.1} repeatOnView={true} threshold={0.15} />
              </motion.span>
            </div>
            <motion.h2
              style={{ y: titleBounceY }}
              className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight"
            >
              <KineticText text="Verified campus identity at every step." mode="char" stagger={0.022} delay={0.2} repeatOnView={true} threshold={0.15} />
            </motion.h2>
            <motion.p
              style={{ y: bodyBounceY }}
              className="text-sm text-neutral-400 leading-relaxed"
            >
              <KineticText
                text="CIRS safeguards university property by ensuring every case and claim originates from authenticated academic personnel with traceable accountability."
                mode="word"
                stagger={0.04}
                delay={0.5}
                repeatOnView={true}
                threshold={0.15}
              />
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <KineticCard delay={0.25} repeatOnView={true} threshold={0.15} className="h-full">
              <GlassCard enableTilt enableSheen className="p-7 space-y-4 h-full">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                  <Cpu className="w-5 h-5 text-neutral-200" />
                </div>
                <motion.h3 style={{ y: titleBounceY }} className="text-base font-semibold text-white">
                  <KineticText text="Institutional Domain Check" mode="char" stagger={0.02} delay={0.25} repeatOnView={true} threshold={0.15} />
                </motion.h3>
                <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 leading-relaxed">
                  <KineticText
                    text="Registration requires active university affiliation ending in @gsfcuniversity.ac.in, keeping public trolls and unauthorized outsiders out."
                    mode="word"
                    stagger={0.035}
                    delay={0.45}
                    repeatOnView={true}
                    threshold={0.15}
                  />
                </motion.p>
                <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <motion.span style={{ y: subtextBounceY }} className="inline-block">
                    Zero spoofing attack surface
                  </motion.span>
                </div>
              </GlassCard>
            </KineticCard>

            <KineticCard delay={0.4} repeatOnView={true} threshold={0.15} className="h-full">
              <GlassCard enableTilt enableSheen className="p-7 space-y-4 h-full">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                  <Key className="w-5 h-5 text-neutral-200" />
                </div>
                <motion.h3 style={{ y: titleBounceY }} className="text-base font-semibold text-white">
                  <KineticText text="Encrypted Auth Vault" mode="char" stagger={0.02} delay={0.3} repeatOnView={true} threshold={0.15} />
                </motion.h3>
                <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 leading-relaxed">
                  <KineticText
                    text="Credentials are authenticated against cryptographic key derivation protocols, protecting student and faculty records at rest and in transit."
                    mode="word"
                    stagger={0.035}
                    delay={0.5}
                    repeatOnView={true}
                    threshold={0.15}
                  />
                </motion.p>
                <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <motion.span style={{ y: subtextBounceY }} className="inline-block">
                    Argon2id hashing standard
                  </motion.span>
                </div>
              </GlassCard>
            </KineticCard>

            <KineticCard delay={0.55} repeatOnView={true} threshold={0.15} className="h-full">
              <GlassCard enableTilt enableSheen className="p-7 space-y-4 h-full">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
                  <FileCheck2 className="w-5 h-5 text-neutral-200" />
                </div>
                <motion.h3 style={{ y: titleBounceY }} className="text-base font-semibold text-white">
                  <KineticText text="Transparent Adjudication" mode="char" stagger={0.02} delay={0.35} repeatOnView={true} threshold={0.15} />
                </motion.h3>
                <motion.p style={{ y: bodyBounceY }} className="text-xs text-neutral-400 leading-relaxed">
                  <KineticText
                    text="File lost cases, submit ownership evidence, and communicate securely with custodians through an immutable timestamped messaging log."
                    mode="word"
                    stagger={0.035}
                    delay={0.55}
                    repeatOnView={true}
                    threshold={0.15}
                  />
                </motion.p>
                <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <motion.span style={{ y: subtextBounceY }} className="inline-block">
                    100% auditable history
                  </motion.span>
                </div>
              </GlassCard>
            </KineticCard>
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
              Academic Portal • Governed by Campus Property Policies
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
};
