import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Campus } from '../../types/auth';
import { Role } from '../../types/enums';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { celebrateConfetti } from '../../lib/confetti';

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
      await register({
        name: name.trim(),
        email: trimmedEmail,
        password,
        campusId,
        departmentId: departmentId.trim() || undefined,
        role,
      });
      celebrateConfetti();
      success('Account registered successfully! Welcome to CIRS.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your information.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-white/20 selection:text-white">
      <FadeIn className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/15 flex items-center justify-center text-white font-bold text-sm tracking-widest mx-auto mb-4 shadow-sm">
          CI
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
          Create an Account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400">
          Register with your GSFC University student or faculty identity
        </p>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#12151D] py-8 px-6 sm:px-8 rounded-2xl border border-white/[0.08] shadow-2xl">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Full Name
              </label>
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
                  className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                University Email Address
              </label>
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
                  className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Must end with @gsfcuniversity.ac.in
              </p>
            </div>

            {/* Campus Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                  Campus <span className="text-rose-400">*</span>
                </label>
                {isLoadingCampuses && (
                  <span className="text-[11px] text-neutral-400 flex items-center font-mono">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Fetching campuses...
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
                  className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white font-mono disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingCampuses
                      ? 'Loading campus directory...'
                      : campuses.length === 0
                      ? 'No campuses available'
                      : '-- Select your campus --'}
                  </option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="block w-full py-2 px-3 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white font-mono"
                >
                  <option value={Role.STUDENT}>Student</option>
                  <option value={Role.FACULTY}>Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Department
                </label>
                <select
                  disabled={isLoadingCampuses || !campusId || availableDepartments.length === 0}
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="block w-full py-2 px-3 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white font-mono disabled:opacity-50"
                >
                  {!campusId ? (
                    <option value="">Select campus first</option>
                  ) : availableDepartments.length === 0 ? (
                    <option value="">No departments</option>
                  ) : (
                    <>
                      <option value="">None / General</option>
                      {availableDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Password (Min 8 Characters)
              </label>
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
                  className="block w-full pl-10 pr-10 py-2 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-mono"
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

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Confirm Password
              </label>
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
                  className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isLoadingCampuses || (campuses.length > 0 && !campusId)}
              className="w-full py-2.5 mt-2 text-xs font-semibold"
            >
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-white hover:underline">
              Sign in here
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>Restricted to GSFC University Students &amp; Faculty</span>
        </div>
      </FadeIn>
    </div>
  );
};
