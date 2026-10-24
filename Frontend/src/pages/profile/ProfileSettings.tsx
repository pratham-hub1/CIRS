import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Building,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { RoleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';
import { NotificationPreference } from '../../types/auth';
import { Role } from '../../types/enums';
import { celebrateConfetti } from '../../lib/confetti';

export const ProfileSettings: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error } = useToast();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [departmentId, setDepartmentId] = useState(user?.departmentId || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification Preferences
  const [prefs, setPrefs] = useState<NotificationPreference>({
    userId: user?.id || '',
    emailEnabled: true,
    digestEnabled: false,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.departmentId) setDepartmentId(user.departmentId);
  }, [user]);

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoadingPrefs(true);
      try {
        const p = await authService.getNotificationPreferences();
        setPrefs(p);
      } catch (err: any) {
        console.warn('Could not load notification preferences:', err);
      } finally {
        setIsLoadingPrefs(false);
      }
    };
    loadPreferences();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Name cannot be empty');
      return;
    }
    setIsSavingProfile(true);
    try {
      await authService.updateProfile({
        name: name.trim(),
        departmentId: departmentId || undefined,
      });
      await refreshProfile();
      celebrateConfetti();
      success('Profile updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      const updated = await authService.updateNotificationPreferences({
        emailEnabled: prefs.emailEnabled,
        digestEnabled: prefs.digestEnabled,
      });
      setPrefs(updated);
      celebrateConfetti();
      success('Notification preferences updated');
    } catch (err: any) {
      error(err.message || 'Failed to update notification preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <FadeIn className="space-y-8 max-w-4xl mx-auto text-white">
      {/* Top Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex items-center space-x-2.5 mb-2">
          <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            ACCOUNT MANAGEMENT
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-mono text-neutral-400">
            VERIFIED CREDENTIALS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
          Profile &amp; Account Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-400 max-w-xl">
          Manage your campus identity, department affiliations, and alert dispatch channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Personal Profile */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 sm:p-7">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
              <div className="w-14 h-14 rounded-full bg-neutral-800 border border-white/10 text-white flex items-center justify-center font-bold text-lg">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'U'}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{user?.name || 'GSFC User'}</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <RoleBadge role={user?.role} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="user-name"
                  className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  University Email (Read-Only)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-400 cursor-not-allowed font-mono">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <span>{user?.email || 'student@gsfcuniversity.ac.in'}</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Email addresses are permanently tied to university directory credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Campus Organization
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-300 font-mono">
                  <Building className="w-4 h-4 text-neutral-400" />
                  <span>{user?.campus?.name || 'GSFC University — Main Campus'}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingProfile}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Account Role Information */}
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Shield className="w-4 h-4 text-neutral-400" />
              <span>Permission Tier: {user?.role || 'STUDENT'}</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your account grants access to submit lost &amp; found reports, file ownership claims, receive match alerts, and redeem collection tokens.
            </p>
          </div>
        </div>

        {/* Right Column: Notification Preferences */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 mb-4 pb-4 border-b border-white/[0.06]">
              <Bell className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-semibold text-white">Alert Preferences</h3>
            </div>

            {isLoadingPrefs ? (
              <div className="py-8 text-center text-xs text-neutral-500 font-mono">
                Loading preferences...
              </div>
            ) : (
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-white block">Email Dispatch</span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Receive immediate emails for claims and matches.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.emailEnabled}
                    onChange={(e) =>
                      setPrefs((prev) => ({ ...prev, emailEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-white bg-neutral-800 border-white/20 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-white block">Daily Telemetry Digest</span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Summary of newly reported campus items.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.digestEnabled}
                    onChange={(e) =>
                      setPrefs((prev) => ({ ...prev, digestEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-white bg-neutral-800 border-white/20 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    isLoading={isSavingPrefs}
                    className="w-full"
                  >
                    Update Alert Dispatch
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
