import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeamWorkspace from './pages/TeamWorkspace';
import AIQuery from './pages/AIQuery';
import Reports from './pages/Reports';
import { authService } from './services/api';
import { Shield, Sparkles, LayoutDashboard, Users, MessageSquare, LogOut, Terminal, Activity, BarChart3, Sun, Moon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Dark mode state management matching system preferences and localStorage overrides
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('opspilot_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Profile Customization Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('member');
  const [profileAvatar, setProfileAvatar] = useState('');

  useEffect(() => {
    checkActiveSession();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('opspilot_dark_mode', darkMode);
  }, [darkMode]);

  // Load custom user profile fields when user state resolves
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileRole(user.role || 'member');
      setProfileAvatar(user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkgseMOU5Xz_MI1CTDJIHoyUY-oY4fncNoac6MZRvbAHjIwHVcxYuWOsxL4Gf7ZyWTuHf1DEJDsNQ5M5c5HnCPfwAqolG7kTQIMCERWPbzPyfjDiABaltEFXjiayZDUswcEdzsLw6PfVJ6k0lvjXIg5za-B1oLkvRSd29AOxdHCc7H6Tf-Ixa0AG3aZpqAU-5sGeO2Y8JGiAqayfiiAZK6hkGP-4doe4-0zFLF5f3GNDyfUXmwxvtgmxXwitQbp7inlL0XkQnP_IU');
    }
  }, [user]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const checkActiveSession = async () => {
    const token = localStorage.getItem('opspilot_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const localUser = localStorage.getItem('opspilot_custom_user');
      if (localUser) {
        setUser(JSON.parse(localUser));
      } else {
        const activeUser = await authService.getMe();
        setUser(activeUser);
      }
    } catch (err) {
      console.error("Session expired or invalid token.");
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    // Reset custom user on successful login
    localStorage.removeItem('opspilot_custom_user');
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('opspilot_custom_user');
    setUser(null);
  };

  const handleUpdateProfile = async (updatedFields) => {
    try {
      const updatedUser = await authService.updateProfile(updatedFields.name, updatedFields.role);
      const newCustomUser = {
        ...updatedUser,
        avatar: updatedFields.avatar
      };
      setUser(newCustomUser);
      localStorage.setItem('opspilot_custom_user', JSON.stringify(newCustomUser));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update profile details in database.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <span className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase animate-pulse">Initializing OpsPilot Engine...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-bg flex text-primary font-sans antialiased">
      {/* Desktop Navigation Drawer */}
      <aside className="w-72 border-r border-outline-variant/30 bg-surface-container-low flex flex-col p-6 shrink-0 hidden md:flex h-screen sticky top-0 justify-between">
        
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex flex-col items-start px-2">
            <h1 className="font-display text-3xl text-primary tracking-tight">
              OpsPilot
            </h1>
            
            {/* Technical Lead Operator Avatar Card */}
            <div className="w-full flex items-center mt-6 p-3 bg-surface-container rounded-xl border border-outline-variant/20 relative group/profile">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 shrink-0">
                <img 
                  alt="Lead Operator Avatar" 
                  className="object-cover w-full h-full" 
                  src={user.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkgseMOU5Xz_MI1CTDJIHoyUY-oY4fncNoac6MZRvbAHjIwHVcxYuWOsxL4Gf7ZyWTuHf1DEJDsNQ5M5c5HnCPfwAqolG7kTQIMCERWPbzPyfjDiABaltEFXjiayZDUswcEdzsLw6PfVJ6k0lvjXIg5za-B1oLkvRSd29AOxdHCc7H6Tf-Ixa0AG3aZpqAU-5sGeO2Y8JGiAqayfiiAZK6hkGP-4doe4-0zFLF5f3GNDyfUXmwxvtgmxXwitQbp7inlL0XkQnP_IU"} 
                />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-xs text-primary font-bold truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim sage-pulse"></div>
                  <span className="text-[9px] text-on-tertiary-fixed-variant font-semibold uppercase tracking-wider">AI-Sync Active</span>
                </div>
              </div>
              
              {/* Profile settings edit trigger */}
              <button
                onClick={() => setShowProfileModal(true)}
                title="Edit Profile"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-all cursor-pointer select-none"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-1">
            {[
              { id: 'dashboard', label: 'Live Monitoring', icon: LayoutDashboard },
              { id: 'workspace', label: 'Team Sprints', icon: Users },
              { id: 'ai_query', label: 'AI Operations', icon: MessageSquare },
              { id: 'reports', label: 'Alerts & Reports', icon: BarChart3 }
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out text-left cursor-pointer ${
                    isActive 
                      ? 'bg-secondary-container/10 border-r-2 border-secondary text-primary font-bold' 
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`} />
                  <span className="text-sm font-semibold tracking-wide font-sans">{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Stable Version Footer & Uptime Info */}
        <div className="space-y-4">
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20">
            <p className="text-[9px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-widest font-sans">SYSTEM UPTIME</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim sage-pulse"></div>
              <span className="text-sm font-semibold text-primary">99.98%</span>
            </div>
          </div>
          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between px-1">
            <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-widest">v2.4.0-stable</span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-2 hover:bg-surface-container-highest rounded-xl text-on-surface-variant hover:text-secondary transition-all cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4 text-secondary" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLogout}
                title="Logout session"
                className="p-2 hover:bg-surface-container-highest rounded-xl text-on-surface-variant hover:text-error transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-bg">
        
        {/* Header bar */}
        <header className="h-16 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim sage-pulse"></div>
            <span className="text-[10px] font-bold text-on-tertiary-fixed-variant font-sans uppercase tracking-widest">SYSTEM NOMINAL</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button (Mobile & Desktop quick access) */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-full text-on-surface-variant hover:text-secondary transition-all cursor-pointer flex items-center justify-center md:hidden"
            >
              {darkMode ? <Sun className="w-4 h-4 text-secondary animate-none" /> : <Moon className="w-4 h-4 animate-none" />}
            </button>

            {/* Mobile profile edit settings trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              title="Edit Profile"
              className="p-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-full text-on-surface-variant hover:text-secondary transition-all cursor-pointer flex items-center justify-center md:hidden"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>

            {/* Quick user role selector badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container-low border border-outline-variant/30 rounded-full text-on-surface-variant text-xs">
              <Activity className="w-3.5 h-3.5 text-secondary" />
              <span>Role: <span className="font-semibold text-primary uppercase text-[10px] tracking-wider">{user.role}</span></span>
            </div>

            {/* Mobile LogOut Button */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-error transition-colors md:hidden cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 overflow-y-auto bg-bg">
          
          {/* Mobile Navigation bar */}
          <div className="flex gap-1 p-1 bg-surface-container border border-outline-variant/30 rounded-xl mb-6 md:hidden">
            {[
              { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
              { id: 'workspace', label: 'Sprints', icon: Users },
              { id: 'ai_query', label: 'AI Chat', icon: MessageSquare },
              { id: 'reports', label: 'Alerts', icon: BarChart3 }
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-secondary-container/10 text-secondary border border-secondary/30' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Active View Router */}
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'workspace' && <TeamWorkspace user={user} />}
          {activeTab === 'ai_query' && <AIQuery user={user} />}
          {activeTab === 'reports' && <Reports />}

        </main>

      </div>

      {/* Profile Customization Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-primary/25 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/40 p-6 rounded-xxl relative shadow-md text-primary">
            <h3 className="text-xl font-display text-primary mb-2">Edit Operator Profile</h3>
            <p className="text-xs text-on-surface-variant mb-4 font-sans leading-relaxed">Customize your administrative metadata details and avatar appearance.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateProfile({
                ...user,
                name: profileName,
                role: profileRole,
                avatar: profileAvatar
              });
              setShowProfileModal(false);
            }} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">Operator Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full console-input pl-1 py-2 text-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">Execution Role</label>
                <select
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full console-input pl-1 py-2 text-primary bg-surface"
                >
                  <option value="member">Team Collaborator</option>
                  <option value="coordinator">Operations Coordinator</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">Select Premium Avatar</label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {[
                    {
                      name: "Julian",
                      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkgseMOU5Xz_MI1CTDJIHoyUY-oY4fncNoac6MZRvbAHjIwHVcxYuWOsxL4Gf7ZyWTuHf1DEJDsNQ5M5c5HnCPfwAqolG7kTQIMCERWPbzPyfjDiABaltEFXjiayZDUswcEdzsLw6PfVJ6k0lvjXIg5za-B1oLkvRSd29AOxdHCc7H6Tf-Ixa0AG3aZpqAU-5sGeO2Y8JGiAqayfiiAZK6hkGP-4doe4-0zFLF5f3GNDyfUXmwxvtgmxXwitQbp7inlL0XkQnP_IU"
                    },
                    {
                      name: "Elena",
                      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAntcXGv99l6heLRryLkVG8CfENRnYVMQ5hv4xZO4ADB4efikneHhL5doKeRZu-n2FIAdZB7gdhzf5tT_PqGNTG6C6soiWRuPyvCmIHwfPCTupK4C47mJ99djNhflRWlpwP_ckuzFqJ4kYWM53YtMuagyw9z-ICPkxJdB3_jcDocwQJTlj-yLkP0H6gfc0d8fsCsobadWKconb_h5pDOQgtYWFZ42kaF2TYhOA4vN6DNQl25p28X-B-N0YK7UXsBKWnwH7MWNBkxlI"
                    },
                    {
                      name: "Marcus",
                      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuANtDhMNf0xCSd68Q9W7tw3Ybv-6hOsiwQWmgVdQ54hZt653LbbepN-F0AgdfjfO76EW0AYkp8nbKYUON5iNG7g-seKCmN2e8oQb80LBoMZqRzQeBHZtQdLag9jFTd6CJGrLlroMinT1QRYvxWbhB-_dCxpi72CVRzHsJ_etnx36uj7w2CyJlTDY1h5yDIX3hPXgFmOWcZ03jo5nAhVFFOHOMxo2pNLJFRH-rGD7_0ik6cHZKVgBO1HhP43VNR2BKiuqkDdTilTo7g"
                    },
                    {
                      name: "Director",
                      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaVSE7jUjFqBSny5TIFZFCBA0eKo8ubjnbzaExtonuxgLB7GhUdewrf4jzf7GcvnFEn_ahrroeFuxBJuOPdlKgayr6Yjqb7PR4GbIR389cElKiAnP3WPoqBj2Q451eX1Ix_ApeisGezm4Sup8uTxLHwT0PbV_uect-x46i3Qsd2_9iMXA_Ft2l7vdyjVxLzc3U9RlyDYFNaPkqsbbCA2EGb4g3mPCjvkoE5aGlYggLkvNABxFYAGtNyxBs9sCApml9lp6kraij8dU"
                    }
                  ].map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatar(av.url)}
                      className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        profileAvatar === av.url ? 'border-secondary shadow-sm scale-105' : 'border-outline-variant/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img alt={av.name} src={av.url} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">Custom Avatar URL</label>
                <input
                  type="text"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  className="w-full console-input pl-1 py-2 text-primary font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-sm text-primary font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg text-sm text-on-primary font-semibold transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
