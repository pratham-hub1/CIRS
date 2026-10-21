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
import { FormField } from '../../components/a11y/FormField';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      <FadeIn className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-accent-600 flex items-center justify-center text-white font-extrabold mx-auto mb-4 shadow-elevated ring-4 ring-white">
          <span className="text-xl font-mono tracking-wider">CI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Create an Account
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-normal">
          Register with your GSFC University student or faculty identity
        </p>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-3xl border border-slate-200/90">
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              id="name"
              label="Full Name"
              required
              leadingIcon={<UserIcon className="w-4 h-4" aria-hidden="true" />}
            >
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>

            <FormField
              id="email"
              label="University Email Address"
              required
              leadingIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
              helpText="Must end with @gsfcuniversity.ac.in"
            >
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rollnumber@gsfcuniversity.ac.in"
                className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>

            {/* Campus Selection */}
            <FormField
              id="campus"
              label="Campus"
              required
              leadingIcon={<Building className="w-4 h-4" aria-hidden="true" />}
              helpText={
                isLoadingCampuses ? (
                  <span className="text-brand-600 flex items-center font-medium">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" aria-hidden="true" /> Fetching
                    campuses...
                  </span>
                ) : undefined
              }
            >
              <select
                required
                disabled={isLoadingCampuses || campuses.length === 0}
                value={campusId}
                onChange={(e) => handleCampusChange(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white disabled:bg-slate-100 disabled:text-slate-400 font-medium"
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
            </FormField>
            {campusLoadError && (
              <div
                role="alert"
                className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center justify-between font-medium"
              >
                <span className="flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0 text-rose-500" aria-hidden="true" />
                  {campusLoadError}
                </span>
                <button
                  type="button"
                  onClick={fetchCampuses}
                  className="underline font-bold ml-2 text-rose-800 hover:text-rose-900"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField id="role" label="Role">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="block w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                >
                  <option value={Role.STUDENT}>Student</option>
                  <option value={Role.FACULTY}>Faculty</option>
                </select>
              </FormField>

              <FormField id="department" label="Department">
                <select
                  disabled={isLoadingCampuses || !campusId || availableDepartments.length === 0}
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="block w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white disabled:bg-slate-100 disabled:text-slate-400 font-medium"
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
              </FormField>
            </div>

            <FormField
              id="password"
              label="Password (Min 8 Characters)"
              required
              leadingIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
              trailingAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded"
                  aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              }
            >
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>

            <FormField
              id="confirm-password"
              label="Confirm Password"
              required
              leadingIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isLoadingCampuses || (campuses.length > 0 && !campusId)}
              className="w-full py-2.5 mt-2 text-sm"
            >
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Sign in here
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400 font-medium flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>Restricted to GSFC University Students &amp; Faculty</span>
        </div>
      </FadeIn>
    </div>
  );
};
