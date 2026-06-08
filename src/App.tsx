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
import { Wrench, UserCheck, ShieldCheck, HeartPulse, LogOut, Database, WifiOff } from 'lucide-react';

export default function App() {
  // Authentication & Demo Mode states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('operator');
  const [demoMode, setDemoMode] = useState(true);

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

      if (ticket.priority === 'P1' || ticket.priority === 'P2') {
        if (!prevTicket) {
          addToast({
            id: `toast-${Date.now()}-${ticket.id}`,
            title: `Bilet i Ri ${ticket.priority} u Krijua!`,
            description: `Klienti: ${ticket.clientName} (Adresa: ${ticket.clientAddress}). Defekti: ${ticket.description.slice(0, 60)}...`,
            type: ticket.priority,
            ticketId: ticket.id
          });
        } else if (
          prevTicket.status !== ticket.status || 
          prevTicket.assignedTechId !== ticket.assignedTechId ||
          prevTicket.updatedAt !== ticket.updatedAt ||
          prevTicket.priority !== ticket.priority
        ) {
          addToast({
            id: `toast-${Date.now()}-${ticket.id}`,
            title: `Bilet ${ticket.priority} u Përditësua!`,
            description: `Bileta për ${ticket.clientName} u përditësua. Statusi i ri: ${ticket.status.toUpperCase()}`,
            type: ticket.priority,
            ticketId: ticket.id
          });
        }
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

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // 2. Load Core Application Datasets (Local or live Supabase)
  useEffect(() => {
    const loadAllDatabaseSync = async () => {
      let finalTickets = INITIAL_TICKETS;
      let finalClients = INITIAL_CLIENTS;
      let finalTechs = INITIAL_TECHNICIANS;
      let finalAnnouncements = INITIAL_ANNOUNCEMENTS;

      try {
        const storedTickets = localStorage.getItem('diginet_tickets');
        const storedClients = localStorage.getItem('diginet_clients');
        const storedTechs = localStorage.getItem('diginet_technicians');
        const storedAnnounce = localStorage.getItem('diginet_announcements');

        const localTickets = storedTickets ? JSON.parse(storedTickets) : INITIAL_TICKETS;
        const localClients = storedClients ? JSON.parse(storedClients) : INITIAL_CLIENTS;
        const localTechs = storedTechs ? JSON.parse(storedTechs) : INITIAL_TECHNICIANS;
        const localAnnounce = storedAnnounce ? JSON.parse(storedAnnounce) : INITIAL_ANNOUNCEMENTS;

        if (isSupabaseConfigured) {
          finalTickets = await SupabaseService.getTickets(localTickets);
          finalClients = await SupabaseService.getClients(localClients);
          finalTechs = await SupabaseService.getTechnicians(localTechs);
          finalAnnouncements = await SupabaseService.getAnnouncements(localAnnounce);
        } else {
          finalTickets = localTickets;
          finalClients = localClients;
          finalTechs = localTechs;
          finalAnnouncements = localAnnounce;
        }
      } catch (e) {
        console.warn("Problem loading dataset sync:", e);
      }

      setTickets(finalTickets);
      setClients(finalClients);
      setTechnicians(finalTechs);
      setAnnouncements(finalAnnouncements);
    };

    loadAllDatabaseSync();

    // Secondary table loadings
    try {
      const storedInfra = localStorage.getItem('diginet_infrastructure');
      const storedInv = localStorage.getItem('diginet_inventory');
      const storedKb = localStorage.getItem('diginet_knowledge');
      const storedParts = localStorage.getItem('diginet_parts_requests');
      const storedSla = localStorage.getItem('diginet_sla');
      const storedChats = localStorage.getItem('diginet_chats');
      const storedUsers = localStorage.getItem('diginet_users');

      setInfrastructure(storedInfra ? JSON.parse(storedInfra) : INITIAL_INFRASTRUCTURE);
      setInventory(storedInv ? JSON.parse(storedInv) : INITIAL_INVENTORY);
      setKnowledgeBase(storedKb ? JSON.parse(storedKb) : INITIAL_KNOWLEDGE);
      setPartsRequests(storedParts ? JSON.parse(storedParts) : INITIAL_PARTS_REQUESTS);
      setSlaConfigs(storedSla ? JSON.parse(storedSla) : INITIAL_SLA);
      setMessages(storedChats ? JSON.parse(storedChats) : INITIAL_MESSAGES);
      setUsers(storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS);
    } catch (e) {
      console.warn("Secondary tables offline error:", e);
    }
  }, [currentUser]);

  // 3. Synchronize state modifications locally & Supabase
  useEffect(() => {
    if (tickets.length > 0) {
      localStorage.setItem('diginet_tickets', JSON.stringify(tickets));
      if (isSupabaseConfigured) {
        SupabaseService.saveAllTickets(tickets);
      }
    }
  }, [tickets]);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('diginet_clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (technicians.length > 0) {
      localStorage.setItem('diginet_technicians', JSON.stringify(technicians));
    }
  }, [technicians]);

  useEffect(() => {
    if (infrastructure.length > 0) localStorage.setItem('diginet_infrastructure', JSON.stringify(infrastructure));
  }, [infrastructure]);

  useEffect(() => {
    if (inventory.length > 0) localStorage.setItem('diginet_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    if (knowledgeBase.length > 0) localStorage.setItem('diginet_knowledge', JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);

  useEffect(() => {
    if (announcements.length > 0) localStorage.setItem('diginet_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    if (partsRequests.length > 0) localStorage.setItem('diginet_parts_requests', JSON.stringify(partsRequests));
  }, [partsRequests]);

  useEffect(() => {
    if (slaConfigs.length > 0) localStorage.setItem('diginet_sla', JSON.stringify(slaConfigs));
  }, [slaConfigs]);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('diginet_chats', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('diginet_users', JSON.stringify(users));
  }, [users]);

  // Data reset util
  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

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
            {/* Supabase Connection / Local Storage Status Indicator */}
            <div className={`flex items-center gap-2 bg-[#0d1324] border p-1.5 px-3 rounded-lg text-[10px] font-mono select-none ${
              isSupabaseConfigured 
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' 
                : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
            }`}>
              {isSupabaseConfigured ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold tracking-wider">ONLINE <span className="hidden sm:inline">(SUPABASE)</span></span>
                </>
              ) : (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold tracking-wider">OFFLINE <span className="hidden sm:inline">(LOCAL)</span></span>
                </>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 bg-[#0d1324] border border-brand-border/70 p-1.5 px-3 rounded-lg text-[10px] font-mono">
              <span className="text-brand-text-secondary">SYS SHIELD:</span>
              <span className="text-emerald-400 font-bold">MUT-IPTV CERTIFIED</span>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 pl-3 border-l border-brand-border/60">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight">{currentUser.fullName}</p>
                  <p className="text-[9px] text-brand-text-secondary font-mono tracking-wider capitalize leading-none mt-0.5">
                    {currentUser.role === 'admin' ? 'Administrator' : 
                     currentUser.role === 'operator' ? 'Operator Sistemi' : 
                     currentUser.role === 'technician' ? 'Teknik Field' : 'Inxhinier Rrjeti'}
                  </p>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-brand-accent-blue/20 border border-brand-accent-blue/40 flex items-center justify-center text-xs font-bold font-mono text-brand-accent-blue shadow-md shadow-brand-accent-blue/5">
                  {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <button
                  onClick={async () => {
                    if (isSupabaseConfigured && supabase) {
                      await supabase.auth.signOut();
                    }
                    setCurrentUser(null);
                    localStorage.removeItem('diginet_current_user');
                  }}
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

    </div>
  );
}
