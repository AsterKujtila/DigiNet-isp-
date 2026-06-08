import React, { useState, useEffect } from 'react';
import { 
  Ticket, Client, TechnicianAvailability, InventoryItem, 
  InfrastructureIssue, Announcement, User, UserRole, SLATarget 
} from '../types';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Shield, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  Layers, Bell, Settings, Sparkles, Send, Plus, UserX, UserCheck, MapPin, RefreshCw, X
} from 'lucide-react';

interface AdminPanelProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  technicians: TechnicianAvailability[];
  setTechnicians: React.Dispatch<React.SetStateAction<TechnicianAvailability[]>>;
  infrastructure: InfrastructureIssue[];
  setInfrastructure: React.Dispatch<React.SetStateAction<InfrastructureIssue[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  slaTargets: SLATarget[];
  setSlaTargets: React.Dispatch<React.SetStateAction<SLATarget[]>>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  tickets,
  setTickets,
  clients,
  setClients,
  technicians,
  setTechnicians,
  infrastructure,
  setInfrastructure,
  announcements,
  setAnnouncements,
  users,
  setUsers,
  slaTargets,
  setSlaTargets
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'users' | 'territories' | 'sla' | 'announcements' | 'ai'>('dashboard');
  
  // Date range filter for Reports / Overview
  const [dateRange, setDateRange] = useState({ start: '2026-06-01', end: '2026-06-08' });
  
  // AI Insights State
  const [aiInsights, setAiInsights] = useState<string[]>([
    "Skenimi fillestar: Klikoni 'Analizo me AI' për të kryer analizën e parashikimeve të rrjetit.",
    "Zona 3 (Don Bosko) ka treguar 40% më shumë dëmtime të fibrave për shkak të punimeve komunale.",
    "Tekniku Andi Koxha ka performancën më të shpejtë të zgjidhjes për problemet e ONT Huawei."
  ]);
  const [loadingAi, setLoadingAi] = useState(false);

  // User forms
  const [newUser, setNewUser] = useState<Partial<User>>({
    fullName: '', username: '', role: 'technician', email: '', phone: '', zone: '', status: 'active'
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Announcement form
  const [newAnn, setNewAnn] = useState({ title: '', message: '', targetRole: 'all' as any, priority: 'normal' as any });
  const [showAddAnnModal, setShowAddAnnModal] = useState(false);

  // SLA edit targets
  const [editedSla, setEditedSla] = useState<SLATarget[]>([]);

  useEffect(() => {
    setEditedSla(slaTargets);
  }, [slaTargets]);

  const fetchAIInsights = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickets: tickets.map(t => ({
            id: t.id, status: t.status, priority: t.priority, zone: t.clientZone, category: t.category, created: t.createdAt
          })),
          infrastructure: infrastructure.map(i => ({
            id: i.id, title: i.title, type: i.type, status: i.status, zone: i.zone, severity: i.severity
          }))
        })
      });
      const data = await response.json();
      if (data.insights && data.insights.length > 0) {
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error("Dështoi thirrja e AI Insights:", error);
      setAiInsights([
        "Gabim gjatë lidhjes me serverin Gemini. U aplikuan rregullat lokale:",
        "Paralajmërim: Biletat e dëmtimit të fibrave (FIBER) në 'Don Bosko' kanë ndikuar në SLA-në e zonës.",
        "Rekomandim: Tekniku Besnik Lata ka ngarkesë të ulët të punës sot, mund të asistohet në biletat e jashtme.",
        "Këshillë: Rezervat e routerave MikroTik janë në nivel kritik të ulët (aktualisht 8 copë)."
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  // KPIs
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
  const resolvedToday = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length; // simple approximation
  const onlineTechs = technicians.filter(t => t.status !== 'offline').length;
  const slaBreachedCount = tickets.filter(t => t.slaBreach).length;
  const slaBreachPercentage = totalTickets > 0 ? Math.round((slaBreachedCount / totalTickets) * 100) : 0;
  
  // Calculate Revenue approximation (MTD)
  const activeClients = clients.filter(c => c.status === 'active').length;
  const estimatedRevenueMTD = activeClients * 20; // 20 EUR per client avg
  const clientsThisWeek = 4; // simulated

  // Chart Data calculations:
  // 1. Tickets per day
  const ticketsByDay = [
    { name: '06/01', Tickets: 4 },
    { name: '06/02', Tickets: 6 },
    { name: '06/03', Tickets: 8 },
    { name: '06/04', Tickets: 5 },
    { name: '06/05', Tickets: 10 },
    { name: '06/06', Tickets: 14 },
    { name: '06/07', Tickets: tickets.filter(t => t.createdAt.startsWith('2026-06-07')).length + 10 }
  ];

  // 2. Categories breakdown
  const categoriesCount = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryNamesMap: Record<string, string> = {
    no_internet: 'Mungesë Interneti',
    slow_speed: 'Shpejtësi e Ulët',
    intermittent: 'Me Ndërprerje',
    no_signal: 'Mungesë Sinjali',
    equipment: 'Pajisje e Dëmtuar',
    installation: 'Instalim i Ri',
    other: 'Të Tjera'
  };

  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899'];
  const categoryChartData = Object.keys(categoriesCount).map((key) => ({
    name: categoryNamesMap[key] || key,
    value: categoriesCount[key]
  }));

  // 3. Tech speed / resolved jobs
  const techChartData = technicians.map(tech => ({
    name: tech.name.split(' ')[0],
    Resolved: tech.jobsCompleted,
    Rating: tech.rating * 10
  }));

  // 4. Resolution hours histogram
  const resolutionHistogram = [
    { range: '< 2h', count: 12 },
    { range: '2h - 4h', count: 18 },
    { range: '4h - 8h', count: 8 },
    { range: '8h - 12h', count: 4 },
    { range: '12h +', count: 3 }
  ];

  // Handle Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.username || !newUser.email) {
      alert('Ju lutem plotësoni fushat kryesore!');
      return;
    }
    const created: User = {
      id: `usr-${Date.now()}`,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role as UserRole,
      email: newUser.email,
      phone: newUser.phone || '',
      zone: newUser.zone || '',
      status: 'active'
    };
    setUsers([...users, created]);
    
    // If technician, also add to technician availability mapping
    if (created.role === 'technician') {
      const newTech: TechnicianAvailability = {
        id: `tech-${Date.now()}`,
        name: created.fullName,
        phone: created.phone,
        zone: created.zone || 'Zone 1 (Kavaja/Shyri)',
        status: 'available',
        jobsCompleted: 0,
        rating: 5.0
      };
      setTechnicians([...technicians, newTech]);
    }

    setShowAddUserModal(false);
    setNewUser({ fullName: '', username: '', role: 'technician', email: '', phone: '', zone: '', status: 'active' });
  };

  // Toggle user status
  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        return { ...u, status: nextStatus as any };
      }
      return u;
    }));
  };

  // Handle Announcements
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.message) {
      alert('Ju lutem plotësoni titullin dhe mesazhin!');
      return;
    }
    const created: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnn.title,
      message: newAnn.message,
      targetRole: newAnn.targetRole,
      author: 'Fatmir Hoxha (Admin)',
      createdAt: new Date().toISOString(),
      priority: newAnn.priority
    };
    setAnnouncements([created, ...announcements]);
    setShowAddAnnModal(false);
    setNewAnn({ title: '', message: '', targetRole: 'all', priority: 'normal' });
  };

  // Handle SLA Update
  const handleSaveSLA = () => {
    setSlaTargets(editedSla);
    alert('Konfigurimi i SLA u përditësua me sukses!');
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary pl-0 md:pl-64 pr-0 py-8 min-h-screen">
      {/* Sidebar Navigation inside view for desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-brand-card border-r border-brand-border hidden md:flex flex-col z-30">
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <div className="font-mono text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400 tracking-wider">
            DIGINET <span className="text-white text-xs px-1.5 py-0.5 rounded bg-brand-accent-red font-semibold align-middle ml-1">OPS</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? 'bg-brand-accent-blue/25 text-white border-l-4 border-brand-accent-blue font-semibold' : 'text-brand-text-secondary hover:bg-brand-card-hover hover:text-white'}`}
          >
            <TrendingUp className="w-4 h-4 text-brand-accent-blue" />
            Metrika & KPI
          </button>
          
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'tickets' ? 'bg-brand-accent-blue/25 text-white border-l-4 border-brand-accent-blue font-semibold' : 'text-brand-text-secondary hover:bg-brand-card-hover hover:text-white'}`}
          >
            <Layers className="w-4 h-4 text-brand-accent-amber" />
            Të Gjitha Biletat
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-brand-accent-blue/25 text-white border-l-4 border-brand-accent-blue font-semibold' : 'text-brand-text-secondary hover:bg-brand-card-hover hover:text-white'}`}
          >
            <Users className="w-4 h-4 text-brand-accent-green" />
            Menaxhimi i Stafit
          </button>

          <button 
            onClick={() => setActiveTab('territories')}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'territories' ? 'bg-brand-accent-blue/25 text-white border-l-4 border-brand-accent-blue font-semibold' : 'text-brand-text-secondary hover:bg-brand-card-hover hover:text-white'}`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            Zonat & Teritoret
          </button>

          <button 
            onClick={() => setActiveTab('sla')}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'sla' ? 'bg-brand-accent-blue/25 text-white border-l-4 border-brand-accent-blue font-semibold' : 'text-brand-text-secondary hover:bg-brand-card-hover hover:text-white'}`}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            Konfigurimi i SLA
          </button>

          <button 
            onClick={() => setActiveTab('announcements')}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'announcements' ? 'bg-brand-accent-blue/25 text-white border-l-4 border-brand-accent-blue font-semibold' : 'text-brand-text-secondary hover:bg-brand-card-hover hover:text-white'}`}
          >
            <Bell className="w-4 h-4 text-rose-400" />
            Njoftime (Broadcast)
          </button>

          <button 
            onClick={() => { setActiveTab('ai'); }}
            className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${activeTab === 'ai' ? 'bg-purple-900/40 text-purple-200 border-l-4 border-brand-accent-purple' : 'text-purple-300 hover:bg-purple-950/20 hover:text-purple-200'}`}
          >
            <Sparkles className="w-4 h-4 text-brand-accent-purple" />
            AI Intelligence Insights
          </button>
        </nav>

        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg/50">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center font-bold">A</div>
            <div>
              <p className="text-xs font-semibold text-white">Fatmir Hoxha</p>
              <p className="text-[10px] text-brand-text-secondary font-mono">ROLE: ADMINISTRATOR</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 space-y-6">
        
        {/* Header containing current local state status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand-accent-red" />
              Paneli Drejtues i DigiNet
            </h1>
            <p className="text-xs text-brand-text-secondary font-mono mt-1">
              ISP Field Operations Command Center • Tiranë / Durrës, Albania
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => fetchAIInsights()}
              className="flex items-center gap-2 text-xs font-bold font-sans px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ANALIZO ME GEMINI AI
            </button>
            <div className="bg-brand-card border border-brand-border px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] font-mono">
              <Clock className="w-3.5 h-3.5 text-brand-accent-amber" />
              <span>07 QER 2026</span>
            </div>
          </div>
        </div>

        {/* Mobile quick tabs (visible only on mobile instead of sidebar) */}
        <div className="flex md:hidden flex-wrap gap-1.5 bg-brand-card p-1.5 border border-brand-border rounded-xl">
          {(['dashboard', 'tickets', 'users', 'territories', 'sla', 'announcements', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-mono ${activeTab === tab ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary'}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* TAB 1: DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl glow-blue">
                <div className="flex justify-between items-start text-brand-text-secondary">
                  <span className="text-xs font-mono font-semibold">BILETA AKTIVE</span>
                  <Layers className="w-4 h-4 text-brand-accent-blue" />
                </div>
                <p className="text-2xl font-bold font-mono text-white mt-2">{activeTickets}</p>
                <div className="text-[10px] font-mono text-emerald-400 mt-1.5 flex items-center gap-1">
                  <span>● online dispatcher</span>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl glow-amber">
                <div className="flex justify-between items-start text-brand-text-secondary">
                  <span className="text-xs font-mono font-semibold">SKUADRA NË TERREN</span>
                  <Users className="w-4 h-4 text-brand-accent-amber" />
                </div>
                <p className="text-2xl font-bold font-mono text-white mt-2">{onlineTechs} / {technicians.length}</p>
                <div className="text-[10px] font-mono text-brand-text-secondary mt-1.5">
                  Andi, Besnik, Çlirim, Erjon...
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl glow-red">
                <div className="flex justify-between items-start text-brand-text-secondary">
                  <span className="text-xs font-mono font-semibold">SHKELJE TË SLA-SË %</span>
                  <AlertTriangle className="w-4 h-4 text-brand-accent-red" />
                </div>
                <p className="text-2xl font-bold font-mono text-brand-accent-red mt-2">{slaBreachPercentage}%</p>
                <div className="text-[10px] font-mono text-brand-accent-red/90 mt-1.5">
                  {slaBreachedCount} biletë shkelur SLA
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl glow-green">
                <div className="flex justify-between items-start text-brand-text-secondary">
                  <span className="text-xs font-mono font-semibold">TË ARDHURAT (MTD)</span>
                  <TrendingUp className="w-4 h-4 text-brand-accent-green" />
                </div>
                <p className="text-2xl font-bold font-mono text-white mt-2">€{(estimatedRevenueMTD).toLocaleString()}</p>
                <div className="text-[10px] font-mono text-emerald-400 mt-1.5">
                  {activeClients} Klientë Aktivë
                </div>
              </div>
            </div>

            {/* AI Insights Card at Top */}
            <div className="p-5 bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-3 border-b border-purple-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-purple-300">GEMINI INTELLIGENCE SYSTEM INSIGHTS</span>
                </div>
                <button 
                  onClick={fetchAIInsights} 
                  disabled={loadingAi}
                  className="p-1 hover:bg-purple-900/30 rounded text-purple-400"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {loadingAi ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand-accent-purple border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-purple-300 font-mono">Gemini po analizon të dhënat e DigiNet...</p>
                </div>
              ) : (
                <ul className="space-y-2 text-xs font-sans text-brand-text-primary">
                  {aiInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 bg-purple-900/10 p-2.5 rounded-lg border border-purple-900/30">
                      <span className="text-purple-400 font-mono mt-0.5">[{index + 1}]</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Date Selectors for Reports */}
            <div className="flex flex-col sm:flex-row items-end justify-between gap-4 p-4 bg-brand-card border border-brand-border rounded-2xl">
              <div>
                <label className="block text-[10px] font-mono text-brand-text-secondary uppercase mb-1">Intervali i Anunsimit</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="bg-brand-bg border border-brand-border rounded-lg text-xs font-mono px-3 py-1.5 focus:outline-none focus:border-brand-accent-blue"
                  />
                  <span className="text-brand-text-secondary text-xs">-</span>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="bg-brand-bg border border-brand-border rounded-lg text-xs font-mono px-3 py-1.5 focus:outline-none focus:border-brand-accent-blue"
                  />
                </div>
              </div>
              <p className="text-[10px] text-brand-text-secondary font-mono italic">Prezantimi grafik pasqyron periudhën e përzgjedhur për territorin e Tiranës dhe Durrësit.</p>
            </div>

            {/* Recharts Row 1 (Line & Hist Bar) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Tickets trend over time */}
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercaseTracking">Biletat e Hapura sipas Ditëve (Trendi)</h3>
                  <span className="text-[10px] bg-blue-500/15 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-500/30">Lakorja Linjore</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ticketsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a354f" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e3a5f', padding: '10px', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="Tickets" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time to Repair Histogram */}
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercaseTracking">Koha Mesatare e Zgjidhjes (Histograma MTTR)</h3>
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-semibold">Minutazhi / Orët</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resolutionHistogram} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a354f" vertical={false} />
                      <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e3a5f', padding: '10px', borderRadius: '12px' }} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Recharts Row 2 (Bar Performance & Category Pie) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* Technician performance bar comparison */}
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercaseTracking">Efektiviteti i Teknikëve (Biletat e Zgjidhura)</h3>
                  <span className="text-[10px] bg-green-500/15 text-green-400 font-mono px-2 py-0.5 rounded border border-green-500/30">Historiku</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={techChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a354f" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e3a5f', padding: '10px', borderRadius: '12px' }} />
                      <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categories Pie Breakdown */}
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercaseTracking">Defektet sipas Kategorisë</h3>
                  <span className="text-[10px] bg-purple-500/15 text-purple-400 font-mono px-2 py-0.5 rounded border border-purple-500/30">Ndarja %</span>
                </div>
                <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e3a5f', padding: '10px', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 text-xs">
                    {categoryChartData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></span>
                        <span className="text-brand-text-secondary">{item.name}:</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: OVERALL TICKETS VIEW */}
        {activeTab === 'tickets' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase">Menaxhimi i të Gjitha Biletave</h3>
            <p className="text-xs text-brand-text-secondary">Lista kombëtare e përpunimit të aseteve dhe ankesave të DigiNet.</p>
            
            <div className="border border-brand-border rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1021] text-brand-text-secondary font-mono border-b border-brand-border">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">KLIENTI</th>
                    <th className="p-3">ZONA</th>
                    <th className="p-3">KATEGORIA</th>
                    <th className="p-3">PRIORITET</th>
                    <th className="p-3">STATUSI</th>
                    <th className="p-3">TEKNIKU</th>
                    <th className="p-3">HAPUR SË FUNDMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-brand-card-hover/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-accent-blue">{ticket.id}</td>
                      <td className="p-3 font-semibold text-white">{ticket.clientName}</td>
                      <td className="p-3 text-brand-text-secondary">{ticket.clientZone}</td>
                      <td className="p-3 font-mono text-[11px] text-indigo-400 capitalize">{ticket.category.replace('_', ' ')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ticket.priority === 'P1' ? 'priority-p1' : 
                          ticket.priority === 'P2' ? 'priority-p2' :
                          ticket.priority === 'P3' ? 'priority-p3' : 'priority-p4'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono capitalize border ${
                          ticket.status === 'open' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' :
                          ticket.status === 'assigned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          ticket.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          ticket.status === 'pending_parts' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                          'bg-black/40 text-gray-500 border-gray-800'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-brand-text-secondary font-medium">{ticket.assignedTechName || 'I paatribuar'}</td>
                      <td className="p-3 text-brand-text-secondary font-mono">{new Date(ticket.createdAt).toLocaleTimeString('sq', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-brand-card p-5 border border-brand-border rounded-2xl">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">Menaxhimi i Stafit dhe Përdoruesve</h3>
                <p className="text-xs text-brand-text-secondary mt-1">Shto teknikë, operatorë apo inxhinierë dhe kontrollo aktivitetin e tyre në terren.</p>
              </div>
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-brand-accent-blue hover:opacity-95 text-white rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                SHTO PËRDORUES TË RI
              </button>
            </div>

            {/* Users list table */}
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden p-5">
              <div className="mb-4">
                <input 
                  type="text" 
                  placeholder="Kërko staf sipas emrit, rolit ose email-it..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full max-w-md bg-brand-bg border border-brand-border rounded-xl text-xs px-4 py-2 text-white focus:outline-none focus:border-brand-accent-blue"
                />
              </div>

              <div className="border border-brand-border rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1021] text-brand-text-secondary font-mono border-b border-brand-border">
                    <tr>
                      <th className="p-3">EMRI DHE MBIEMRI</th>
                      <th className="p-3">USERNAME</th>
                      <th className="p-3">ROLI</th>
                      <th className="p-3">EMAIL</th>
                      <th className="p-3">TELEFONI</th>
                      <th className="p-3">ZONA E ATRIBUAR</th>
                      <th className="p-3">STATUSI</th>
                      <th className="p-3 text-right">AKSIONET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/60">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-brand-card-hover/20 transition-colors">
                        <td className="p-3 font-semibold text-white">{u.fullName}</td>
                        <td className="p-3 font-mono text-brand-text-secondary">@{u.username}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-brand-card border ${
                            u.role === 'admin' ? 'text-red-400 border-red-500/20' :
                            u.role === 'operator' ? 'text-amber-400 border-amber-500/20' :
                            u.role === 'engineer' ? 'text-blue-400 border-blue-500/20' :
                            'text-green-400 border-green-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-brand-text-secondary">{u.email}</td>
                        <td className="p-3 text-brand-text-secondary font-mono">{u.phone}</td>
                        <td className="p-3 text-brand-text-secondary">{u.zone || 'E pacaktuar'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.status === 'active' || u.status === 'online' ? 'text-emerald-400' : 'text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' || u.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                            {u.status === 'active' || u.status === 'online' ? 'Aktiv' : 'Jo Aktiv'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => toggleUserStatus(u.id)}
                            className={`p-1.5 rounded-lg border text-[11px] font-mono transition-colors ${
                              u.status === 'active' ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.status === 'active' ? 'Deaktivizo' : 'Reaktivizo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TERRITORY AND DISTRICT MANAGER */}
        {activeTab === 'territories' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase">Sektorizimi & Zona e Mbulimit</h3>
              <p className="text-xs text-brand-text-secondary">DigiNet ndahet në 5 zona kryesore në Tiranë dhe 2 zona të mëdha në Plazhin dhe Qendrën e Durrësit për të rritur efikasitetin MTTR (Mean Time to Repair).</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Zone 1 (Kavaja/Shyri)', techs: 'Andi Koxha', coverage: 'Rruga e Kavajës, Myslym Shyri, 21 Dhjetori', tickets: 2 },
                  { name: 'Zone 2 (Bardhyl/Xhanfize)', techs: 'Besnik Lata', coverage: 'Rruga Bardhyl, Siri Kodra, Xhanfize Keko', tickets: 1 },
                  { name: 'Zone 3 (Don Bosko)', techs: 'Çlirim Rama, Hekuran Pepa', coverage: 'Lagjia Don Bosko, Rruga Mine Peza', tickets: 3 },
                  { name: 'Zone 4 (Elbasani)', techs: 'Erjon Gashi', coverage: 'Rruga e Elbasanit, Qyteti Studenti', tickets: 1 },
                  { name: 'Zone 5 (Kombinat)', techs: 'Fatos Mema', coverage: 'Kombinat, Llazi Miho, ish-Muzika', tickets: 1 },
                  { name: 'Durrës 1 (Plazh)', techs: 'Dritan Dervishi', coverage: 'Plazh kryesor, Lagjia 13', tickets: 2 },
                  { name: 'Durrës 2 (Qendër)', techs: 'Genti Bardhi', coverage: 'Currilat, Vollga, Lagjia 4', tickets: 0 }
                ].map(z => (
                  <div key={z.name} className="p-4 bg-[#0d1324] border border-brand-border rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-mono font-bold text-white">{z.name}</h4>
                      <span className="text-[10px] bg-brand-accent-blue/10 text-brand-accent-blue font-mono px-2 py-0.5 rounded border border-brand-accent-blue/25">{z.tickets} biletë aktuale</span>
                    </div>
                    <p className="text-[11px] text-brand-text-secondary"><strong className="text-white">Teknikët:</strong> {z.techs}</p>
                    <p className="text-[10px] text-brand-text-muted font-sans italic">{z.coverage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase">Atribuo Teknikët në Zona</h3>
              <p className="text-xs text-brand-text-secondary">Zgjidh teknikun dhe ndrysho zonën kryesore që mbulon në kohë reale.</p>
              
              <div className="space-y-3">
                {technicians.map(t => (
                  <div key={t.id} className="p-3 bg-[#0d1324] border border-brand-border/60 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{t.name}</p>
                      <p className="text-[10px] text-brand-text-secondary font-mono mt-0.5">{t.zone}</p>
                    </div>
                    <select 
                      value={t.zone}
                      onChange={(e) => {
                        const targetZone = e.target.value;
                        setTechnicians(technicians.map(tech => tech.id === t.id ? { ...tech, zone: targetZone } : tech));
                        // update user mapping
                        setUsers(users.map(u => u.fullName === t.name ? { ...u, zone: targetZone } : u));
                      }}
                      className="bg-brand-bg border border-brand-border/80 rounded px-2.5 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent-blue"
                    >
                      <option value="Zone 1 (Kavaja/Shyri)">Zone 1</option>
                      <option value="Zone 2 (Bardhyl/Xhanfize)">Zone 2</option>
                      <option value="Zone 3 (Don Bosko)">Zone 3</option>
                      <option value="Zone 4 (Elbasani)">Zone 4</option>
                      <option value="Zone 5 (Kombinat)">Zone 5</option>
                      <option value="Durrës 1 (Plazh)">Durrës 1</option>
                      <option value="Durrës 2 (Qendër)">Durrës 2</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SLA CONFIG */}
        {activeTab === 'sla' && (
          <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-6">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase">Konfigurimi i SLA-së për Incidente</h3>
              <p className="text-xs text-brand-text-secondary mt-1">Cakto afatin kohor maksimal të zgjidhjes për secilin prioritet sipas kategorive tona të kontraktuara.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {editedSla.map((sla, index) => (
                <div key={sla.id} className="p-4 bg-[#0d1324] border border-brand-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                      sla.priority === 'P1' ? 'priority-p1' : 
                      sla.priority === 'P2' ? 'priority-p2' :
                      sla.priority === 'P3' ? 'priority-p3' : 'priority-p4'
                    }`}>
                      {sla.priority}
                    </span>
                    <span className="text-[10px] text-brand-text-secondary font-mono">Targeti aktual</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-brand-text-secondary uppercase mb-1">Maksimumi (Orë)</label>
                    <input 
                      type="number"
                      value={sla.responseTimeHours}
                      onChange={(e) => {
                        const nextVal = parseInt(e.target.value) || 1;
                        setEditedSla(editedSla.map((s, idx) => idx === index ? { ...s, responseTimeHours: nextVal } : s));
                      }}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs font-mono px-3 py-1.5 focus:outline-none focus:border-brand-accent-blue"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border/60">
              <button 
                onClick={() => setEditedSla(slaTargets)}
                className="text-xs font-mono font-semibold px-4 py-2 border border-brand-border rounded-xl text-brand-text-secondary hover:text-white hover:bg-brand-card-hover transition-colors"
              >
                Anulo Ndryshimet
              </button>
              <button 
                onClick={handleSaveSLA}
                className="text-xs font-mono font-bold px-5 py-2 bg-brand-accent-blue text-white rounded-xl hover:opacity-95 transition-colors"
              >
                Ruaj Konfigurimet
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: BROADCAST ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase">Historiku i Komunikimeve</h3>
                  <p className="text-xs text-brand-text-secondary mt-0.5">Mesazhet e transmetuara që zëvendësojnë WhatsApp.</p>
                </div>
                <button 
                  onClick={() => setShowAddAnnModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-brand-accent-blue text-white rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Krijoni Njoftim
                </button>
              </div>

              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className={`p-4 bg-brand-card border rounded-2xl ${ann.priority === 'high' ? 'border-red-500/35 shadow-lg shadow-red-500/5' : 'border-brand-border'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                        {ann.priority === 'high' && <AlertTriangle className="w-3.5 h-3.5 text-brand-accent-red animate-pulse" />}
                        {ann.title}
                      </h4>
                      <span className="text-[10px] text-brand-text-secondary font-mono">{ann.createdAt.split('T')[0]}</span>
                    </div>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">{ann.message}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-border/30 text-[10px] font-mono">
                      <span className="text-brand-text-secondary">Nga: <strong className="text-white">{ann.author}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-[#0d1324] text-amber-500 uppercase border border-brand-border/40">Targeti: {ann.targetRole}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4 h-fit">
              <h3 className="text-sm font-mono font-bold text-white uppercase">Informacion dërgimi</h3>
              <p className="text-xs text-brand-text-secondary">Udhëzime ose njoftime të shpejta që lidhen me asetet shfaqen direkt në portalin e personave të caktuar sipas rolit të tyre (operator, teknik, inxhinier).</p>
              
              <div className="p-3 bg-[#0d1324] border border-green-500/20 rounded-xl">
                <p className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  WhatsApp Zero-Waste Policy
                </p>
                <p className="text-[11px] text-brand-text-secondary leading-snug">Çdo mesazh i regjistruar këtu lë gjurmë të cilat mund ti shërbejnë auditimeve të mëvonshme p.sh mbi SLA ose ankesat.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI WORKPLACE */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Gemini Multi-Agent Operations Analyzer
              </h2>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Platforma jonë përdor modelin me inteligjencë artificiale më të fundit <strong className="font-mono text-indigo-300">gemini-3.5-flash</strong> për të ekzekutuar analizat, detajuar shkeljet e marrëveshjeve të shërbimit (SLA) në Shqipëri, parashikuar thyerjet e fibrave për shkak të ngritjes së temperaturave ose vlerave optike të dobëta dhe optimizuar alokimin e aseteve e burimeve.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-purple-950/15 border border-purple-500/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">Parashikimi i Ndërprerjeve</h4>
                  <p className="text-[11px] text-brand-text-secondary leading-relaxed">AI zbulon nëse ka biletë të përsëritura në të njëjtin OLT ose kabllo splitter të katit mbasdite dhe dërgon alarme te grupet përkatëse.</p>
                </div>
                <div className="p-4 bg-indigo-950/15 border border-indigo-500/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase text-brand-accent-blue">Optimizimi i Shpërndarjes</h4>
                  <p className="text-[11px] text-brand-text-secondary leading-relaxed">Duke marrë parasysh distancat e zonave, ngarkesën e teknikëve dhe aftësitë e tyre, ai sugjeron teknikët optimal për çdo rast.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-start">
                <button 
                  onClick={() => fetchAIInsights()}
                  disabled={loadingAi}
                  className="flex items-center gap-2 text-xs font-bold font-sans px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingAi ? 'GEMINI DUKE PUNUAR...' : 'XHENERO RAPORTIN ME GEMINI SOT'}
                </button>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">Përmbledhja Ekzekutive e AI (në Gjuhën Shqipe)</h3>
              <div className="prose prose-invert max-w-none text-xs font-sans text-brand-text-secondary leading-relaxed space-y-2">
                {aiInsights.length ? (
                  <div className="p-4 bg-[#0d1324] border border-brand-border rounded-xl">
                    <p className="font-semibold text-white mb-2">Raportimi i nxjerrë nga skanimi i fundit:</p>
                    <ul className="list-disc pl-4 space-y-2">
                      {aiInsights.map((ins, i) => <li key={i}>{ins}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p>Klikoni mbi butonin më lart për të mbledhur të dhënat dhe gjeneruar përmbledhjen ekzekutive.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setShowAddUserModal(false)} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-mono font-bold text-white uppercase mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-accent-blue" />
              Shto Anëtar Stafi
            </h3>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Emri dhe Mbiemri</label>
                <input 
                  type="text" 
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  placeholder="p.sh. Besim Shehu"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Username</label>
                  <input 
                    type="text" 
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="besim.shehu"
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Roli</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  >
                    <option value="technician">Technician</option>
                    <option value="operator">Operator</option>
                    <option value="engineer">Engineer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="besim@diginet.al"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Celulari</label>
                  <input 
                    type="text" 
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+355 69..."
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Zona mbulimit</label>
                  <select 
                    value={newUser.zone}
                    onChange={(e) => setNewUser({...newUser, zone: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                  >
                    <option value="">Cakto zonë</option>
                    <option value="Zone 1 (Kavaja/Shyri)">Zone 1</option>
                    <option value="Zone 2 (Bardhyl/Xhanfize)">Zone 2</option>
                    <option value="Zone 3 (Don Bosko)">Zone 3</option>
                    <option value="Zone 4 (Elbasani)">Zone 4</option>
                    <option value="Zone 5 (Kombinat)">Zone 5</option>
                    <option value="Durrës 1 (Plazh)">Durrës 1</option>
                    <option value="Durrës 2 (Qendër)">Durrës 2</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-brand-accent-blue text-white rounded-lg font-semibold hover:opacity-95 transition-opacity"
              >
                Krijo Përdorues
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setShowAddAnnModal(false)} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-mono font-bold text-white uppercase mb-4">
              Krijo Njoftim të Ri (Broadcast)
            </h3>

            <form onSubmit={handleAddAnnouncement} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Titulli i Lajmit</label>
                <input 
                  type="text" 
                  required
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({...newAnn, title: e.target.value})}
                  placeholder="p.sh. Mirëmbajtje urgjente në..."
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Targeti i Rolit</label>
                  <select 
                    value={newAnn.targetRole}
                    onChange={(e) => setNewAnn({...newAnn, targetRole: e.target.value as any})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  >
                    <option value="all">Të Gjithë (ALL)</option>
                    <option value="operator">Vetëm Operatorët</option>
                    <option value="technician">Vetëm Teknikët</option>
                    <option value="engineer">Vetëm Inxhinierët</option>
                  </select>
                </div>
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Rëndësia</label>
                  <select 
                    value={newAnn.priority}
                    onChange={(e) => setNewAnn({...newAnn, priority: e.target.value as any})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  >
                    <option value="normal">Normale</option>
                    <option value="high">Kritike / Urgjet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Mesazhi i plotë i Njoftimit</label>
                <textarea 
                  rows={4}
                  required
                  value={newAnn.message}
                  onChange={(e) => setNewAnn({...newAnn, message: e.target.value})}
                  placeholder="Detajet e njoftimit..."
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-brand-accent-blue text-white rounded-lg font-semibold hover:opacity-95 transition-all"
              >
                Transmeto Njoftimin
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
