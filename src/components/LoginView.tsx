import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  Store,
  CheckCircle2,
  AlertCircle,
  Lock,
  User as UserIcon,
  Copy,
  Check,
  ExternalLink,
  Info,
} from 'lucide-react';
import { api, setAuthSession } from '../services/api.js';
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignInWithGoogle,
  saveFirestoreUser,
  getSavedFirebaseUser,
} from '../services/firebase.js';
import { User, UserRole } from '../types.js';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [popupClosedNotice, setPopupClosedNotice] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleCopyDomain = () => {
    const domain = window.location.hostname;
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setUnauthorizedDomain(null);
    setPopupClosedNotice(false);
    setGoogleLoading(true);

    try {
      // Standard Google Sign-in / Sign-up with Firebase Auth Popup
      const { user: fbUser, isNewUser } = await firebaseSignInWithGoogle(selectedRole);

      // Synchronize with backend API for token session
      try {
        const authRes = await api.googleAuth({
          name: fbUser.name,
          email: fbUser.email,
          role: fbUser.role || selectedRole,
          uid: String(fbUser.id),
        });
        setAuthSession(authRes.token, authRes.user);
      } catch (apiErr) {
        console.warn('Backend sync note:', apiErr);
      }

      setSuccessMessage(
        isNewUser || isSignUp
          ? `Welcome, ${fbUser.name}! Your account has been registered with Google.`
          : `Welcome back, ${fbUser.name}! Successfully signed in.`
      );

      setTimeout(() => {
        onLoginSuccess(fbUser);
      }, 500);
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setPopupClosedNotice(true);
        setErrorMessage('The Google sign-in window was closed before completing authentication.');
      } else if (err.code === 'auth/popup-blocked') {
        setPopupClosedNotice(true);
        setErrorMessage('Google popup was blocked by your browser. Please allow popups or open in a new tab.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHostname = window.location.hostname;
        setUnauthorizedDomain(currentHostname);
        setErrorMessage(
          `Domain "${currentHostname}" is not authorized in Firebase Console yet.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Try Firebase Auth Sign Up
        try {
          const user = await firebaseSignUp(name.trim(), email.trim(), password, selectedRole);
          setAuthSession(`fb_${Date.now()}`, user);
          setSuccessMessage(`Account created successfully as ${selectedRole.toUpperCase()}!`);
          setTimeout(() => {
            onLoginSuccess(user);
          }, 600);
          return;
        } catch (fbErr: any) {
          console.warn('Firebase signup attempt note:', fbErr);
          // If Firebase throws specific message, or fallback to backend API registration
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please sign in instead.');
          } else if (fbErr.code === 'auth/weak-password') {
            throw new Error('Password should be at least 6 characters.');
          } else if (fbErr.code === 'auth/invalid-email') {
            throw new Error('Please enter a valid email address.');
          }
          // If Firebase project requires email enumeration or network check, create user via API
          const regRes = await api.register({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: selectedRole,
          });
          const sessionUser: User = regRes.user;
          setAuthSession(regRes.token || `local_${Date.now()}`, sessionUser);
          setSuccessMessage(`Account created successfully as ${selectedRole.toUpperCase()}!`);
          setTimeout(() => {
            onLoginSuccess(sessionUser);
          }, 600);
          return;
        }
      } else {
        // 2. Sign In Flow (Admin or Staff)
        try {
          // Attempt Firebase Auth sign-in
          const fbUser = await firebaseSignIn(email.trim(), password, selectedRole);
          setAuthSession(`fb_${Date.now()}`, fbUser);
          onLoginSuccess(fbUser);
          return;
        } catch (fbErr: any) {
          console.warn('Firebase signin attempt note:', fbErr);
          // If custom message or fallback to API / demo accounts
          if (fbErr.message && fbErr.message.includes('Access restricted')) {
            throw fbErr;
          }
          // Try local database / mock server authentication
          const res = await api.login(email.trim(), password);
          if (res.user.role !== selectedRole) {
            throw new Error(
              `This account has '${res.user.role}' privileges. Please switch to the ${res.user.role.toUpperCase()} tab to log in.`
            );
          }
          setAuthSession(res.token, res.user);
          onLoginSuccess(res.user);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white font-sans">
      <div className="w-full max-w-lg">
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl text-white shadow-md mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stationery Store Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time Inventory, POS Billing & Multi-Role Access
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Role Switcher Tabs (ADMIN vs STAFF) */}
          <div className="p-2 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="tab-role-admin"
                onClick={() => {
                  setSelectedRole('admin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-white' : 'text-blue-600'}`} />
                <div className="text-left leading-tight">
                  <div className="font-bold">Admin Portal</div>
                  <div className={`text-[10px] ${selectedRole === 'admin' ? 'text-blue-100' : 'text-slate-400'}`}>
                    Full Access & Reports
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="tab-role-staff"
                onClick={() => {
                  setSelectedRole('staff');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all ${
                  selectedRole === 'staff'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${selectedRole === 'staff' ? 'text-white' : 'text-emerald-600'}`} />
                <div className="text-left leading-tight">
                  <div className="font-bold">Staff Portal</div>
                  <div className={`text-[10px] ${selectedRole === 'staff' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    POS Billing & Sales
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Mode Switcher: Sign In vs Sign Up */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {selectedRole === 'admin' ? (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                      Staff
                    </span>
                  )}
                  <span>{isSignUp ? 'Create New Account' : 'Sign In to Portal'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSignUp
                    ? `Register a new ${selectedRole} account`
                    : `Enter your credentials to access the ${selectedRole} panel`}
                </p>
              </div>

              {/* Sign In / Sign Up Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  id="mode-signin-btn"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    !isSignUp ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="mode-signup-btn"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    isSignUp ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Popup Closed / Cancelled Notice & Resolution */}
            {popupClosedNotice && (
              <div className="mb-5 p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-slate-800 text-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Google Sign-In Popup Interrupted</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The Google account window was closed or prevented by browser iframe sandbox policies. You can retry, open in a full window, or continue directly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    id="btn-retry-google"
                    disabled={googleLoading}
                    onClick={handleGoogleAuth}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Retry Popup</span>
                  </button>

                  <button
                    type="button"
                    id="btn-open-fullscreen"
                    onClick={handleOpenNewTab}
                    className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Open in Full Tab</span>
                  </button>
                </div>
              </div>
            )}

            {/* Unauthorized Domain Helper & Resolution */}
            {unauthorizedDomain && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-slate-800 text-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How to authorize this domain in Firebase Console:</span>
                </div>
                
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
                  <li>
                    Open Firebase Console:{' '}
                    <a
                      href="https://console.firebase.google.com/project/stationarystoremanagement/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 underline inline-flex items-center gap-0.5"
                    >
                      Auth Settings <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>Click <strong>Authorized domains</strong> &gt; <strong>Add domain</strong></li>
                  <li>Paste the domain below and click <strong>Save</strong>:</li>
                </ol>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-300">
                  <code className="text-[11px] font-mono text-slate-900 flex-1 truncate select-all font-semibold">
                    {unauthorizedDomain}
                  </code>
                  <button
                    type="button"
                    id="btn-copy-unauth-domain"
                    onClick={handleCopyDomain}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field on Sign Up */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="input-fullname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      required={isSignUp}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password on Sign Up */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required={isSignUp}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              )}

              {/* Role Confirmation Alert for Sign Up */}
              {isSignUp && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-900">Account Type:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      selectedRole === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedRole.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-auth-submit"
                disabled={loading || googleLoading}
                className={`w-full mt-2 py-3 px-4 font-bold rounded-xl text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm ${
                  selectedRole === 'admin'
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/30'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create {selectedRole === 'admin' ? 'Admin' : 'Staff'} Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In as {selectedRole === 'admin' ? 'Admin' : 'Staff'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2.5 text-slate-400 font-medium tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In / Sign Up Button */}
            <button
              type="button"
              id="btn-google-auth"
              disabled={loading || googleLoading}
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xs group cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
