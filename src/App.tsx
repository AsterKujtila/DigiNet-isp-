import React, { useState, useEffect, useRef } from 'react';
import { 
  INITIAL_CLIENTS, INITIAL_TECHNICIANS, INITIAL_TICKETS, 
  INITIAL_INFRASTRUCTURE, INITIAL_INVENTORY, INITIAL_KNOWLEDGE, INITIAL_ANNOUNCEMENTS, 
  INITIAL_PARTS_REQUESTS, INITIAL_SLA, INITIAL_MESSAGES, INITIAL_USERS
} from './data';
import { 
  User, Client, TechnicianAvailability, Ticket, InfrastructureIssue, 
  InventoryItem, KnowledgeArticle, Announcement, PartsRequest, SLATarget, ChatMessage, UserRole 
} from './types';
import { AdminPanel } from './components/AdminPanel';
import { OperatorPanel } from './components/OperatorPanel';
import { TechnicianPanel } from './components/TechnicianPanel';
import { EngineerPanel } from './components/EngineerPanel';
import { AuthScreen } from './components/AuthScreen';
import { ToastContainer, TicketInspector, ToastMessage, playNotificationChime } from './components/ToastContainer';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SupabaseService } from './supabaseService';
import { Wrench, UserCheck, ShieldCheck, HeartPulse, LogOut, Database, WifiOff, AlertTriangle, RefreshCw, Wifi } from 'lucide-react';

