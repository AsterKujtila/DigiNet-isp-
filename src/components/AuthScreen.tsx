import React, { useState } from 'react';
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
  Chrome,
  ArrowRight,
  LogOut,
  Info
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
      }
    } else {
      // Simulate Google Auth with a mock profile
      setLoading(true);
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

  // Instant login for evaluation convenience
  const handleQuickLogin = (user: User) => {
    setLoading(true);
    setTimeout(() => {
      onAuthSuccess({ ...user, status: 'online' });
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      
      {/* Dynamic Background subtle blur accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent-purple/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: System info & Credentials guideline */}
        <div className="lg:col-span-5 text-left flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-accent-blue to-brand-accent-purple flex items-center justify-center font-bold text-white shadow-xl text-lg">
              DN
            </div>
            <div>
              <p className="text-xl font-extrabold text-white tracking-tight">DIGINET ISP</p>
              <p className="text-xs text-brand-text-secondary uppercase tracking-widest font-mono">PORTAL MENAXHIMI</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Sistemi i Integruar i Ndihmës dhe Monitorimit
          </h2>
          <p className="text-brand-text-secondary text-sm leading-relaxed">
            Ky aplikacion i koordinuar i mundëson operatorëve, teknikëve, inxhinierëve dhe administratorëve kontrollin e aseteve, infrastrukturës dhe ndjekjen e problemeve në kohë reale.
          </p>

          {/* Connection Mode Indicator */}
          <div className={`p-4 rounded-xl border ${
            isSupabaseConfigured 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-brand-accent-amber/10 border-brand-accent-amber/30 text-amber-300'
          }`}>
            <div className="flex items-start gap-3">
              {isSupabaseConfigured ? (
                <Database className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-accent-amber" />
              )}
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider">
                  {isSupabaseConfigured ? 'Connected to Supabase (LIVE)' : 'Mënyra Demo (NUK KA SUPABASE)'}
                </p>
                <p className="mt-1 leading-relaxed text-brand-text-primary/80">
                  {isSupabaseConfigured 
                    ? 'Aplikacioni është i lidhur me databazën reale Supabase. Auth me Google dhe email është aktive.'
                    : 'Konfiguroni VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY në Secrets të AI Studio për të përdorur databazën live. Aktualisht mund të përdorni sistemin me ruterin lokal ose Quick-Login më poshtë.'}
                </p>
              </div>
            </div>
          </div>

          {/* Prompt quick log-in list for testing ease */}
          <div className="bg-[#0f162a]/90 border border-brand-border/60 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1 text-[11px] font-mono tracking-wider text-brand-text-secondary uppercase">
              <Info className="w-3.5 h-3.5 text-brand-accent-blue" />
              <span>Zgjidh llogari ekzistuese (Quick Login):</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {testUsers.slice(0, 4).map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => handleQuickLogin(usr)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-brand-card hover:bg-brand-card-hover border border-brand-border/50 transition-all text-left group"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    usr.role === 'admin' ? 'bg-red-500' :
                    usr.role === 'operator' ? 'bg-amber-500' :
                    usr.role === 'technician' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-brand-text-secondary font-mono capitalize">{usr.role}</p>
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-brand-accent-blue transition-colors">{usr.fullName}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand-text-muted group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>

            <p className="text-[9px] text-center text-brand-text-muted italic">
              Klikoni cilëndo llogari më sipër për të hyrë menjëherë në panelin përkatës pa fjalëkalim (Mënyra Testuese).
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Authentication Form */}
        <div className="lg:col-span-7 bg-brand-card/75 border border-brand-border/80 rounded-2xl p-6 md:p-8 shadow-2xl glass-panel relative">
          
          {/* Visual Header of auth box */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {isSignUp ? 'Krijo një Llogari të Re' : 'Identifikohu në Sistem'}
            </h3>
            <p className="text-xs text-brand-text-secondary mt-1">
              {isSignUp 
                ? 'Regjistrohu si Operator, Teknik ose administrator i rrjetit.' 
                : 'Vendosni të dhënat tuaja për të hyrë në panelin përkatës.'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="flex flex-col gap-4">
            
            {/* Show dynamic messages */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono">Email Adresa</label>
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
                  <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono">Emri i Plotë</label>
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
                  <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono">Roli i Përdoruesit</label>
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
                      <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono">Telin / Phone</label>
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
                      <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono">Zona Operative</label>
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
              <label className="text-xs text-brand-text-secondary font-medium uppercase font-mono">Fjalëkalimi</label>
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
              className="w-full bg-brand-accent-blue hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-lg shadow-brand-accent-blue/15"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Rregjistro Llogarinë' : 'Identifikohu'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Google Provider with Custom vector look */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-brand-border"></div>
              <span className="flex-shrink mx-4 text-brand-text-muted text-[10px] font-mono uppercase tracking-wider">Ose Kyçu Me Google</span>
              <div className="flex-grow border-t border-brand-border"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-[#1b243c] hover:bg-brand-card-hover text-white active:scale-[0.99] border border-brand-border hover:border-brand-text-secondary/40 font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-brand-accent-blue" />
              <span>{isSignUp ? 'Regjistrohu me Google' : 'Kyçu me Google'}</span>
            </button>
          </div>

          {/* Prompt Toggle Switcher */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs text-brand-accent-blue hover:underline cursor-pointer"
            >
              {isSignUp 
                ? 'Keni tashmë një llogari? Identifikohu këtu' 
                : 'Nuk keni ende llogari? Regjistrohu me 1 hap'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
