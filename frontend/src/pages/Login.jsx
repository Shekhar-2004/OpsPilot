import React, { useState } from 'react';
import { authService } from '../services/api';
import { Shield, Mail, Lock, User, UserCheck, AlertTriangle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await authService.login(email, password);
        onLoginSuccess(data.user);
      } else {
        await authService.signup(name, email, role, password);
        const data = await authService.login(email, password);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg select-none relative">
      {/* Background soft glowing gold blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/40 p-8 rounded-xxl shadow-sm relative overflow-hidden">
        {/* Subtle top gold accent rule */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent"></div>

        {/* Client gateway metadata console */}
        <div className="flex justify-between items-center mb-6 px-1 font-sans text-[10px] text-on-surface-variant/80 border-b border-outline-variant/20 pb-3 font-semibold uppercase tracking-wider">
          <span>PORT: 5173 // ACTIVE</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim sage-pulse"></span>
            SECURE ACCESS
          </span>
        </div>

        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-secondary-container/10 border border-secondary/30 rounded-xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-secondary" />
          </div>
          <h1 className="text-3xl font-display text-primary tracking-tight">
            OpsPilot
          </h1>
          <p className="text-on-surface-variant text-[9px] mt-1 font-bold uppercase tracking-widest font-sans">
            CORE GATEWAY AUTHORIZATION
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-container p-1 rounded-xl mb-6 border border-outline-variant/30">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              isLogin 
                ? 'bg-surface-container-lowest text-primary border border-outline-variant/30 shadow-sm' 
                : 'text-on-surface-variant/75 hover:text-primary'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              !isLogin 
                ? 'bg-surface-container-lowest text-primary border border-outline-variant/30 shadow-sm' 
                : 'text-on-surface-variant/75 hover:text-primary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <p className="text-xs text-error font-semibold leading-relaxed font-sans">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans mb-1.5">
                Full Operator Name
              </label>
              <div className="relative">
                <User className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
                <input
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full console-input pl-8 py-2.5 text-primary text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans mb-1.5">
              Identity Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
              <input
                type="email"
                required
                placeholder="operator@opspilot.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full console-input pl-8 py-2.5 text-primary text-sm"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans mb-1.5">
                Workspace Execution Role
              </label>
              <div className="relative">
                <UserCheck className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full console-input pl-8 py-2.5 text-primary text-sm appearance-none bg-surface"
                >
                  <option value="member">Team Collaborator</option>
                  <option value="coordinator">Operations Coordinator</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans mb-1.5">
              Access Secret Key
            </label>
            <div className="relative">
              <Lock className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full console-input pl-8 py-2.5 text-primary text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg font-bold uppercase tracking-wider text-xs bg-primary hover:opacity-90 transition-opacity text-on-primary flex items-center justify-center gap-2 shadow-sm mt-6 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-on-primary/20 border-t-on-primary rounded-full animate-spin"></span>
            ) : (
              <span>{isLogin ? 'ESTABLISH CONNECTION' : 'INITIALIZE CREDENTIALS'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
