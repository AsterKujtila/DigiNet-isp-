import React, { useState } from 'react';
import { 
  Ticket, Client, TechnicianAvailability, InfrastructureIssue, 
  InventoryItem, KnowledgeArticle, PartsRequest 
} from '../types';
import { 
  ShieldAlert, Settings, AlertTriangle, Layers, Server, Activity, 
  Plus, Search, CheckCircle, Clock, Save, Edit3, X, Sparkles, RefreshCw
} from 'lucide-react';

interface EngineerPanelProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  infrastructure: InfrastructureIssue[];
  setInfrastructure: React.Dispatch<React.SetStateAction<InfrastructureIssue[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  knowledgeBase: KnowledgeArticle[];
  setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeArticle[]>>;
  partsRequests: PartsRequest[];
  setPartsRequests: React.Dispatch<React.SetStateAction<PartsRequest[]>>;
}

export const EngineerPanel: React.FC<EngineerPanelProps> = ({
  tickets,
  setTickets,
  infrastructure,
  setInfrastructure,
  inventory,
  setInventory,
  knowledgeBase,
  setKnowledgeBase,
  partsRequests,
  setPartsRequests
}) => {
  const [activeTab, setActiveTab] = useState<'network' | 'escalations' | 'infrastructure' | 'topology' | 'kb' | 'inventory'>('network');
  
  // KB States
  const [kbSearch, setKbSearch] = useState('');
  const [showAddKbModal, setShowAddKbModal] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', category: 'G-PON', tags: '', articleBody: '' });

  // Outages / Infra states
  const [showAddInfraModal, setShowAddInfraModal] = useState(false);
  const [newInfra, setNewInfra] = useState({
    title: '', type: 'fiber_cut' as any, severity: 'high' as any, zone: 'Zone 3 (Don Bosko)', affected: 150, estTime: '3 orë', description: ''
  });

  // KPI analytics
  const activeOutages = infrastructure.filter(i => i.status === 'active').length;
  const escalatedCount = tickets.filter(t => t.escalatedTo === 'engineer' && t.status !== 'resolved' && t.status !== 'closed').length;
  const criticalTickets = tickets.filter(t => t.priority === 'P1' && t.status !== 'resolved' && t.status !== 'closed').length;

  // Approve inventory allocation
  const handleApproveParts = (requestId: string) => {
    const req = partsRequests.find(r => r.id === requestId);
    if (!req) return;

    // Check if enough stock exists in inventory
    const matchedInv = inventory.find(i => i.name.toLowerCase().includes(req.partName.toLowerCase()) || req.partName.toLowerCase().includes(i.name.toLowerCase()));
    
    if (matchedInv && matchedInv.quantity < req.quantity) {
      alert(`Mungesë stoku! Në magazinë ka vetëm ${matchedInv.quantity} copë ${matchedInv.name}.`);
      return;
    }

    setPartsRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));

    // Subtract from inventory stock
    if (matchedInv) {
      setInventory(prevInv => prevInv.map(item => {
        if (item.id === matchedInv.id) {
          const nextQty = Math.max(0, item.quantity - req.quantity);
          return {
            ...item,
            quantity: nextQty,
            status: nextQty < item.minRequired ? 'low' : 'ok'
          };
        }
        return item;
      }));
    }

    alert('Kërkesa u APROVUA! Asetet u rezervuan për teknikun.');
  };

  const handleRejectParts = (requestId: string) => {
    setPartsRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    alert('Kërkesa u refuzua.');
  };

  // Add KB Article
  const handleAddKb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.articleBody) return;
    const article: KnowledgeArticle = {
      id: `kb-${Date.now()}`,
      title: newArticle.title,
      category: newArticle.category,
      tags: newArticle.tags.split(',').map(t => t.trim()),
      language: 'sq',
      articleBody: newArticle.articleBody,
      author: 'Sokol Demiri',
      createdAt: new Date().toISOString()
    };
    setKnowledgeBase([article, ...knowledgeBase]);
    setShowAddKbModal(false);
    setNewArticle({ title: '', category: 'G-PON', tags: '', articleBody: '' });
  };

  // Add Infrastructure Issue
  const handleAddInfra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInfra.title || !newInfra.description) return;
    const item: InfrastructureIssue = {
      id: `INF-${Date.now().toString().slice(-3)}`,
      title: newInfra.title,
      type: newInfra.type,
      severity: newInfra.severity,
      status: 'active',
      zone: newInfra.zone,
      affectedClientsCount: newInfra.affected,
      estResolutionTime: newInfra.estTime,
      description: newInfra.description,
      createdAt: new Date().toISOString()
    };
    setInfrastructure([item, ...infrastructure]);
    setShowAddInfraModal(false);
    setNewInfra({ title: '', type: 'fiber_cut', severity: 'high', zone: 'Zone 3 (Don Bosko)', affected: 150, estTime: '3 orë', description: '' });
  };

  // Resolve Infrastructure Issue
  const resolveInfraIssue = (issueId: string) => {
    setInfrastructure(prev => prev.map(item => {
      if (item.id === issueId) {
        return {
          ...item,
          status: 'resolved',
          resolvedAt: new Date().toISOString()
        };
      }
      return item;
    }));
    alert(`Incidenti i infrastrukturës ${issueId} u zgjidh dhe u mbyll!`);
  };

  // Handle Escalations response
  const handleResolveEscalation = (ticketId: string, engNotes: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'resolved',
          techNotes: `Zgjidhur nga Inxhinieri Sokol Demiri. Shënimet: ${engNotes}`,
          resolvedAt: new Date().toISOString(),
          history: [
            ...t.history,
            { timestamp: new Date().toISOString(), user: 'Sokol Demiri', role: 'engineer', action: 'Zgjidhi ankesën e eskaluar', note: engNotes }
          ]
        };
      }
      return t;
    }));
    alert(`Bileta ${ticketId} u zgjidh me sukses te inxhinierët.`);
  };

  const filteredKb = knowledgeBase.filter(a => 
    a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
    a.articleBody.toLowerCase().includes(kbSearch.toLowerCase()) ||
    a.category.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary py-8 px-4 sm:px-6 md:px-8">
      
      {/* Header element */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6 mb-6">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-brand-accent-blue animate-pulse" />
            Paneli Inxhinierik dhe Monitorimi i Rrjetit
          </h1>
          <p className="text-xs text-brand-text-secondary font-mono mt-0.5">
            DigiNet Core Operations Station • Sokol Demiri, Senior Network Lead
          </p>
        </div>

        {/* Quick TABS */}
        <div className="flex flex-wrap gap-2 bg-brand-card p-1 rounded-xl border border-brand-border">
          <button 
            onClick={() => setActiveTab('network')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'network' ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary hover:text-white'}`}
          >
            METRIKA RRJETI
          </button>
          <button 
            onClick={() => setActiveTab('escalations')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'escalations' ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary hover:text-white'}`}
          >
            ERASURES & ESKALIMET ({escalatedCount})
          </button>
          <button 
            onClick={() => setActiveTab('infrastructure')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'infrastructure' ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary hover:text-white'}`}
          >
            AVARITË BAZË ({activeOutages})
          </button>
          <button 
            onClick={() => setActiveTab('topology')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'topology' ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary hover:text-white'}`}
          >
            HARTA/TOPOLOGJIA GPON
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'inventory' ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary hover:text-white'}`}
          >
            INVENTARI & REZERVAT
          </button>
          <button 
            onClick={() => setActiveTab('kb')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all ${activeTab === 'kb' ? 'bg-brand-accent-blue text-white' : 'text-brand-text-secondary hover:text-white'}`}
          >
            KNOWLEDGE BASE
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* TAB 1: METRIKAT E RRJETIT */}
        {activeTab === 'network' && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-brand-card p-5 border border-brand-border rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-brand-accent-red" />
                <div>
                  <p className="text-[10px] font-mono text-brand-text-secondary">PROBEME AKTIVE</p>
                  <p className="text-lg font-bold font-mono text-white">{activeOutages}</p>
                </div>
              </div>

              <div className="bg-brand-card p-5 border border-brand-border rounded-2xl flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-brand-accent-amber" />
                <div>
                  <p className="text-[10px] font-mono text-brand-text-secondary">ESKALIME AKTIVE</p>
                  <p className="text-lg font-bold font-mono text-white">{escalatedCount}</p>
                </div>
              </div>

              <div className="bg-brand-card p-5 border border-brand-border rounded-2xl flex items-center gap-3">
                <Activity className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-mono text-brand-text-secondary">SISTEMI GPON CORE STATUS</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">99.85% ONLINE</p>
                </div>
              </div>

              <div className="bg-brand-card p-5 border border-brand-border rounded-2xl flex items-center gap-3">
                <Server className="w-8 h-8 text-indigo-400" />
                <div>
                  <p className="text-[10px] font-mono text-brand-text-secondary">REZERVAT E INVENTARIT</p>
                  <p className="text-lg font-bold font-mono text-white">{inventory.filter(i => i.status === 'low').length} artikuj LOW</p>
                </div>
              </div>
            </div>

            {/* General network reports */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Outage list */}
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2">Statusi i Mbulimit ISP (Backbone cuts)</h3>
                <div className="space-y-3">
                  {infrastructure.map(issue => (
                    <div key={issue.id} className={`p-4 rounded-xl border ${issue.status === 'active' ? 'bg-red-500/5 border-red-500/20' : 'bg-brand-bg border-brand-border/40'}`}>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${issue.status === 'active' ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span>
                          {issue.title}
                        </h4>
                        <span className="text-[9px] bg-brand-bg border border-brand-border/60 px-2 py-0.5 rounded font-mono uppercase text-brand-text-secondary">{issue.id}</span>
                      </div>
                      <p className="text-[11px] text-brand-text-secondary leading-normal mt-1.5">{issue.description}</p>
                      
                      <div className="mt-3 pt-2.5 border-t border-brand-border/30 flex justify-between items-center text-[10px] font-mono">
                        <span className="text-brand-text-muted">Ndikuar: <strong className="text-brand-accent-amber">{issue.affectedClientsCount} Klientë</strong></span>
                        <span className="text-brand-text-muted">Zgjidhja: <strong className="text-white">{issue.estResolutionTime}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick instructions panel */}
              <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2">Sistemi i mënjanimit OLT & RouterOS</h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Stacioni i saldimit optik të dëmtuar dhe vlerat dBm optike të splitter-it kombëtar duhet të jenë gjithnjë në standardin profesional për të ruajtur standardin uptime.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#0d1324] border border-brand-border rounded-xl">
                    <p className="font-semibold text-white">Vlerat dBm Optike standarde:</p>
                    <p className="text-brand-text-secondary mt-1">Optimumi i lidhjes: -16 dBm deri në -24 dBm.</p>
                  </div>
                  <div className="p-3 bg-[#0d1324] border border-brand-border rounded-xl">
                    <p className="font-semibold text-white">IGMP Snooping per IPTV:</p>
                    <p className="text-brand-text-secondary mt-1">Aktivizoni gjithnjë multicast routing në routerin MikroTik të ndërtesës.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ESCALATIONS INTERVENTION */}
        {activeTab === 'escalations' && (
          <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase border-b border-brand-border pb-2">Radha e Eskalimeve të Rrjetit</h3>
            <p className="text-xs text-brand-text-secondary">Incidentet e rënda të raportuara nga operatorët ose teknikët e terrenit që kërkojnë ndërhyrje të nivelit senior.</p>

            <div className="space-y-3">
              {tickets.filter(t => t.escalatedTo === 'engineer' && t.status !== 'resolved' && t.status !== 'closed').map(ticket => (
                <div key={ticket.id} className="p-4 bg-brand-bg border border-brand-border rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-brand-accent-red font-bold">ESKALUAR</span>
                      <h4 className="text-xs font-bold text-white mt-1">{ticket.clientName}</h4>
                      <p className="text-[10px] text-brand-text-secondary font-mono">{ticket.clientAddress} • {ticket.clientZone}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase priority-p1">{ticket.priority}</span>
                  </div>

                  <p className="text-[11px] text-brand-text-secondary leading-normal bg-[#0d1324] p-3 rounded-xl border border-brand-border">
                    <strong className="text-white font-mono block text-[10px] mb-1">ARSYEJA E ESKALIMIT:</strong>
                    "{ticket.escalationReason}"
                  </p>

                  <div className="pt-2 border-t border-brand-border/30 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-brand-text-muted">Krijuar: {new Date(ticket.createdAt).toLocaleDateString('sq')}</span>
                    <button 
                      onClick={() => {
                        const notes = prompt('Fut shënimet e hollësishme teknike të inxhinierit Sokol Demiri mbi zgjidhjen e këtij eskalimi:');
                        if (notes) handleResolveEscalation(ticket.id, notes);
                      }}
                      className="px-3.5 py-1.5 bg-brand-accent-blue hover:opacity-95 text-white rounded font-bold transition-all text-[11px]"
                    >
                      X zgjidhje & përfundo
                    </button>
                  </div>
                </div>
              ))}

              {tickets.filter(t => t.escalatedTo === 'engineer' && t.status !== 'resolved' && t.status !== 'closed').length === 0 && (
                <div className="py-24 text-center text-brand-text-muted font-mono text-xs">
                  Nuk ka asnjë ankesë të eskaluar për momentin. Çdo gjë është e qetë.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BACKBONE OUTAGES */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-4">
            <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">Regjistri i Avarive të Infrastrukturës</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">Komandimi i kabinave kryesore OLT dhe fibrave magjistrale të rrjetit.</p>
              </div>

              <button 
                onClick={() => setShowAddInfraModal(true)}
                className="flex items-center gap-1 text-xs font-semibold px-4 py-2 bg-brand-accent-blue text-white rounded-xl shadow"
              >
                <Plus className="w-4 h-4" />
                HAP INCIDENT TE RI
              </button>
            </div>

            <div className="space-y-3">
              {infrastructure.map(issue => (
                <div key={issue.id} className={`p-4 bg-brand-card border rounded-2xl ${issue.status === 'active' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-brand-border/40'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${issue.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                        {issue.title}
                      </h4>
                      <p className="text-[10px] text-brand-text-secondary font-mono mt-0.5">{issue.zone} • Severity: {issue.severity.toUpperCase()}</p>
                    </div>

                    <span className="text-[9px] bg-brand-bg border border-brand-border px-2 py-0.5 rounded font-mono uppercase text-brand-text-secondary">{issue.id}</span>
                  </div>

                  <p className="text-xs text-brand-text-secondary leading-relaxed bg-[#0d1324] p-3 rounded-xl border border-brand-border/50">{issue.description}</p>
                  
                  <div className="pt-3 border-t border-brand-border/20 mt-3 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-brand-text-secondary">Ndikuar: <strong className="text-brand-accent-amber">{issue.affectedClientsCount} Klientë</strong></span>
                    {issue.status === 'active' ? (
                      <button 
                        onClick={() => resolveInfraIssue(issue.id)}
                        className="px-3 py-1 bg-brand-accent-green hover:opacity-95 text-brand-bg font-bold font-sans rounded"
                      >
                        Zgjidhe (RESOLVE)
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold uppercase">ZGJIDHUR ME SUKSES</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SVG GPON NETWORK TOPOLOGY */}
        {activeTab === 'topology' && (
          <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase">Harta Skematike dhe Topology e DigiNet GPON</h3>
              <p className="text-xs text-brand-text-secondary">Marrëdhënia vizuale e nyjeve të rrjetit, rrugëve të fibrave nga serveri qendror te OLT-ja dhe te splitteri i katit të klientit. Klikoni mbi nyje për të paraparë statusin.</p>
            </div>

            {/* Beautiful static SVG diagram with interactive status signals */}
            <div className="w-full h-80 bg-brand-bg rounded-2xl relative border border-brand-border flex items-center justify-center p-4">
              <svg viewBox="0 0 800 300" className="w-full h-full text-white">
                {/* Connection lines core and switch nodes */}
                <line x1="100" y1="150" x2="300" y2="100" stroke="#1e3a5f" strokeWidth="4" />
                <line x1="100" y1="150" x2="300" y2="200" stroke="#1e3a5f" strokeWidth="4" />
                
                <line x1="300" y1="100" x2="550" y2="70" stroke="#1e3a5f" strokeWidth="3" />
                <line x1="300" y1="100" x2="550" y2="130" stroke="#10b981" strokeWidth="3" />
                <line x1="300" y1="200" x2="550" y2="230" stroke="#ef4444" strokeWidth="3" strokeDasharray="5" />

                {/* Main Qendrore core router */}
                <g className="cursor-pointer" onClick={() => alert('Serveri Qendror Core-DigiNet-01 (Uptime: 1530 ditë, Status: Normal)')}>
                  <rect x="50" y="110" width="100" height="80" rx="8" fill="#141b2d" stroke="#3b82f6" strokeWidth="2" />
                  <text x="100" y="145" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">CORE SERVER</text>
                  <text x="100" y="165" fill="#10b981" fontSize="9" textAnchor="middle" fontFamily="monospace">ONLINE</text>
                </g>

                {/* OLT Nodes */}
                <g className="cursor-pointer" onClick={() => alert('OLT-DonBosko-Card-02. Ka 12 porta aktive GPON.')}>
                  <circle cx="300" cy="100" r="35" fill="#141b2d" stroke="#10b981" strokeWidth="2" />
                  <text x="300" y="103" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">OLT TIRANA 1</text>
                </g>

                <g className="cursor-pointer" onClick={() => alert('OLT-DurresPlazh-Card-01. Me tension të ulët për shkak të OSEE.')}>
                  <circle cx="300" cy="200" r="35" fill="#141b2d" stroke="#ef4444" strokeWidth="2" />
                  <text x="300" y="203" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">OLT DURRES 2</text>
                </g>

                {/* Splitters and end clients */}
                <g className="cursor-pointer" onClick={() => alert('Splitter Optik 1x8 (Kavaja/Shyri). Niveli mesatar optik: -18 dBm. Status: Normal.')}>
                  <polygon points="550,55 580,70 550,85" fill="#141b2d" stroke="#3b82f6" strokeWidth="2" />
                  <text x="610" y="74" fill="#64748b" fontSize="10">Splitter S1</text>
                </g>

                <g className="cursor-pointer" onClick={() => alert('Splitter Optik 1x8 (Don Bosko 3). Status: Këputje optike e raportuar.')}>
                  <polygon points="550,215 580,230 550,245" fill="#141b2d" stroke="#ef4444" strokeWidth="2" />
                  <text x="610" y="234" fill="#ef4444" fontSize="10">Splitter S3 (Këputur)</text>
                </g>
              </svg>
              <div className="absolute top-4 left-4 bg-brand-card/90 border border-brand-border p-3 rounded-xl text-[10px] font-mono space-y-1">
                <p className="flex items-center gap-1 text-emerald-400">● <strong className="text-white">Jeshile:</strong> Konvencionale / Normal</p>
                <p className="flex items-center gap-1 text-red-400">● <strong className="text-white">Kuqe:</strong> Shkelje optike këputje</p>
                <p className="flex items-center gap-1 text-brand-accent-blue">● <strong className="text-white">Kaltër:</strong> Serveri Qendror i Rrjetit</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PARTS INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Stock List */}
            <div className="xl:col-span-2 bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2">Statusi i Magazinës dhe Aseteve</h3>
              <div className="space-y-3">
                {inventory.map(item => (
                  <div key={item.id} className="p-3 bg-brand-bg border border-brand-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-brand-text-secondary font-mono mt-0.5">Kodi: {item.code} • Rezervuar: {item.reserved} {item.unit}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-white">{item.quantity} {item.unit}</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                        item.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Allocation approvals */}
            <div className="bg-brand-card border border-brand-border p-5 rounded-2xl h-fit space-y-4">
              <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2">Kërkesat për Asetet nga Teknikët</h3>
              <div className="space-y-3">
                {partsRequests.filter(r => r.status === 'pending').map(req => (
                  <div key={req.id} className="p-3 bg-[#0d1324] border border-brand-border/70 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-white">{req.techName}</p>
                        <p className="text-[9px] text-brand-text-muted font-mono">{req.createdAt.split('T')[0]}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${req.urgency === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/25 text-gray-400'}`}>{req.urgency.toUpperCase()}</span>
                    </div>

                    <div className="p-2 bg-brand-card border border-brand-border rounded-lg text-xs font-mono text-brand-accent-amber text-center">
                      {req.partName} x {req.quantity}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRejectParts(req.id)}
                        className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-mono border border-red-500/20"
                      >
                        Refuzo
                      </button>
                      <button 
                        onClick={() => handleApproveParts(req.id)}
                        className="flex-1 py-1 bg-brand-accent-green hover:opacity-95 text-brand-bg rounded text-[10px] font-bold font-sans"
                      >
                        Aprovo
                      </button>
                    </div>
                  </div>
                ))}

                {partsRequests.filter(r => r.status === 'pending').length === 0 && (
                  <p className="text-xs text-brand-text-muted text-center py-12 italic">Nuk ka asnjë kërkesë të hapur aseti.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: TECHNICAL KNOWLEDGE BASE */}
        {activeTab === 'kb' && (
          <div className="space-y-4">
            <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">Baza e Njohurive Teknike (Manualet)</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">Udhëzuesit zyrtar shqip për mënjanimin e rasteve të red LOS, reset të Huawei apo RouterOS configs.</p>
              </div>

              <button 
                onClick={() => setShowAddKbModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-brand-accent-blue text-white rounded-xl shadow"
              >
                <Plus className="w-4 h-4" />
                SHTO manual Tjetër
              </button>
            </div>

            <div className="relative mb-3">
              <input 
                type="text" 
                placeholder="Kërko artikuj apo manuale..." 
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full bg-brand-card border border-brand-border rounded-xl text-xs pl-8 pr-4 py-2 text-white focus:outline-none focus:border-brand-accent-blue"
              />
              <Search className="w-4 h-4 text-brand-text-muted absolute left-2.5 top-2.5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKb.map(art => (
                <div key={art.id} className="p-4 bg-brand-card border border-brand-border rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-mono font-bold text-white">{art.title}</h4>
                    <span className="text-[9px] bg-[#0d1324] border border-brand-border/60 px-2 py-0.5 rounded font-mono text-brand-text-secondary">{art.category}</span>
                  </div>
                  <p className="text-xs text-brand-text-secondary whitespace-pre-wrap leading-relaxed">{art.articleBody}</p>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-brand-border/30 text-[9px] font-mono text-brand-text-muted">
                    <span>Nga: <strong className="text-white">{art.author}</strong></span>
                    <span>{art.createdAt.split('T')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Add Outage Modal */}
      {showAddInfraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setShowAddInfraModal(false)} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-mono font-bold text-white uppercase mb-4">
              Krijo Incident të Infrastrukturës (Outage)
            </h3>

            <form onSubmit={handleAddInfra} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Titulli i Incidentit</label>
                <input 
                  type="text" 
                  required
                  value={newInfra.title}
                  onChange={(e) => setNewInfra({...newInfra, title: e.target.value})}
                  placeholder="p.sh. OLT Porta 04 Rënie e rëndë optike"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Lloji</label>
                  <select 
                    value={newInfra.type}
                    onChange={(e) => setNewInfra({...newInfra, type: e.target.value as any})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  >
                    <option value="fiber_cut">Këputje Fiber Optike</option>
                    <option value="olt_down">Rënie e Porta OLT</option>
                    <option value="node_power">Problem me Energjinë</option>
                    <option value="upstream_outage">Transmetues Upstream</option>
                    <option value="other">Të tjerat...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Severity</label>
                  <select 
                    value={newInfra.severity}
                    onChange={(e) => setNewInfra({...newInfra, severity: e.target.value as any})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  >
                    <option value="critical">Krkitike (Critical)</option>
                    <option value="high">Lartë (High)</option>
                    <option value="medium">Mesatare (Medium)</option>
                    <option value="low">Ulët (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Zona e Ndikuar</label>
                  <select 
                    value={newInfra.zone}
                    onChange={(e) => setNewInfra({...newInfra, zone: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
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
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Klientë të prekur</label>
                  <input 
                    type="number"
                    value={newInfra.affected}
                    onChange={(e) => setNewInfra({...newInfra, affected: parseInt(e.target.value) || 0})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Koha mesatare e pritur</label>
                <input 
                  type="text"
                  value={newInfra.estTime}
                  onChange={(e) => setNewInfra({...newInfra, estTime: e.target.value})}
                  placeholder="p.sh. 2 orë"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Përshkrimi i hollësishëm i incidentit</label>
                <textarea 
                  rows={3}
                  required
                  value={newInfra.description}
                  onChange={(e) => setNewInfra({...newInfra, description: e.target.value})}
                  placeholder="Çfarë ndodhi me OLT ose splitteri..."
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-brand-accent-blue text-white rounded-lg font-semibold hover:opacity-95 transition-all"
              >
                Hap dhe Transmeto Incidentin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add KB Modal */}
      {showAddKbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setShowAddKbModal(false)} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-mono font-bold text-white uppercase mb-4">
              Shto Manual ose Artikull të Ri KB
            </h3>

            <form onSubmit={handleAddKb} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Titulli i Manualit</label>
                <input 
                  type="text" 
                  required
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  placeholder="Konfigurimi i..."
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Kategoria</label>
                  <select 
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  >
                    <option value="G-PON">G-PON / Optike</option>
                    <option value="MikroTik RouterOS">Routeros / MikroTik</option>
                    <option value="IPTV">IPTV / STB</option>
                    <option value="General Ops">Procedura Puna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Tags (Komponente, Ndara me presje)</label>
                  <input 
                    type="text" 
                    value={newArticle.tags}
                    onChange={(e) => setNewArticle({...newArticle, tags: e.target.value})}
                    placeholder="Huawei, ONT, LOS"
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-text-secondary font-mono mb-1">Trupi i Artikullit (Përshkrimi Hap pas Hapi)</label>
                <textarea 
                  rows={6}
                  required
                  value={newArticle.articleBody}
                  onChange={(e) => setNewArticle({...newArticle, articleBody: e.target.value})}
                  placeholder="Detajet e konfigurimit ose mënjanimit..."
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-xs px-3 py-2 text-white"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-brand-accent-blue text-white rounded-lg font-semibold hover:opacity-95 transition-all"
              >
                Krijo Manualin e Ri
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
