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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { RoleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { FormField } from '../../components/a11y/FormField';
import { useToast } from '../../context/ToastContext';
import { NotificationPreference } from '../../types/auth';
import { Role } from '../../types/enums';

export const ProfileSettings: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error } = useToast();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [departmentId, setDepartmentId] = useState(user?.departmentId || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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
    setNameError(null);
    if (!name.trim()) {
      setNameError('Name cannot be empty');
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
      success('Notification preferences updated');
    } catch (err: any) {
      error(err.message || 'Failed to update notification preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <FadeIn className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-200/90 pb-5">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
            Account Preferences
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile &amp; Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">
          Manage your GSFC University identity, department affiliations, and alert dispatch channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Personal Profile */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-subtle">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-accent-600 text-white flex items-center justify-center font-extrabold text-xl shadow-subtle ring-4 ring-brand-50">
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
                <h2 className="text-lg font-extrabold text-slate-900">{user?.name || 'GSFC User'}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <RoleBadge role={user?.role} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <FormField id="user-name" label="Full Name" error={nameError}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-800"
                />
              </FormField>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  University Email (Read-Only)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-xs">{user?.email || 'student@gsfcuniversity.ac.in'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Email addresses are permanently tied to university directory credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Campus Organization
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100/70 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{user?.campus?.name || 'GSFC University — Vigyan Bhavan Main Campus'}</span>
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
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Account Role Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Access &amp; Permissions</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-normal">
              Your account privileges are verified via your institutional credentials:
            </p>
            <div className="flex items-center gap-2.5">
              <RoleBadge role={user?.role} />
              <span className="text-xs text-slate-600 font-medium">
                {user?.role === Role.ADMIN
                  ? 'Authorized campus security & item custodian privileges.'
                  : user?.role === Role.FACULTY
                  ? 'University faculty member access.'
                  : 'Student recovery access.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Notification Preferences */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-subtle">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Bell className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-extrabold text-slate-900">Notification Settings</h2>
            </div>

            {/* Email dispatch notice */}
            <div className="p-4 bg-brand-50/70 border border-brand-200/80 rounded-2xl text-xs text-brand-950 mb-5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block mb-0.5 text-brand-900">Notification Channels:</span>
                <p className="text-brand-800 leading-relaxed font-normal">
                  In-app notifications appear instantly in your top bar and Notification Center.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Instant Notifications
                  </span>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Receive alerts when cases match or claim status updates.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Instant notifications"
                    aria-checked={prefs.emailEnabled}
                    checked={prefs.emailEnabled}
                    onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Campus Recovery Digest
                  </span>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Daily summary of items handed into security.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Campus recovery digest"
                    aria-checked={prefs.digestEnabled}
                    checked={prefs.digestEnabled}
                    onChange={(e) => setPrefs({ ...prefs, digestEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={isSavingPrefs}
                className="w-full"
              >
                Update Preferences
              </Button>
            </form>
          </div>

          {/* Security & Access Info */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-subtle space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Identity &amp; Security Protocol</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-normal text-[11px]">
              Sessions are maintained using short-lived JWT tokens with rotating refresh cookies.
              Privacy-first data masking ensures student contact details remain confidential.
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
