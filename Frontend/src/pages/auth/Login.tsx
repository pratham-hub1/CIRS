import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
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
    <div className="min-h-screen bg-[#0A0C10] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-white/20 selection:text-white">
      <FadeIn className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/15 flex items-center justify-center text-white font-bold text-sm tracking-widest mx-auto mb-4 shadow-sm">
          CI
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
          Sign In to CIRS
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400">
          Campus Item Recovery System — GSFC University
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
              <label
                htmlFor="email"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5"
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
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-mono"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                Authorized for university domains (@gsfcuniversity.ac.in)
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5"
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
                  className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-mono"
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
              className="w-full py-2.5 text-xs font-semibold"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-400">
            New to CIRS?{' '}
            <Link to="/register" className="font-semibold text-white hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>GSFC University SSO Protocol &amp; End-to-End Encrypted</span>
        </div>
      </FadeIn>
    </div>
  );
};
