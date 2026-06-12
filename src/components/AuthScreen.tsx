import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { INITIAL_USERS } from '../data';
import { User, UserRole } from '../types';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu,
  ChevronRight,
  Database,
  ArrowRight,
  LogOut,
  Info,
  Search,
  Wrench,
  Headphones,
  Shield,
  Sparkles,
  Activity
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, users, setUsers }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-configured mock test users lists grouped by role for fast one-click login
  const testUsers = users.length > 0 ? users : INITIAL_USERS;

  // Quick Search & Filters for accounts
  const [quickSearch, setQuickSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [authenticatingUser, setAuthenticatingUser] = useState<User | null>(null);

  const handleQuickConnect = (user: User) => {
    setAuthenticatingUser(user);
    setTimeout(() => {
      onAuthSuccess({ ...user, status: 'online' });
      setAuthenticatingUser(null);
    }, 600);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          // Extract role metadata or fall back to operator
          const metadata = data.user.user_metadata || {};
          const loggedInUser: User = {
            id: data.user.id,
            username: data.user.email?.split('@')[0] || 'custom_user',
            fullName: metadata.fullName || metadata.full_name || 'Supabase User',
            role: (metadata.role as UserRole) || 'operator',
            email: data.user.email || '',
            phone: metadata.phone || '',
            zone: metadata.zone || '',
            status: 'online'
          };
          
          setSuccessMsg('U identifikua me sukses në Supabase!');
          setTimeout(() => {
            onAuthSuccess(loggedInUser);
          }, 800);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Gabim gjatë identifikimit me Supabase.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local Database/Mock Mode fallback authentication
      setTimeout(() => {
        const matched = testUsers.find(
          u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (matched) {
          onAuthSuccess({ ...matched, status: 'online' });
        } else {
          // If no pre-defined mock match, check if we can Auto-create or let them in with custom data
          const newUser: User = {
            id: `usr-${Date.now()}`,
            username: email.split('@')[0],
            fullName: fullName || email.split('@')[0].toUpperCase(),
            role: role,
            email: email,
            phone: phone || '+355 69 00 00 000',
            zone: zone || 'All Zones',
            status: 'online'
          };
          // Add newly logged user to app state users list
          const updatedUsers = [...testUsers, newUser];
          setUsers(updatedUsers);
          localStorage.setItem('diginet_users', JSON.stringify(updatedUsers));
          onAuthSuccess(newUser);
        }
        setLoading(false);
      }, 600);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email || !password || !fullName) {
      setErrorMsg('Ju lutem plotësoni fushën e Email-it, Fjalëkalimit dhe Emrit të Plotë.');
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              fullName,
              role,
              phone,
              zone
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMsg('Llogaria u krijua! Ju lutem kontrolloni email-in tuaj për konfirmim (nëse kërkohet).');
          // Automatically log the user in
          const loggedInUser: User = {
            id: data.user.id,
            username: email.split('@')[0],
            fullName,
            role,
            email,
            phone,
            zone,
            status: 'online'
          };
          setTimeout(() => {
            onAuthSuccess(loggedInUser);
          }, 1500);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Gabim gjatë krijimit të llogarisë.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local Database/Mock Register
      setTimeout(() => {
        const newUser: User = {
          id: `usr-${Date.now()}`,
          username: email.split('@')[0],
          fullName,
          role,
          email,
          phone: phone || '+355 69 00 00 000',
          zone: zone || 'Zone Universale',
          status: 'online'
        };

        const updatedUsers = [...testUsers, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('diginet_users', JSON.stringify(updatedUsers));
        
        setSuccessMsg('Llogaria u regjistrua me sukses offline!');
        setTimeout(() => {
          onAuthSuccess(newUser);
        }, 800);
        setLoading(false);
      }, 600);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } catch (err: any) {
        setErrorMsg(err.message || 'Gabim gjatë hyrjes me Google OAuth.');
        setLoading(false);
      }
    } else {
      // Simulate Google Auth with a mock profile
      setTimeout(() => {
        const mockGoogleUser: User = {
          id: 'usr-google',
          username: 'google.visitor',
          fullName: 'Google User',
          role: 'admin', // default to admin for seamless evaluation
          email: 'google.guest@gmail.com',
          phone: '+355 69 99 99 999',
          status: 'online'
        };
        onAuthSuccess(mockGoogleUser);
        setLoading(false);
      }, 800);
    }
  };



  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Dynamic Authenticating Loader Overlay */}
      {authenticatingUser && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg/95 backdrop-blur-md">
          <div className="relative p-12 bg-brand-card border border-brand-border rounded-2xl shadow-2xl text-center space-y-6 max-w-sm flex flex-col items-center animate-pulse">
            <div className="p-4 bg-brand-accent-blue/20 rounded-full text-brand-accent-blue animate-spin">
              <Activity className="w-8 h-8 font-bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase">AUTORIZIMI I LLOGARISË</h3>
              <p className="text-xs text-brand-accent-blue mt-1 font-mono tracking-wider">@{authenticatingUser.username.toUpperCase()}</p>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Lidhja me databazën po autorizohet si <strong className="text-white">{authenticatingUser.fullName}</strong>. Ju lutem prisni...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl relative z-10 my-4">
        
        {/* Main 2-Column Responsive Layout - 5 cols form, 7 cols list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* COLUMN 1: Core Authentication Form Input Fields */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-brand-card/75 border border-brand-border/80 rounded-2xl p-6 md:p-8 shadow-2xl glass-panel relative flex flex-col justify-between h-full">
              
              <div>
                {/* Visual Header of auth box */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-brand-accent-blue/15 text-brand-accent-blue text-[10px] font-bold font-mono uppercase tracking-widest">
                      DIGINET SECURE PORTAL
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {isSignUp ? 'Krijo një Llogari të Re' : 'Identifikohu në Sistem'}
                  </h3>
                  <p className="text-xs text-brand-text-secondary mt-1.5 leading-relaxed">
                    {isSignUp 
                      ? 'Krijo llogari të re si Operator, Teknik, Inxhinier ose Admin të rrjetit.' 
                      : 'Vendosni të dhënat tuaja për të hyrë në panel ose klikoni mbi llogarinë tuaj në të djathtë.'}
                  </p>
                </div>

                <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="flex flex-col gap-4">
                  
                  {/* Show dynamic messages */}
                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono tracking-wider">Email Adresa</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@diginet.al"
                        className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-brand-text-muted focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Fields during Signup */}
                  {isSignUp && (
                    <>
                      {/* Full Name Field */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono tracking-wider">Emri i Plotë</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="p.sh. Fatmir Hoxha"
                            className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-brand-text-muted focus:outline-none transition-all"
                            required={isSignUp}
                          />
                        </div>
                      </div>

                      {/* Role selection row */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono tracking-wider">Roli i Përdoruesit</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(['admin', 'operator', 'technician', 'engineer'] as UserRole[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRole(r)}
                              className={`py-2 px-1 rounded-lg border text-xs capitalize font-mono font-medium transition-all ${
                                role === r
                                  ? 'bg-brand-accent-blue/20 text-brand-accent-blue border-brand-accent-blue font-bold'
                                  : 'bg-[#0d1324] text-brand-text-secondary border-brand-border hover:border-brand-text-secondary/50'
                              }`}
                            >
                              {r === 'admin' ? 'Admin' : r === 'operator' ? 'Operator' : r === 'technician' ? 'Teknik' : 'Inxhinier'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Conditional Fields if registering as a technician */}
                      {role === 'technician' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono tracking-wider">Telin / Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                              <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+355 69 XX XX XXX"
                                className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-brand-text-muted focus:outline-none transition-all font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono tracking-wider">Zona Operative</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                              <input
                                type="text"
                                value={zone}
                                onChange={(e) => setZone(e.target.value)}
                                placeholder="p.sh. Zone 3 (Don Bosko)"
                                className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-brand-text-muted focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Password Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono tracking-wider">Fjalëkalimi</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-brand-text-muted focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit & Identity selection */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-accent-blue hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg shadow-brand-accent-blue/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Duke u procesuar...</span>
                      </>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Regjistro Llogarinë' : 'Identifikohu'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Google Provider with Custom vector look */}
                <div className="mt-5 flex flex-col gap-4">
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-brand-border"></div>
                    <span className="flex-shrink mx-4 text-brand-text-muted text-[9px] font-mono uppercase tracking-widest">Ose Kyçu Me Google</span>
                    <div className="flex-grow border-t border-brand-border"></div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-[#1b243c] hover:bg-brand-card-hover text-white active:scale-[0.99] border border-brand-border hover:border-brand-text-secondary/40 font-semibold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    <span>{loading ? 'Duke u lidhur...' : (isSignUp ? 'Regjistrohu me Google' : 'Kyçu me Google')}</span>
                  </button>
                </div>
              </div>

              {/* Prompt Toggle Switcher */}
              <div className="mt-6 text-center border-t border-brand-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-brand-accent-blue hover:underline cursor-pointer font-medium"
                >
                  {isSignUp 
                    ? 'Keni tashmë një llogari? Identifikohu këtu' 
                    : 'Nuk keni ende llogari? Regjistrohu me 1 hap'}
                </button>
              </div>

            </div>
          </div>

          {/* COLUMN 2: Unlimited Interactive Accounts Catalog (NO LIMITS, CLICK TO LOGIN) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-brand-card/75 border border-brand-border/80 rounded-2xl p-6 shadow-2xl glass-panel relative flex flex-col h-full justify-between">
              
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-brand-border/50">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-accent-blue" />
                      Llogaritë Aktuale pa Limit
                    </h3>
                    <p className="text-[11px] text-brand-text-secondary mt-1">
                      Klikoni mbi cilëndo llogari më poshtë për të fluturuar menjëherë brenda sistemit.
                    </p>
                  </div>
                  <div className="bg-[#0b1021] border border-brand-border px-3 py-1.5 rounded-lg text-[10px] font-mono text-brand-accent-blue font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent-blue animate-pulse"></span>
                    STAF: {testUsers.length}
                  </div>
                </div>

                {/* Search field inside catalog */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input
                      type="text"
                      placeholder="Kërko llogari sipas emrit, rolit apo email-it..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      className="w-full bg-[#0c1222] border border-brand-border focus:border-brand-accent-blue rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-brand-text-muted focus:outline-none transition-all"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'admin', 'operator', 'technician', 'engineer'] as const).map((r) => {
                      const count = r === 'all' 
                        ? testUsers.length 
                        : testUsers.filter(u => u.role === r).length;

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRoleFilter(r)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                            roleFilter === r
                              ? 'bg-brand-accent-blue/20 text-brand-accent-blue border-brand-accent-blue font-bold'
                              : 'bg-[#0c1222] text-brand-text-secondary border-brand-border hover:border-brand-text-secondary/50'
                          }`}
                        >
                          {r === 'all' ? 'TË GJITHË' : r === 'admin' ? 'ADMIN' : r === 'operator' ? 'OPERATOR' : r === 'technician' ? 'TEKNIK' : 'INXHINIER'}
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] ${
                            roleFilter === r ? 'bg-brand-accent-blue text-white' : 'bg-brand-card/80 text-brand-text-muted'
                          }`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* List Container */}
                <div className="flex-1 max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                  {testUsers
                    .filter(u => {
                      const searchMatches = u.fullName.toLowerCase().includes(quickSearch.toLowerCase()) ||
                                            u.username.toLowerCase().includes(quickSearch.toLowerCase()) ||
                                            u.email.toLowerCase().includes(quickSearch.toLowerCase());
                      const roleMatches = roleFilter === 'all' || u.role === roleFilter;
                      return searchMatches && roleMatches;
                    })
                    .map((u) => {
                      // Style configurations
                      let iconBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      let RoleIcon = Wrench;
                      let roleStr = 'Teknik';

                      if (u.role === 'admin') {
                        iconBg = 'bg-red-500/10 text-red-500 border-red-500/20';
                        RoleIcon = Shield;
                        roleStr = 'Admin';
                      } else if (u.role === 'operator') {
                        iconBg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                        RoleIcon = Headphones;
                        roleStr = 'Operator';
                      } else if (u.role === 'engineer') {
                        iconBg = 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
                        RoleIcon = Cpu;
                        roleStr = 'Inxhinier';
                      }

                      return (
                        <div
                          key={u.id}
                          onClick={() => handleQuickConnect(u)}
                          className="p-3 bg-[#0d1428] hover:bg-[#131d38] border border-brand-border hover:border-brand-accent-blue/40 rounded-xl flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            {/* Role badge */}
                            <div className={`relative p-2 rounded-lg border ${iconBg}`}>
                              <RoleIcon className="w-4 h-4" />
                              <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0d1428] ${
                                u.status === 'online' || u.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'
                              }`} />
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-brand-accent-blue transition-colors">
                                  {u.fullName}
                                </span>
                                <span className="text-[9px] font-mono text-brand-text-muted">
                                  @{u.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-brand-text-secondary">
                                <span className="font-semibold uppercase tracking-wider font-mono text-brand-accent-blue text-[8px]">
                                  {roleStr}
                                </span>
                                {u.zone && (
                                  <>
                                    <span className="text-brand-text-muted">•</span>
                                    <span className="flex items-center gap-0.5 text-brand-text-muted font-sans text-[9px]">
                                      <MapPin className="w-3 h-3" />
                                      {u.zone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="hidden sm:inline font-mono text-[9px] text-brand-text-muted">
                              {u.phone || '+355 69...'}
                            </span>
                            <div className="bg-brand-accent-blue/10 group-hover:bg-brand-accent-blue/20 text-brand-accent-blue p-1 rounded-lg transition-colors">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {testUsers.length === 0 && (
                    <div className="p-8 text-center border border-dashed border-brand-border rounded-xl">
                      <p className="text-xs text-brand-text-secondary">Nuk u gjet asnjë llogari shtesë e rregjistruar.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-border/40 text-[10px] text-brand-text-muted font-mono leading-relaxed text-center sm:text-left">
                💡 Çdo staf i krijuar në <strong className="text-white">Panelin e Administratorit</strong> shtohet këtu automatikisht pa limitë sesioni!
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