export default function App() {
  // Authentication & Demo Mode states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('operator');
  const [demoMode, setDemoMode] = useState(true);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Supabase dynamic connection monitoring states
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isRetryingConnection, setIsRetryingConnection] = useState<boolean>(false);

  const handleRetryConnectionCheck = async () => {
    setIsRetryingConnection(true);
    try {
      if (navigator.onLine) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('announcements').select('id').limit(1);
          if (!error) {
            setIsSupabaseConnected(true);
            setIsOnline(true);
          } else {
            console.warn('Manual retry connection failed:', error);
            setIsSupabaseConnected(false);
          }
        } else {
          setIsSupabaseConnected(true);
          setIsOnline(true);
        }
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      console.warn('Manual retry connection checker error:', e);
      setIsSupabaseConnected(false);
    } finally {
      setTimeout(() => {
        setIsRetryingConnection(false);
      }, 700);
    }
  };

  // Core synchronized application states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianAvailability[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureIssue[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeArticle[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SLATarget[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Real-time high-priority alerts with sound chimes
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [toastMuted, setToastMuted] = useState(false);
  const [inspectedTicketId, setInspectedTicketId] = useState<string | null>(null);

  const prevTicketsRef = useRef<Ticket[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'timestamp'>) => {
    const newToast: ToastMessage = {
      ...toast,
      timestamp: new Date()
    };
    setToasts(prev => [newToast, ...prev].slice(0, 8)); // limit concurrent active toasts
    if (!toastMuted) {
      playNotificationChime(toast.type);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const isTargetRole = ['operator', 'technician', 'admin', 'engineer'].includes(currentUser.role);
    if (!isTargetRole) return;

    if (prevTicketsRef.current.length === 0) {
      prevTicketsRef.current = tickets;
      return;
    }

    const prevTicketsSet = new Map<string, Ticket>(prevTicketsRef.current.map(t => [t.id, t]));

    tickets.forEach(ticket => {
      const prevTicket = prevTicketsSet.get(ticket.id);

      if (!prevTicket) {
        addToast({
          id: `toast-${Date.now()}-${ticket.id}`,
          title: `Bilet e re e krijuar!`,
          description: `Klienti: ${ticket.clientName} (Adresa: ${ticket.clientAddress}).`,
          type: ticket.priority === 'P1' ? 'P1' : 'P2',
          ticketId: ticket.id
        });
      } else if (
        (ticket.priority === 'P1' || ticket.priority === 'P2') && (
          prevTicket.status !== ticket.status || 
          prevTicket.assignedTechId !== ticket.assignedTechId ||
          prevTicket.updatedAt !== ticket.updatedAt ||
          prevTicket.priority !== ticket.priority
        )
      ) {
        addToast({
          id: `toast-${Date.now()}-${ticket.id}`,
          title: `Bilet ${ticket.priority} u Përditësua!`,
          description: `Bileta për ${ticket.clientName} u përditësua. Statusi i ri: ${ticket.status.toUpperCase()}`,
          type: ticket.priority,
          ticketId: ticket.id
        });
      }
    });

    prevTicketsRef.current = tickets;
  }, [tickets, currentUser, toastMuted]);

  // 1. Auth Sync (Supabase listeners or Guest localStorage)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('diginet_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser) as User;
        setCurrentUser(u);
        setCurrentRole(u.role);
      }
    } catch (e) {
      console.warn("Nuk mund të lexohej seanca e përdoruesit lokal:", e);
    }

    if (isSupabaseConfigured && supabase) {
      // Load current user session initially
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const m = user.user_metadata || {};
          const loggedInUser: User = {
            id: user.id,
            username: user.email?.split('@')[0] || 'custom_user',
            fullName: m.fullName || m.full_name || 'Supabase User',
            role: (m.role as UserRole) || 'operator',
            email: user.email || '',
            phone: m.phone || '',
            zone: m.zone || '',
            status: 'online'
          };
          setCurrentUser(loggedInUser);
          setCurrentRole(loggedInUser.role);
          localStorage.setItem('diginet_current_user', JSON.stringify(loggedInUser));
        }
      });

      // Subscribe to authentication changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const m = session.user.user_metadata || {};
          const loggedInUser: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'custom_user',
            fullName: m.fullName || m.full_name || 'Supabase User',
            role: (m.role as UserRole) || 'operator',
            email: session.user.email || '',
            phone: m.phone || '',
            zone: m.zone || '',
            status: 'online'
          };
          setCurrentUser(loggedInUser);
          setCurrentRole(loggedInUser.role);
          localStorage.setItem('diginet_current_user', JSON.stringify(loggedInUser));
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem('diginet_current_user');
        }
      });

      // Real-time synchronization for tickets
      const ticketsChannel = supabase
        .channel('tickets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          async () => {
            const updatedTickets = await SupabaseService.getTickets(tickets);
            setTickets(updatedTickets);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        supabase.removeChannel(ticketsChannel);
      };
    }
  }, []);

  // Monitor internet connection health dynamically
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleRetryConnectionCheck();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on browser online state
    setIsOnline(navigator.onLine);

    // Periodic connection health check on Supabase if configured
    const checkConnection = async () => {
      if (!isSupabaseConfigured || !supabase || !navigator.onLine) return;
      try {
        const { error } = await supabase.from('announcements').select('id').limit(1);
        if (error) {
          console.warn('Supabase ping check failed:', error);
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.warn('Supabase ping check network error:', err);
      }
    };

    // Check periodically every 15 seconds
    const intervalId = setInterval(checkConnection, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  // 2. Load Core Application Datasets (Local, Express Server DB, or Supabase)
  useEffect(() => {
    const loadAllDatabaseSync = async () => {
      let finalTickets = INITIAL_TICKETS;
      let finalClients = INITIAL_CLIENTS;
      let finalTechs = INITIAL_TECHNICIANS;
      let finalAnnouncements = INITIAL_ANNOUNCEMENTS;

      // Keep local store fallback declarations ready
      const storedTickets = localStorage.getItem('diginet_tickets');
      const storedClients = localStorage.getItem('diginet_clients');
      const storedTechs = localStorage.getItem('diginet_technicians');
      const storedAnnounce = localStorage.getItem('diginet_announcements');
      const storedInfra = localStorage.getItem('diginet_infrastructure');
      const storedInv = localStorage.getItem('diginet_inventory');
      const storedKb = localStorage.getItem('diginet_knowledge');
      const storedParts = localStorage.getItem('diginet_parts_requests');
      const storedSla = localStorage.getItem('diginet_sla');
      const storedChats = localStorage.getItem('diginet_chats');
      const storedUsers = localStorage.getItem('diginet_users');

      try {
        // Try to fetch all synchronized datasets from the Express server first
        const response = await fetch('/api/db/all');
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.db) {
            const db = resJson.db;

            // Load primary tables from server database or fall back to local storage / defaults
            if (db.tickets && db.tickets.length > 0) {
              finalTickets = db.tickets;
            } else if (storedTickets) {
              finalTickets = JSON.parse(storedTickets);
            }

            if (db.clients && db.clients.length > 0) {
              finalClients = db.clients;
            } else if (storedClients) {
              finalClients = JSON.parse(storedClients);
            }

            if (db.technicians && db.technicians.length > 0) {
              finalTechs = db.technicians;
            } else if (storedTechs) {
              finalTechs = JSON.parse(storedTechs);
            }

            if (db.announcements && db.announcements.length > 0) {
              finalAnnouncements = db.announcements;
            } else if (storedAnnounce) {
              finalAnnouncements = JSON.parse(storedAnnounce);
            }

            // Load secondary tables
            setInfrastructure(db.infrastructure && db.infrastructure.length > 0 ? db.infrastructure : (storedInfra ? JSON.parse(storedInfra) : INITIAL_INFRASTRUCTURE));
            setInventory(db.inventory && db.inventory.length > 0 ? db.inventory : (storedInv ? JSON.parse(storedInv) : INITIAL_INVENTORY));
            setKnowledgeBase(db.knowledge && db.knowledge.length > 0 ? db.knowledge : (storedKb ? JSON.parse(storedKb) : INITIAL_KNOWLEDGE));
            setPartsRequests(db.parts && db.parts.length > 0 ? db.parts : (storedParts ? JSON.parse(storedParts) : INITIAL_PARTS_REQUESTS));
            setSlaConfigs(db.sla && db.sla.length > 0 ? db.sla : (storedSla ? JSON.parse(storedSla) : INITIAL_SLA));
            setMessages(db.chats && db.chats.length > 0 ? db.chats : (storedChats ? JSON.parse(storedChats) : INITIAL_MESSAGES));
            setUsers(db.users && db.users.length > 0 ? db.users : (storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS));
          } else {
            throw new Error('Server returned false success or empty database store');
          }
        } else {
          throw new Error(`Server returned HTTP ${response.status}`);
        }
      } catch (err) {
        console.warn("Express database offline, falling back to local storage:", err);
        // Fallback to local storage or defaults for primary tables
        finalTickets = storedTickets ? JSON.parse(storedTickets) : INITIAL_TICKETS;
        finalClients = storedClients ? JSON.parse(storedClients) : INITIAL_CLIENTS;
        finalTechs = storedTechs ? JSON.parse(storedTechs) : INITIAL_TECHNICIANS;
        finalAnnouncements = storedAnnounce ? JSON.parse(storedAnnounce) : INITIAL_ANNOUNCEMENTS;

        // Fallback for secondary tables
        setInfrastructure(storedInfra ? JSON.parse(storedInfra) : INITIAL_INFRASTRUCTURE);
        setInventory(storedInv ? JSON.parse(storedInv) : INITIAL_INVENTORY);
        setKnowledgeBase(storedKb ? JSON.parse(storedKb) : INITIAL_KNOWLEDGE);
        setPartsRequests(storedParts ? JSON.parse(storedParts) : INITIAL_PARTS_REQUESTS);
        setSlaConfigs(storedSla ? JSON.parse(storedSla) : INITIAL_SLA);
        setMessages(storedChats ? JSON.parse(storedChats) : INITIAL_MESSAGES);
        setUsers(storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS);
      }

      // If Supabase is active, enrich/overwrite primary tables with Supabase cloud data
      try {
        if (isSupabaseConfigured) {
          finalTickets = await SupabaseService.getTickets(finalTickets);
          finalClients = await SupabaseService.getClients(finalClients);
          finalTechs = await SupabaseService.getTechnicians(finalTechs);
          finalAnnouncements = await SupabaseService.getAnnouncements(finalAnnouncements);
        }
      } catch (supabaseError) {
        console.warn("Supabase enrichment problem:", supabaseError);
      }

      // Proactive duplicate ID key repair to fix React duplicate warning notifications
      try {
        const seenClientIds = new Set<string>();
        const healedClients = finalClients.map((client, index) => {
          let clientId = client.id;
          if (!clientId || seenClientIds.has(clientId)) {
            clientId = `CL-HEAL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}-${index}`;
          }
          seenClientIds.add(clientId);
          return { ...client, id: clientId };
        });
        finalClients = healedClients;
      } catch (e) {
        console.warn("Client ID healing failed:", e);
      }

      setTickets(finalTickets);
      setClients(finalClients);
      setTechnicians(finalTechs);
      setAnnouncements(finalAnnouncements);

      // Mark load as complete to enable dynamic state updates to propagate and persist
      setIsInitialLoadComplete(true);
      setLastSyncTime(new Date());
    };

    loadAllDatabaseSync();
  }, [currentUser]);

  // 3. Synchronize state modifications locally, to Express backend DB, and Supabase (if active)
  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (tickets.length > 0) {
      localStorage.setItem('diginet_tickets', JSON.stringify(tickets));
      if (isSupabaseConfigured) {
        SupabaseService.saveAllTickets(tickets).then(success => {
          if (success) setLastSyncTime(new Date());
        });
      }
      fetch('/api/db/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: tickets })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync tickets error:', err));
    }
  }, [tickets, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (clients.length > 0) {
      localStorage.setItem('diginet_clients', JSON.stringify(clients));
      if (isSupabaseConfigured) {
        SupabaseService.saveAllClients(clients).then(success => {
          if (success) setLastSyncTime(new Date());
        });
      }
      fetch('/api/db/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: clients })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync clients error:', err));
    }
  }, [clients, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (technicians.length > 0) {
      localStorage.setItem('diginet_technicians', JSON.stringify(technicians));
      fetch('/api/db/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: technicians })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync technicians error:', err));
    }
  }, [technicians, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (infrastructure.length > 0) {
      localStorage.setItem('diginet_infrastructure', JSON.stringify(infrastructure));
      fetch('/api/db/infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: infrastructure })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync infrastructure error:', err));
    }
  }, [infrastructure, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (inventory.length > 0) {
      localStorage.setItem('diginet_inventory', JSON.stringify(inventory));
      fetch('/api/db/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: inventory })
      }).catch(err => console.warn('Sync inventory error:', err));
    }
  }, [inventory, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (knowledgeBase.length > 0) {
      localStorage.setItem('diginet_knowledge', JSON.stringify(knowledgeBase));
      fetch('/api/db/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: knowledgeBase })
      }).catch(err => console.warn('Sync knowledge error:', err));
    }
  }, [knowledgeBase, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (announcements.length > 0) {
      localStorage.setItem('diginet_announcements', JSON.stringify(announcements));
      fetch('/api/db/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: announcements })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync announcements error:', err));
    }
  }, [announcements, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (partsRequests.length > 0) {
      localStorage.setItem('diginet_parts_requests', JSON.stringify(partsRequests));
      fetch('/api/db/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: partsRequests })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync parts error:', err));
    }
  }, [partsRequests, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (slaConfigs.length > 0) {
      localStorage.setItem('diginet_sla', JSON.stringify(slaConfigs));
      fetch('/api/db/sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: slaConfigs })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync SLA error:', err));
    }
  }, [slaConfigs, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (messages.length > 0) {
      localStorage.setItem('diginet_chats', JSON.stringify(messages));
      fetch('/api/db/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: messages })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync chats error:', err));
    }
  }, [messages, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (users.length > 0) {
      localStorage.setItem('diginet_users', JSON.stringify(users));
      fetch('/api/db/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: users })
      })
      .then(res => { if (res.ok) setLastSyncTime(new Date()); })
      .catch(err => console.warn('Sync users error:', err));
    }
  }, [users, isInitialLoadComplete]);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Data reset util
  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('diginet_current_user');
  };

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser]);

  return (
    <div className="bg-[#070b13] min-h-screen text-brand-text-primary flex flex-col font-sans selection:bg-brand-accent-blue selection:text-white">
      
      {/* Upper Navigation bar with status telemetry */}
      <header className="bg-brand-card/95 border-b border-brand-border/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent-blue to-purple-600 flex items-center justify-center font-bold tracking-tight text-white shadow-md text-sm">
                DN
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-[#0d1324] rounded-full animate-ping"></span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-[#0d1324] rounded-full"></span>
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1">
                DIGINET ISP NETWORK
              </p>
              <div className="flex items-center gap-1.5 text-[9px] text-brand-text-secondary font-mono mt-0.5">
                <HeartPulse className="w-3 h-3 text-brand-accent-blue" />
                <span>ALL SITES NORMAL</span>
                <span className="opacity-45">•</span>
                <span>REDUNDANCY ENFORCED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className={`flex items-center gap-2 bg-[#0d1324] border p-1.5 px-3 rounded-lg text-[10px] font-mono select-none ${
              isOnline 
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' 
                : 'border-red-500/30 text-red-400 bg-red-500/5'
            }`}>
              {isOnline ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold tracking-wider">ONLINE</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-bold tracking-wider text-red-400">SHKËPUTUR <span className="hidden sm:inline">(OFFLINE)</span></span>
                </>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 bg-[#0d1324] border border-brand-border/70 p-1.5 px-3 rounded-lg text-[10px] font-mono">
              <span className="text-brand-text-secondary">SYS SHIELD:</span>
              <span className="text-emerald-400 font-bold">MUT-IPTV CERTIFIED</span>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 pl-3 border-l border-brand-border/60">
                <div 
                  className="text-right hidden sm:block cursor-pointer hover:opacity-80"
                  onClick={() => setIsEditProfileModalOpen(true)}
                >
                  <p className="text-xs font-bold text-white leading-tight">{currentUser.fullName}</p>
                  <p className="text-[9px] text-brand-text-secondary font-mono tracking-wider capitalize leading-none mt-0.5">
                    {currentUser.role === 'admin' ? 'Administrator' : 
                     currentUser.role === 'operator' ? 'Operator Sistemi' : 
                     currentUser.role === 'technician' ? 'Teknik Field' : 'Inxhinier Rrjeti'}
                  </p>
                </div>
                
                <div 
                  className="w-8 h-8 rounded-full bg-brand-accent-blue/20 border border-brand-accent-blue/40 flex items-center justify-center text-xs font-bold font-mono text-brand-accent-blue shadow-md shadow-brand-accent-blue/5 cursor-pointer hover:bg-brand-accent-blue/30"
                  onClick={() => setIsEditProfileModalOpen(true)}
                >
                  {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-[#141b2d] hover:bg-red-500/10 border border-brand-border hover:border-red-500/25 text-brand-text-secondary hover:text-red-400 transition-all cursor-pointer"
                  title="Çkyçu / Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DEDICATED CONNECTION LOSS WARNING BANNER */}
      {!isOnline && (
        <div className="bg-red-500/10 border-b border-red-500/25 py-3.5 px-4 md:px-8 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <span> LIDHJA E INTERNETIT ËSHTË NDËRPRERË </span>
                  <span className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded-md font-normal animate-pulse font-sans">OFFLINE</span>
                </p>
                <p className="text-[11px] text-brand-text-secondary mt-1 leading-relaxed">
                  Lidhja me internetin është ndërprerë. Ndryshimet po ruhen lokalisht. Sapo të kthehet lidhja, aplikacioni do të tentojë të sinkronizohet automatikisht.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 self-stretch md:self-auto">
              {/* Pending changes indicator */}
              <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded">
                {tickets.length + clients.length} ndryshime në pritje
              </span>
              <button
                onClick={handleRetryConnectionCheck}
                disabled={isRetryingConnection}
                className="w-full md:w-auto bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-mono font-bold text-[10px] px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-red-500/10 cursor-pointer uppercase"
                id="btn-retry-supabase-conn"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingConnection ? 'animate-spin' : ''}`} />
                {isRetryingConnection ? 'Duke kontrolluar...' : 'Provo Përsëri'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel View Injector */}
      <main className="flex-1 pb-16">
        {!currentUser ? (
          <AuthScreen 
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              setCurrentRole(user.role);
              localStorage.setItem('diginet_current_user', JSON.stringify(user));
            }}
            users={users}
            setUsers={setUsers}
          />
        ) : (
          <>
            {currentRole === 'admin' && (
              <AdminPanel 
                tickets={tickets}
                setTickets={setTickets}
                clients={clients}
                setClients={setClients}
                technicians={technicians}
                setTechnicians={setTechnicians}
                announcements={announcements}
                setAnnouncements={setAnnouncements}
                slaTargets={slaConfigs}
                setSlaTargets={setSlaConfigs}
                infrastructure={infrastructure}
                setInfrastructure={setInfrastructure}
                users={users}
                setUsers={setUsers}
                lastSyncTime={lastSyncTime}
              />
            )}

            {currentRole === 'operator' && (
              <OperatorPanel 
                tickets={tickets}
                setTickets={setTickets}
                clients={clients}
                setClients={setClients}
                technicians={technicians}
                setTechnicians={setTechnicians}
                messages={messages}
                setMessages={setMessages}
              />
            )}

            {currentRole === 'technician' && (
              <TechnicianPanel 
                tickets={tickets}
                setTickets={setTickets}
                inventory={inventory}
                setInventory={setInventory}
                partsRequests={partsRequests}
                setPartsRequests={setPartsRequests}
                technicians={technicians}
                activeTechId={currentUser.role === 'technician' ? currentUser.id : 'tech-3'}
              />
            )}

            {currentRole === 'engineer' && (
              <EngineerPanel 
                tickets={tickets}
                setTickets={setTickets}
                infrastructure={infrastructure}
                setInfrastructure={setInfrastructure}
                inventory={inventory}
                setInventory={setInventory}
                knowledgeBase={knowledgeBase}
                setKnowledgeBase={setKnowledgeBase}
                partsRequests={partsRequests}
                setPartsRequests={setPartsRequests}
              />
            )}
          </>
        )}
      </main>

      {/* Real-time high-priority notification layers */}
      {currentUser && (
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
          onSelectTicket={(ticketId) => setInspectedTicketId(ticketId)}
          isMuted={toastMuted}
          onToggleMute={() => setToastMuted(!toastMuted)}
        />
      )}

      {/* Ticket Inspector modal display */}
      {inspectedTicketId && (
        <TicketInspector
          ticket={tickets.find(t => t.id === inspectedTicketId) || null}
          onClose={() => setInspectedTicketId(null)}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Përditëso Profilein</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={currentUser.fullName}
                onChange={(e) => setCurrentUser({...currentUser, fullName: e.target.value})}
                className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white"
                placeholder="Emri i Plotë"
              />
              <input 
                type="text" 
                value={currentUser.phone}
                onChange={(e) => setCurrentUser({...currentUser, phone: e.target.value})}
                className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white"
                placeholder="Telefoni"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  localStorage.setItem('diginet_current_user', JSON.stringify(currentUser));
                  setIsEditProfileModalOpen(false);
                }}
                className="flex-1 bg-brand-accent-green hover:opacity-95 text-brand-bg rounded-xl font-bold py-2.5"
              >
                Ruaj
              </button>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="flex-1 bg-brand-bg text-white rounded-xl py-2.5"
              >
                Anullo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
