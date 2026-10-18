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
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { RoleBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { NotificationPreference } from '../../types/auth';
import { Role } from '../../types/enums';

export const ProfileSettings: React.FC = () => {
  const { user, refreshProfile, isDemoMode, switchDemoRole } = useAuth();
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account &amp; Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your GSFC University identity, department affiliations, and alert dispatch channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Personal Profile */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl ring-4 ring-primary-50">
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
                <h2 className="text-lg font-bold text-gray-900">{user?.name || 'GSFC User'}</h2>
                <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
                <div className="mt-2">
                  <RoleBadge role={user?.role} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  University Email (Read-Only)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-xs">{user?.email || 'student@gsfcuniversity.ac.in'}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Email addresses are permanently tied to university directory credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Campus Organization
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{user?.campus?.name || 'GSFC University — Vigyan Bhavan Main Campus'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Role Preview Switcher for evaluation */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 rounded-xl border border-indigo-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-950">Quick Role Switcher (Evaluation &amp; Preview)</h3>
            </div>
            <p className="text-xs text-indigo-800 mb-3">
              Switch roles to evaluate student report forms, staff moderation desks, and admin chain-of-custody logs:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => switchDemoRole(Role.STUDENT)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  user?.role === Role.STUDENT
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Student View
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole(Role.FACULTY)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  user?.role === Role.FACULTY
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Faculty View
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole(Role.ADMIN)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  user?.role === Role.ADMIN
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Admin / Staff View
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Notification Preferences */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Bell className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            </div>

            {/* Email dispatch notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mb-5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold block mb-0.5">Notification Channels:</span>
                <p className="text-amber-800 leading-relaxed">
                  In-app notifications appear instantly in your bell menu. Email delivery uses the university mail service.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="text-sm font-semibold text-gray-800 block">
                    Instant Email Notifications
                  </span>
                  <p className="text-xs text-gray-500">
                    Receive immediate emails when your item matches or claim status updates.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.emailEnabled}
                    onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="text-sm font-semibold text-gray-800 block">
                    Daily Campus Recovery Digest
                  </span>
                  <p className="text-xs text-gray-500">
                    A consolidated morning summary of newly handed-in items matching your department.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.digestEnabled}
                    onChange={(e) => setPrefs({ ...prefs, digestEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingPrefs}
                className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {isSavingPrefs ? 'Saving Preferences...' : 'Update Notification Settings'}
              </button>
            </form>
          </div>

          {/* Security & Access Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Identity &amp; Security Protocol</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Sessions are maintained using encrypted, short-lived JWT tokens with rotating HttpOnly refresh cookies.
              Privacy-first data masking ensures student contact details remain confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
