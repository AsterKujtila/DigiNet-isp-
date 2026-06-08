import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, Client, TechnicianAvailability, ChatMessage, User, ServiceType, ProblemCategory, TicketPriority, TicketStatus 
} from '../types';
import { 
  Headphones, Plus, Search, MapPin, Grid, Users, Trash2, Edit3, 
  ArrowRight, ShieldAlert, Sparkles, MessageSquare, PhoneCall, RefreshCw, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';

interface OperatorPanelProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  technicians: TechnicianAvailability[];
  setTechnicians: React.Dispatch<React.SetStateAction<TechnicianAvailability[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const OperatorPanel: React.FC<OperatorPanelProps> = ({
  tickets,
  setTickets,
  clients,
  setClients,
  technicians,
  setTechnicians,
  messages,
  setMessages
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'dispatch' | 'clients' | 'techs'>('dispatch');
  
  // Search and Input Ref declarations for Shortcuts
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const clientSearchInputRef = useRef<HTMLInputElement | null>(null);
  const createSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Search states
  const [searchPhrase, setSearchPhrase] = useState('');
  const [clientSearchPhrase, setClientSearchPhrase] = useState('');

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus active search bar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (activeTab === 'dispatch') {
          searchInputRef.current?.focus();
        } else if (activeTab === 'clients') {
          clientSearchInputRef.current?.focus();
        } else if (activeTab === 'create') {
          createSearchInputRef.current?.focus();
        } else {
          setActiveTab('dispatch');
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 50);
        }
      }

      // Ctrl+N or Cmd+N: Switch to Create new ticket & focus client search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveTab('create');
        setTimeout(() => {
          createSearchInputRef.current?.focus();
        }, 50);
      }

      // Alt + 1/2/3/4: Quick switch between tabs
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('dispatch');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('create');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('clients');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('techs');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);


  // New ticket state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ticketForm, setTicketForm] = useState({
    serviceType: 'fiber' as ServiceType,
    category: 'no_internet' as ProblemCategory,
    priority: 'P3' as TicketPriority,
    description: '',
    scheduledTime: '10:00 - 12:00',
    selectedTechId: ''
  });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Active chat state for Ticket
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Client callback scheduler log
  const [callbackLog, setCallbackLog] = useState<{ clientId: string; outcome: string; nextTime: string } | null>(null);
  const [showCallbackModal, setShowCallbackModal] = useState(false);

  // Smart Assignment suggested technicians
  const [suggestedTech, setSuggestedTech] = useState<string>('');

  // AI Categorization function
  const triggerAICategorization = async () => {
    if (!ticketForm.description) {
      alert('Ju lutem shkruani përshkrimin e problemit për analiza nga Inteligjenca Artificiale.');
      return;
    }
    setAiAnalyzing(true);
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ticketForm.description })
      });
      const data = await response.json();
      
      if (data) {
        setTicketForm(prev => ({
          ...prev,
          category: (data.category || prev.category) as ProblemCategory,
          priority: (data.priority || prev.priority) as TicketPriority
        }));
        
        // Find technician recommendations
        const recommendedSkill = data.techSkills || '';
        let matchedTech = '';
        if (recommendedSkill.toLowerCase().includes('fiber') || recommendedSkill.toLowerCase().includes('saldim')) {
          matchedTech = 'Çlirim Rama (Certifikuar për Fiber Splice)';
        } else if (recommendedSkill.toLowerCase().includes('mikrotik') || recommendedSkill.toLowerCase().includes('routeros')) {
          matchedTech = 'Hekuran Pepa (Router Specialist)';
        } else {
          matchedTech = 'Andi Koxha (Vlerat më të shpejta të dritës)';
        }
        setSuggestedTech(`AI rekomandon: ${matchedTech}. Arsyeja: ${data.explanation || ''}`);
      }
    } catch (error) {
      console.error('Gabim gjatë kategorizimit nga AI:', error);
      // fallback
      setSuggestedTech('AI sugjeroi kategorinë No Internet / P1. Skuadra nuk mund të kontaktohej.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Submit Ticket creation
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Zgjidhni një klient nga lista ose databaza para se të plotësoni biletën!');
      return;
    }

    const assignedTech = technicians.find(t => t.id === ticketForm.selectedTechId);

    const newTicket: Ticket = {
      id: `TK-${Date.now().toString().slice(-4)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      clientAddress: selectedClient.address,
      clientZone: selectedClient.zone,
      serviceType: ticketForm.serviceType,
      category: ticketForm.category,
      priority: ticketForm.priority,
      status: ticketForm.selectedTechId ? 'assigned' : 'open',
      assignedTechId: ticketForm.selectedTechId || undefined,
      assignedTechName: assignedTech ? assignedTech.name : undefined,
      createdBy: 'Anila Spahiu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledTime: ticketForm.scheduledTime,
      slaDeadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), // 8 hours default response target
      slaBreach: false,
      description: ticketForm.description,
      history: [
        { timestamp: new Date().toISOString(), user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' }
      ]
    };

    // If technician assigned, log history and update technician status
    if (assignedTech) {
      newTicket.history.push({
        timestamp: new Date().toISOString(),
        user: 'Anila Spahiu',
        role: 'operator',
        action: `Atribuoi teknikun ${assignedTech.name}`
      });

      // Update technician status
      setTechnicians(prevTechs => prevTechs.map(t => {
        if (t.id === assignedTech.id) {
          return { ...t, status: 'on_job', currentJobId: newTicket.id };
        }
        return t;
      }));
    }

    setTickets([newTicket, ...tickets]);
    alert(`Bileta ${newTicket.id} për klientin ${newTicket.clientName} u krijua me sukses!`);
    
    // Reset Form
    setSelectedClient(null);
    setTicketForm({
      serviceType: 'fiber',
      category: 'no_internet',
      priority: 'P3',
      description: '',
      scheduledTime: '10:00 - 12:00',
      selectedTechId: ''
    });
    setSuggestedTech('');
    setActiveTab('dispatch');
  };

  // Drag-and-drop simulated or button state change
  const transitionTicketStatus = (ticketId: string, nextStatus: TicketStatus) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const historyAction = `Ndryshoi statusin e biletës në ${nextStatus.toUpperCase()}`;
        return {
          ...t,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          history: [
            ...t.history,
            { timestamp: new Date().toISOString(), user: 'Anila Spahiu', role: 'operator', action: historyAction }
          ]
        };
      }
      return t;
    }));
  };

  // Escalate to Engineering
  const handleEscalation = (ticketId: string, reason: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          escalatedTo: 'engineer',
          escalationReason: reason,
          priority: 'P1', // automatically bumps to P1 when escalated
          history: [
            ...t.history,
            { 
              timestamp: new Date().toISOString(), 
              user: 'Anila Spahiu', 
              role: 'operator', 
              action: `ESKALOI biletën te Skuadra Inxhinierike`,
              note: reason 
            }
          ]
        };
      }
      return t;
    }));
    alert(`Bileta ${ticketId} u eskalua te Inxhinierët me sukses.`);
  };

  // Keyboard shortcut or callback schedulers
  const handleSaveCallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (callbackLog) {
      alert(`Thirrja mbrapsht u logua! Klienti u kontaktua. Rezultati: "${callbackLog.outcome}". Ndjekja tjetër: ${callbackLog.nextTime}`);
      setShowCallbackModal(false);
      setCallbackLog(null);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeChatTicketId) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      ticketId: activeChatTicketId,
      senderId: 'usr-9',
      senderName: 'Anila Spahiu',
      senderRole: 'operator',
      text: chatInput,
      timestamp: new Date().toISOString()
    };
    setMessages([...messages, newMsg]);
    setChatInput('');
  };

  // Filters
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearchPhrase.toLowerCase()) ||
    c.phone.includes(clientSearchPhrase) ||
    c.address.toLowerCase().includes(clientSearchPhrase.toLowerCase())
  );

  const filteredTickets = tickets.filter(t => {
    if (!searchPhrase) return true;
    const term = searchPhrase.toLowerCase();
    return t.id.toLowerCase().includes(term) ||
           t.clientName.toLowerCase().includes(term) ||
           t.clientPhone.includes(term) ||
           t.clientAddress.toLowerCase().includes(term) ||
           (t.description && t.description.toLowerCase().includes(term)) ||
           (t.assignedTechName && t.assignedTechName.toLowerCase().includes(term));
  });

  const activeChatMessages = messages.filter(m => m.ticketId === activeChatTicketId);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary py-8 px-4 sm:px-6 md:px-8">
      
      {/* Header element */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6 mb-6">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Headphones className="w-6 h-6 text-brand-accent-amber" />
            Paneli i Operatorit & Dispeçerit
          </h1>
          <p className="text-xs text-brand-text-secondary font-mono mt-0.5">
            DigiNet Albanian Call Center Hub • Operator Anila Spahiu
          </p>
        </div>

        {/* Quick TABS */}
        <div className="flex gap-2 bg-brand-card p-1 rounded-xl border border-brand-border">
          <button 
            onClick={() => setActiveTab('dispatch')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'dispatch' ? 'bg-brand-accent-amber text-brand-bg' : 'text-brand-text-secondary hover:text-white'}`}
          >
            DISPATCH BOARD (KANBAN)
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'create' ? 'bg-brand-accent-amber text-brand-bg' : 'text-brand-text-secondary hover:text-white'}`}
          >
            KRIJO BILETË TË RE
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'clients' ? 'bg-brand-accent-amber text-brand-bg' : 'text-brand-text-secondary hover:text-white'}`}
          >
            DATABAZA E KLIENTËVE
          </button>
          <button 
            onClick={() => setActiveTab('techs')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'techs' ? 'bg-brand-accent-amber text-brand-bg' : 'text-brand-text-secondary hover:text-white'}`}
          >
            STATUSI I TEKNIKËVE
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* TAB 1: KANBAN DISPATCH BOARD */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            
            {/* Horizontal KPI bars */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {(['open', 'assigned', 'in_progress', 'pending_parts', 'resolved', 'closed'] as TicketStatus[]).map(status => {
                const count = tickets.filter(t => t.status === status).length;
                return (
                  <div key={status} className="bg-brand-card/60 p-3 rounded-xl border border-brand-border/80 text-center">
                    <p className="text-[10px] font-mono text-brand-text-secondary uppercase">{status.replace('_', ' ')}</p>
                    <p className="text-lg font-bold font-mono text-white mt-1">{count}</p>
                  </div>
                );
              })}
            </div>

            {/* Search and Shortcuts Help bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-card/40 p-4 border border-brand-border rounded-xl">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder="Kërko biletat sipas ID, Klientit, Adresës..."
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  className="w-full bg-[#0d1324] border border-brand-border rounded-xl text-xs pl-9 pr-14 py-2.5 text-white focus:outline-none focus:border-brand-accent-amber font-sans"
                />
                <Search className="w-4 h-4 text-brand-text-secondary absolute left-3 top-3" />
                <span className="absolute right-3 top-2.5 px-2 py-0.5 text-[9px] font-mono font-bold text-brand-text-muted bg-brand-bg border border-brand-border/80 rounded tracking-wider">
                  Ctrl + K
                </span>
              </div>

              {/* Shortcuts quick guide badge rail */}
              <div className="flex flex-wrap gap-2 text-[10px] text-brand-text-secondary font-mono">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1324] border border-brand-border/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent-amber animate-pulse"></span>
                  <kbd className="px-1 py-0.5 bg-brand-bg text-brand-accent-blue rounded font-bold border border-brand-border/60">Ctrl + K</kbd> Kërko biletat
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1324] border border-brand-border/50">
                  <kbd className="px-1 py-0.5 bg-brand-bg text-brand-accent-amber rounded font-bold border border-brand-border/60">Ctrl + N</kbd> Bilete e Re
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1324] border border-brand-border/50">
                  <kbd className="px-1 py-0.5 bg-brand-bg text-white rounded font-bold border border-brand-border/60">Alt + 1-4</kbd> Navigo Tabs
                </span>
              </div>
            </div>

            {/* Kanban board structure */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto min-h-[600px] pb-12">
              
              {/* Columns list */}
              {(['open', 'assigned', 'in_progress', 'pending_parts', 'resolved', 'closed'] as TicketStatus[]).map(columnStatus => (
                <div key={columnStatus} className="min-w-[200px] bg-brand-card/45 border border-brand-border/60 rounded-2xl p-3 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-brand-border/40 pb-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-white uppercase">{columnStatus.replace('_', ' ')}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-brand-bg border border-brand-border/60 text-brand-text-secondary">
                      {filteredTickets.filter(t => t.status === columnStatus).length}
                    </span>
                  </div>

                  {/* Tickets inside this Column */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                    {filteredTickets.filter(t => t.status === columnStatus).map(ticket => (
                      <div key={ticket.id} className="p-3 bg-brand-card border border-brand-border rounded-xl space-y-2 hover:border-brand-accent-amber transition-all shadow p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-mono font-bold text-brand-accent-blue">{ticket.id}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                              ticket.priority === 'P1' ? 'priority-p1' : 
                              ticket.priority === 'P2' ? 'priority-p2' :
                              ticket.priority === 'P3' ? 'priority-p3' : 'priority-p4'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-white truncate">{ticket.clientName}</h4>
                          <p className="text-[10px] text-brand-text-secondary truncate">{ticket.clientAddress}</p>
                          <p className="text-[11px] text-brand-text-primary/95 line-clamp-2 mt-1">{ticket.description}</p>
                          
                          <div className="mt-2 pt-2 border-t border-brand-border/30 text-[9px] font-mono text-brand-text-muted flex justify-between items-center">
                            <span>SLA: {ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleTimeString('sq', { hour: '2-digit', minute: '2-digit' }) : 'Asnjë'}</span>
                            <span className="text-indigo-400 capitalize">{ticket.serviceType}</span>
                          </div>

                          {ticket.assignedTechName && (
                            <p className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded mt-2 font-mono">
                              Tech: {ticket.assignedTechName}
                            </p>
                          )}

                          {ticket.escalatedTo && (
                            <p className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded mt-2 font-mono font-bold">
                              ESKALUAR TE INXHINIERI
                            </p>
                          )}
                        </div>

                        {/* Interactive transition buttons */}
                        <div className="mt-3 pt-2 border-t border-brand-border/30 flex flex-wrap gap-1">
                          
                          {columnStatus === 'open' && (
                            <select 
                              onChange={(e) => {
                                const techId = e.target.value;
                                if (techId) {
                                  const selectedTech = technicians.find(t => t.id === techId);
                                  setTickets(prev => prev.map(item => {
                                    if (item.id === ticket.id) {
                                      return {
                                        ...item,
                                        status: 'assigned',
                                        assignedTechId: techId,
                                        assignedTechName: selectedTech?.name,
                                        history: [
                                          ...item.history,
                                          { timestamp: new Date().toISOString(), user: 'Anila Spahiu', role: 'operator', action: `Atribuoi teknikun ${selectedTech?.name}` }
                                        ]
                                      };
                                    }
                                    return item;
                                  }));
                                  // update tech
                                  setTechnicians(prevTech => prevTech.map(t => t.id === techId ? { ...t, status: 'on_job', currentJobId: ticket.id } : t));
                                }
                              }}
                              className="w-full bg-brand-bg text-[9px] font-mono border border-brand-border p-1 rounded"
                            >
                              <option value="">Atribuo Teknik</option>
                              {technicians.filter(t => t.status === 'available').map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.zone.split(' ')[0]})</option>
                              ))}
                            </select>
                          )}

                          {columnStatus === 'assigned' && (
                            <button 
                              onClick={() => transitionTicketStatus(ticket.id, 'in_progress')}
                              className="text-[9px] bg-brand-accent-amber text-brand-bg px-2 py-0.5 font-mono font-bold rounded flex items-center gap-1 hover:opacity-90 w-full justify-center"
                            >
                              START <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}

                          {columnStatus === 'in_progress' && (
                            <div className="flex gap-1 w-full">
                              <button 
                                onClick={() => transitionTicketStatus(ticket.id, 'resolved')}
                                className="flex-1 text-[9px] bg-brand-accent-green text-brand-bg font-bold p-1 rounded font-mono text-center"
                              >
                                ZGJIDH
                              </button>
                              <button 
                                onClick={() => transitionTicketStatus(ticket.id, 'pending_parts')}
                                className="flex-1 text-[9px] bg-purple-600 font-bold p-1 rounded font-mono text-center text-white"
                              >
                                COPA COPO
                              </button>
                            </div>
                          )}

                          {columnStatus === 'pending_parts' && (
                            <button 
                              onClick={() => transitionTicketStatus(ticket.id, 'in_progress')}
                              className="w-full text-[9px] bg-brand-accent-blue font-bold p-1 rounded font-mono text-center text-white"
                            >
                              PARTS ARRIVED
                            </button>
                          )}

                          {columnStatus === 'resolved' && (
                            <button 
                              onClick={() => transitionTicketStatus(ticket.id, 'closed')}
                              className="w-full text-[9px] bg-black/40 border border-brand-border hover:bg-brand-card-hover font-bold p-1 rounded font-mono text-center text-brand-text-secondary"
                            >
                              MBYLL BILETËN (CLOSE)
                            </button>
                          )}

                          {/* Quick chat initiator */}
                          <button 
                            onClick={() => setActiveChatTicketId(ticket.id)}
                            className="text-[9px] text-brand-text-secondary hover:text-white p-1 rounded flex items-center justify-center gap-1 w-full bg-brand-bg border border-brand-border mt-1"
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            Diskutimi ({messages.filter(m => m.ticketId === ticket.id).length})
                          </button>

                          {/* Escalation button */}
                          {!ticket.escalatedTo && (
                            <button 
                              onClick={() => {
                                const reason = prompt('Pse dëshironi ta eskalohet këtë defekt te Inxhinieria?');
                                if (reason) handleEscalation(ticket.id, reason);
                              }}
                              className="text-[9px] text-brand-accent-red hover:text-white p-1 rounded flex items-center justify-center gap-1 w-full bg-red-500/5 border border-red-500/20 mt-1"
                            >
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Eskalo te Inxhinieri
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                    {tickets.filter(t => t.status === columnStatus).length === 0 && (
                      <div className="p-4 border border-dashed border-brand-border/40 rounded-xl text-center text-[10px] text-brand-text-muted font-mono py-12">
                        Asnjë biletë
                      </div>
                    )}
                  </div>
                </div>
              ))}

            </div>

          </div>
        )}

        {/* TAB 2: QUICK TICKET CREATION FORM */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form Side */}
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-accent-amber" />
                Hap Biletë pune dëmtimi
              </h3>

              <div className="p-3.5 bg-brand-bg/55 border border-brand-border rounded-xl">
                <p className="text-[10px] font-mono text-brand-text-secondary uppercase mb-1">Klienti i Përzgjedhur</p>
                {selectedClient ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">{selectedClient.name}</p>
                      <p className="text-[11px] text-brand-text-secondary">{selectedClient.address}</p>
                      <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{selectedClient.plan} • ONT Serial: {selectedClient.ontSerial}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedClient(null)}
                      className="text-[10px] font-mono text-brand-accent-red bg-red-500/10 px-2 py-1 rounded"
                    >
                      Ndrysho
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-brand-text-muted italic">Ju lutem përzgjidhni më parë një klient nga paneli i djathtë duke klikuar "Zgjidh klietnin".</p>
                )}
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-sans">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brand-text-secondary font-mono mb-1">Lloji i Shërbimit</label>
                    <select 
                      value={ticketForm.serviceType}
                      onChange={(e) => setTicketForm({...ticketForm, serviceType: e.target.value as ServiceType})}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white font-mono"
                    >
                      <option value="fiber">FIBER (Optikë)</option>
                      <option value="wireless">WIRELESS (Antenë)</option>
                      <option value="iptv">IPTV (Televizor)</option>
                      <option value="phone">TELEFONI (Tokësor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-brand-text-secondary font-mono mb-1">Kategoria e Defektit</label>
                    <select 
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({...ticketForm, category: e.target.value as ProblemCategory})}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white font-mono"
                    >
                      <option value="no_internet">Mungesë Interneti (Red LOS)</option>
                      <option value="slow_speed">Shpejtësi e Ulët</option>
                      <option value="intermittent">Këputje me Ndërprerje</option>
                      <option value="no_signal">Mungesë Sinjali IPTV</option>
                      <option value="equipment">Probleme me Pajisjen</option>
                      <option value="installation">Instalim i Ri</option>
                      <option value="other">Të tjera ankesa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brand-text-secondary font-mono mb-1">Prioriteti i Sugjeruar</label>
                    <select 
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value as TicketPriority})}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white font-mono"
                    >
                      <option value="P1">P1 - Kritik (Offline Total)</option>
                      <option value="P2">P2 - I lartë (Degradim i rëndë)</option>
                      <option value="P3">P3 - Mesatar (Luhatje shpejtësie)</option>
                      <option value="P4">P4 - I ulët (Instalime ose të tjera)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-brand-text-secondary font-mono mb-1">Sloti i Rezervuar i Kohës</label>
                    <input 
                      type="text" 
                      value={ticketForm.scheduledTime}
                      onChange={(e) => setTicketForm({...ticketForm, scheduledTime: e.target.value})}
                      placeholder="p.sh. 10:00 - 12:00"
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-brand-text-secondary font-mono">Përshkrimi i hollësishëm i ankesës</label>
                    <button 
                      type="button"
                      onClick={triggerAICategorization}
                      disabled={aiAnalyzing}
                      className="text-[10px] font-bold text-brand-accent-amber hover:text-white flex items-center gap-1 px-2 py-1.5 bg-brand-accent-amber/10 border border-brand-accent-amber/20 rounded"
                    >
                      <Sparkles className="w-3 h-3" />
                      {aiAnalyzing ? 'AI Duke kategorizuar...' : 'Sugjero me AI'}
                    </button>
                  </div>
                  <textarea 
                    rows={4}
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                    placeholder="Shkruani çfarë raporton klienti në telefon (p.sh. nuk kryhet dot PPPoE dialing, drita PON pulson jeshile e LOS e kuqe te routeri Huawei)..."
                    className="w-full bg-brand-bg border border-brand-border rounded-lg p-3 text-white"
                  />
                  {suggestedTech && (
                    <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl mt-2 text-[11px] text-purple-200">
                      {suggestedTech}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Atribuo Tekniku menjëherë (Opsionale)</label>
                  <select 
                    value={ticketForm.selectedTechId}
                    onChange={(e) => setTicketForm({...ticketForm, selectedTechId: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-white font-mono"
                  >
                    <option value="">Lëre të hapur (Open në Kanban)</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Punë aktuale: {t.status === 'on_job' ? 'Po' : 'Jo'} - {t.zone})</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={!selectedClient}
                  className={`w-full py-3 rounded-xl font-bold transition-all text-sm tracking-wider flex items-center justify-center gap-2 ${
                    selectedClient ? 'bg-gradient-to-r from-blue-500 to-amber-500 text-white shadow-lg' : 'bg-brand-card text-brand-text-secondary border border-brand-border cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  KRIJO DHE DISPAÇO BILETËN TE TEKNIKU
                </button>
              </form>
            </div>

            {/* Client Picker Side */}
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl flex flex-col h-[650px]">
              <div className="mb-4">
                <h3 className="text-sm font-mono font-bold text-white uppercase mb-1">Zgjidh Klientin për Biletë</h3>
                <p className="text-xs text-brand-text-secondary">Kërko klientin sipas Emrit, Telefonit ose rrugës për të hapur biletën.</p>
              </div>

              <div className="relative mb-3">
                <input 
                  type="text" 
                  ref={createSearchInputRef}
                  placeholder="Kërko klientët..."
                  value={clientSearchPhrase}
                  onChange={(e) => setClientSearchPhrase(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl text-xs pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-brand-accent-amber"
                />
                <Search className="w-4 h-4 text-brand-text-secondary absolute left-3 top-3" />
              </div>

              {/* Scrollable list of clients */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredClients.map(c => (
                  <div key={c.id} className="p-3 bg-[#0d1324] border border-brand-border hover:border-brand-accent-amber rounded-xl flex items-center justify-between transition-colors">
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[11px] text-brand-[10px] text-brand-text-secondary mt-0.5">{c.address}</p>
                      <p className="text-[10px] text-brand-text-muted font-mono mt-0.5">{c.plan}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedClient(c)}
                      className="text-[10px] font-mono font-bold bg-brand-accent-amber text-brand-bg px-2.5 py-1.5 rounded transition-all hover:scale-105"
                    >
                      Përzgjidh
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CLIENT DATABASE */}
        {activeTab === 'clients' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">Regjistri i Klientëve DigiNet</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">Shiko kontratat, planet aktive dhe detajet e terminalit optik (ONT) për të gjithë klientët.</p>
              </div>
              
              <div className="relative w-full max-w-xs">
                <input 
                  type="text" 
                  ref={clientSearchInputRef}
                  placeholder="Kërko sipas emrit ose telefonit..." 
                  value={clientSearchPhrase}
                  onChange={(e) => setClientSearchPhrase(e.target.value)}
                  className="bg-brand-bg border border-brand-border rounded-xl text-xs pl-8 pr-4 py-2 text-white focus:outline-none w-full"
                />
                <Search className="w-3.5 h-3.5 text-brand-text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="border border-brand-border rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1021] text-brand-text-secondary font-mono border-b border-brand-border">
                  <tr>
                    <th className="p-3">ID KLIENTI</th>
                    <th className="p-3">EMRI DHE MBIEMRI</th>
                    <th className="p-3">CELULARI</th>
                    <th className="p-3">ADRESA</th>
                    <th className="p-3">PLANI</th>
                    <th className="p-3">MODELI I ROUTERIT</th>
                    <th className="p-3">SERIALI I ONT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-brand-card-hover/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-accent-amber">{c.id}</td>
                      <td className="p-3 font-semibold text-white">{c.name}</td>
                      <td className="p-3 font-mono text-brand-text-secondary">{c.phone}</td>
                      <td className="p-3 text-brand-text-secondary">{c.address}</td>
                      <td className="p-3 text-brand-text-secondary">{c.plan}</td>
                      <td className="p-3 text-brand-text-secondary font-mono">{c.routerModel}</td>
                      <td className="p-3 text-brand-text-muted font-mono">{c.ontSerial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TECHNICIAN STATUS BOARD */}
        {activeTab === 'techs' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase">Paneli i Monitorimit të Teknikëve</h3>
            <p className="text-xs text-brand-text-secondary">Lista e gjendjes së teknikëve në terren, detajet e punës dhe zonat e atribuara.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {technicians.map(tech => (
                <div key={tech.id} className="p-4 bg-[#0d1324] border border-brand-border rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-white">{tech.name}</p>
                      <p className="text-[10px] text-brand-text-secondary font-mono">{tech.zone}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                      tech.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      tech.status === 'on_job' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {tech.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] font-sans space-y-1 pt-1 border-t border-brand-border/40">
                    <p className="text-brand-text-secondary">Punë të përfunduara: <strong className="text-white">{tech.jobsCompleted}</strong></p>
                    <p className="text-brand-text-secondary font-mono">Rating në sistem: <strong className="text-brand-accent-amber font-bold">{tech.rating} ★</strong></p>
                    {tech.currentJobId && (
                      <p className="text-brand-accent-blue font-mono text-[10px]">Punë aktive: <strong className="font-bold">{tech.currentJobId}</strong></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Real-time floating Discuss chat per Ticket Modal */}
      {activeChatTicketId && (
        <div className="fixed bottom-14 right-4 z-50 w-80 bg-brand-card border border-brand-border rounded-2xl shadow-2xl flex flex-col h-[400px] overflow-hidden">
          <div className="p-3 bg-brand-bg border-b border-brand-border flex justify-between items-center">
            <span className="text-xs font-bold font-mono text-white">BISEDIM PER BILETEN {activeChatTicketId}</span>
            <button 
              onClick={() => setActiveChatTicketId(null)}
              className="text-brand-text-secondary hover:text-white font-bold text-xs"
            >
              Mbyll
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeChatMessages.map(msg => (
              <div key={msg.id} className={`p-2 rounded-xl text-[11px] ${msg.senderRole === 'operator' ? 'bg-brand-accent-blue/15 text-white ml-6' : 'bg-brand-bg text-brand-text-secondary mr-6'}`}>
                <div className="flex justify-between items-center mb-1 text-[9px] font-mono opacity-85">
                  <span className="font-bold text-brand-accent-blue uppercase">{msg.senderName.split(' ')[0]} ({msg.senderRole})</span>
                </div>
                <p>{msg.text}</p>
              </div>
            ))}
            {activeChatMessages.length === 0 && (
              <p className="text-[10px] text-brand-text-muted text-center italic py-24">Sillni pyetjen tuaj këtu për saktësi komunikimi.</p>
            )}
          </div>

          <div className="p-2 border-t border-brand-border bg-brand-bg flex gap-1">
            <input 
              type="text" 
              placeholder="Shkruaj një mesaj..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-brand-card border border-brand-border rounded px-2.5 py-1 text-xs text-white"
            />
            <button 
              onClick={handleSendMessage}
              className="p-1 px-3 bg-brand-accent-blue text-white rounded text-xs"
            >
              Dërgo
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
