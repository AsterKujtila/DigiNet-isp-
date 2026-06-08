import React, { useState, useRef, useEffect } from 'react';
import { 
  Ticket, Client, TechnicianAvailability, InventoryItem, PartsRequest, WorkReport, AuditLog 
} from '../types';
import { 
  Wrench, Phone, MapPin, Sparkles, Send, CheckCircle, HelpCircle, 
  Settings, Award, RefreshCw, BarChart2, ShieldAlert, Camera, CheckSquare, ListPlus, WifiOff
} from 'lucide-react';

interface TechnicianPanelProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  partsRequests: PartsRequest[];
  setPartsRequests: React.Dispatch<React.SetStateAction<PartsRequest[]>>;
  activeTechId: string; // tech-3 'Çlirim Rama' or similar
}

export const TechnicianPanel: React.FC<TechnicianPanelProps> = ({
  tickets,
  setTickets,
  inventory,
  setInventory,
  partsRequests,
  setPartsRequests,
  activeTechId
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'assistant' | 'parts' | 'stats'>('jobs');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // AI Field Assistant states
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Parts request form
  const [partRequest, setPartRequest] = useState({ name: '', qty: 1, urgency: 'normal' as any });

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Local state for the current active job's Work Report form
  const [reportForm, setReportForm] = useState<{
    whatDone: string[];
    partsUsed: { partId: string; partName: string; quantity: number }[];
    beforeSpeed: string;
    afterSpeed: string;
    resolutionNotes: string;
    uploadedPhotos: string[];
  }>({
    whatDone: [],
    partsUsed: [],
    beforeSpeed: '0 / 0 Mbps',
    afterSpeed: '100 / 100 Mbps',
    resolutionNotes: '',
    uploadedPhotos: []
  });

  // Offline indicator state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSyncMessage, setOfflineSyncMessage] = useState('');

  // Find assigned tickets
  const myTickets = tickets.filter(t => t.assignedTechId === activeTechId);
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Pre-defined list of potential works
  const WORK_CATEGORIES_PRESETS = [
    'replaced ONT',
    'spliced fiber',
    'reconfigured router',
    'replaced cable',
    'updated firmware',
    'training client'
  ];

  // Initialize Canvas Signature
  useEffect(() => {
    if (selectedTicket && selectedTicket.status === 'in_progress' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [selectedTicket, selectedTicketId]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0, canvas.width, canvas.height);
  };

  // Status transitions
  const updateJobStatus = (status: 'in_progress' | 'pending_parts' | 'resolved') => {
    if (!selectedTicketId) return;
    
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        const historyCopy = [...t.history];
        let actionStr = '';
        if (status === 'in_progress') actionStr = 'Nisi punën (START JOB)';
        if (status === 'pending_parts') actionStr = 'Mungesë pjesësh (PENDING PARTS)';
        if (status === 'resolved') actionStr = 'Zgjidhi biletën (RESOLVED)';

        historyCopy.push({
          timestamp: new Date().toISOString(),
          user: 'Çlirim Rama',
          role: 'technician',
          action: actionStr
        });

        return {
          ...t,
          status: status,
          updatedAt: new Date().toISOString(),
          history: historyCopy
        };
      }
      return t;
    }));
  };

  // Submit report form
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;

    const canvas = canvasRef.current;
    const signatureBase64 = canvas ? canvas.toDataURL() : '';

    const newReport: WorkReport = {
      whatDone: reportForm.whatDone,
      partsUsed: reportForm.partsUsed,
      beforeSpeed: reportForm.beforeSpeed,
      afterSpeed: reportForm.afterSpeed,
      signature: signatureBase64,
      resolutionNotes: reportForm.resolutionNotes,
      submittedAt: new Date().toISOString()
    };

    // Update global ticket
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return {
          ...t,
          status: 'resolved',
          resolutionNotes: reportForm.resolutionNotes,
          workReport: newReport,
          partsUsed: reportForm.partsUsed,
          resolvedAt: new Date().toISOString(),
          history: [
            ...t.history,
            { timestamp: new Date().toISOString(), user: 'Çlirim Rama', role: 'technician', action: 'Dërgoi raportin përfundimtar të punës' }
          ]
        };
      }
      return t;
    }));

    // Subtract from inventory stock
    reportForm.partsUsed.forEach(part => {
      setInventory(prevInv => prevInv.map(item => {
        if (item.id === part.partId) {
          const nextQty = Math.max(0, item.quantity - part.quantity);
          return {
            ...item,
            quantity: nextQty,
            status: nextQty < item.minRequired ? 'low' : 'ok'
          };
        }
        return item;
      }));
    });

    alert('Raporti i punës u dërgua dhe u ruajt në sistem!');
    setSelectedTicketId(null);
    setReportForm({
      whatDone: [],
      partsUsed: [],
      beforeSpeed: '0 / 0 Mbps',
      afterSpeed: '100 / 100 Mbps',
      resolutionNotes: '',
      uploadedPhotos: []
    });
  };

  // Trigger Gemini Field Assistant
  const handleTriggerAI = async () => {
    if (!assistantInput.trim()) return;
    setAssistantLoading(true);
    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: assistantInput,
          clientDetails: selectedTicket ? {
            routerModel: selectedTicket.serviceType === 'fiber' ? 'Huawei HG8245H' : 'MikroTik RouterOS',
            ontSerial: 'ZTEGCA43DE01',
            zone: selectedTicket.clientZone
          } : undefined
        })
      });
      const data = await response.json();
      setAssistantResponse(data.guide || 'Gabim gjatë transmetimit.');
    } catch (error) {
      console.error(error);
      setAssistantResponse("### Mënyrat Lokale të Zgjidhjes\n\n1. **Kontrollo nivelin Rx të sinjalit**: Vlerat mbi -27 dBm tregojnë thyerje fiber.\n2. **Pastrim Lidhësash APC**: Fshi me pambuk alkooli lidhësin optik.\n3. **Procesi PPPoE**: Verifiko saktësinë e fushë-fjalisë në RouterOS.");
    } finally {
      setAssistantLoading(false);
    }
  };

  // Submit Spare Parts Request
  const handlePartsRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partRequest.name) return;
    const request: PartsRequest = {
      id: `pr-${Date.now()}`,
      techId: activeTechId,
      techName: 'Çlirim Rama',
      partName: partRequest.name,
      quantity: partRequest.qty,
      urgency: partRequest.urgency,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setPartsRequests([request, ...partsRequests]);
    alert(`Te Inxhinieria u dërgua kërkesa për: ${partRequest.name} (Qty: ${partRequest.qty})`);
    setPartRequest({ name: '', qty: 1, urgency: 'normal' });
  };

  // Stats
  const jobsDoneThisWeek = 14;
  const ratingAverage = 4.9;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col max-w-md mx-auto relative border-x border-brand-border shadow-2xl overflow-hidden pb-20">
      
      {/* Top Mobile Bar */}
      <div className="bg-brand-card p-4 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-accent-green" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">DIGINET FIELD ENGINE</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline/Online toggle for mobile testing */}
          <button 
            onClick={() => {
              setIsOffline(!isOffline);
              if (!isOffline) {
                setOfflineSyncMessage('Po punon Offline. Ndryshimet do të ruhen lokalisht.');
              } else {
                setOfflineSyncMessage('Sinkronizimi me bazën kombëtare u krye me sukses.');
                setTimeout(() => setOfflineSyncMessage(''), 3000);
              }
            }}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold border transition-all ${
              isOffline ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : 'ONLINE'}
          </button>
        </div>
      </div>

      {offlineSyncMessage && (
        <div className={`p-2.5 text-[10px] text-center font-mono font-semibold ${isOffline ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
          {offlineSyncMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            
            {!selectedTicketId ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-brand-text-secondary truncate">Detyrat e Atribuara (Sot)</span>
                  <span className="bg-brand-card border border-brand-border px-2 py-0.5 rounded text-white">{myTickets.length} Punë</span>
                </div>

                {myTickets.map(job => (
                  <div 
                    key={job.id} 
                    className={`p-4 bg-brand-card border rounded-2xl space-y-3 hover:border-brand-accent-green transition-all shadow-lg ${
                      job.status === 'in_progress' ? 'border-brand-accent-green' : 'border-brand-border'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-brand-accent-blue font-bold">MUT-{job.id}</span>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">{job.clientName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        job.priority === 'P1' ? 'priority-p1' : 
                        job.priority === 'P2' ? 'priority-p2' :
                        job.priority === 'P3' ? 'priority-p3' : 'priority-p4'
                      }`}>
                        {job.priority}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1.5 text-brand-text-secondary font-sans leading-relaxed">
                      <p className="flex items-center gap-1.5 text-xs text-white">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent-green shrink-0" />
                        {job.clientAddress}
                      </p>
                      <p className="text-[11px] line-clamp-2 italic bg-[#0d1324] p-2 rounded-lg border border-brand-border/40">
                        "{job.description}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-brand-border/30 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-brand-text-muted">Ora: {job.scheduledTime || 'Gjithë ditën'}</span>
                      <span className={`capitalize px-2 py-0.5 rounded-full text-[9px] border ${
                        job.status === 'open' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' :
                        job.status === 'assigned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        job.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <a 
                        href={`tel:${job.clientPhone}`}
                        className="flex-1 py-1.5 bg-[#0d1324] border border-brand-border hover:bg-brand-card-hover rounded-xl flex items-center justify-center gap-1 text-[11px] text-brand-text-secondary font-mono"
                      >
                        <Phone className="w-3.5 h-3.5" /> Thirr
                      </a>
                      <button 
                        onClick={() => setSelectedTicketId(job.id)}
                        className="flex-1 py-2 bg-brand-accent-green hover:opacity-95 text-brand-bg rounded-xl text-[11px] font-bold font-sans text-center transition-all"
                      >
                        HAPE WORKSPACE
                      </button>
                    </div>
                  </div>
                ))}

                {myTickets.length === 0 && (
                  <div className="py-24 text-center text-brand-text-muted font-mono text-xs">
                    Asnjë detyrë e caktuar sot.
                  </div>
                )}
              </div>
            ) : (
              
              /* Active Workspace Details form */
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedTicketId(null)}
                  className="text-xs font-mono text-brand-text-secondary hover:text-white mb-2 flex items-center gap-1 bg-brand-card px-2.5 py-1.5 border border-brand-border rounded"
                >
                  ← Kthehu te lista e detyrave
                </button>

                <div className="p-4 bg-brand-card border border-brand-border rounded-2xl space-y-3">
                  <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2 flex justify-between">
                    <span>MOTO-KOMANDAT WORKSPACE</span>
                    <span className="text-brand-accent-amber font-mono font-bold">{selectedTicket?.id}</span>
                  </h3>

                  <div className="text-xs space-y-1 text-brand-text-secondary leading-snug">
                    <p><strong className="text-white">Klienti:</strong> {selectedTicket?.clientName}</p>
                    <p><strong className="text-white">Adresa:</strong> {selectedTicket?.clientAddress}</p>
                    <p><strong className="text-white">Modeli i Routerit:</strong> {selectedTicket?.serviceType === 'fiber' ? 'ZTE F660 / Huawei HG8245H' : 'Nuk dihet'}</p>
                  </div>
                </div>

                {/* Status Update flow */}
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => updateJobStatus('in_progress')}
                    className={`p-2.5 text-[10px] font-mono font-bold rounded-xl text-center shadow border transition-all ${
                      selectedTicket?.status === 'in_progress' ? 'bg-amber-500/25 text-amber-400 border-amber-500/35 scale-105' : 'bg-brand-card text-brand-text-secondary border-brand-border'
                    }`}
                  >
                    ON SITE (WORKING)
                  </button>

                  <button 
                    onClick={() => updateJobStatus('pending_parts')}
                    className={`p-2.5 text-[10px] font-mono font-bold rounded-xl text-center shadow border transition-all ${
                      selectedTicket?.status === 'pending_parts' ? 'bg-purple-500/25 text-purple-400 border-purple-500/35 scale-105' : 'bg-brand-card text-brand-text-secondary border-brand-border'
                    }`}
                  >
                    NEEDS PARTS
                  </button>

                  <button 
                    onClick={() => {
                      const reason = prompt('Përshkruaj arsyen e eskalimit te Inxhinieri:');
                      if (reason && selectedTicket?.id) {
                        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'open', escalatedTo: 'engineer', escalationReason: reason } : t));
                        alert('Bileta u eskalua me sukses.');
                        setSelectedTicketId(null);
                      }
                    }}
                    className="p-2.5 text-[10px] font-mono font-bold rounded-xl text-center bg-brand-card text-brand-accent-red border border-red-500/20 hover:bg-red-500/10"
                  >
                    ESKALO TE INXH
                  </button>
                </div>

                {/* Report submission form if ON_SITE/Working */}
                {selectedTicket?.status === 'in_progress' && (
                  <form onSubmit={handleSubmitReport} className="p-4 bg-brand-card border border-brand-border rounded-2xl space-y-4 text-xs">
                    <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2">Raportimi përfundimtar</h3>
                    
                    {/* Checkboxes What Was Done */}
                    <div>
                      <label className="block text-brand-text-secondary font-mono mb-2">Çfarë u realizua? (Zgjidh opsionet)</label>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {WORK_CATEGORIES_PRESETS.map(preset => (
                          <label key={preset} className="flex items-center gap-2 p-1.5 bg-[#0d1324] border border-brand-border/40 rounded-lg">
                            <input 
                              type="checkbox"
                              checked={reportForm.whatDone.includes(preset)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setReportForm({ ...reportForm, whatDone: [...reportForm.whatDone, preset] });
                                } else {
                                  setReportForm({ ...reportForm, whatDone: reportForm.whatDone.filter(x => x !== preset) });
                                }
                              }}
                            />
                            <span className="text-brand-text-secondary capitalize">{preset.replace('replaced', 'Ndërruar')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Pre-defined parts selection with quantity */}
                    <div>
                      <label className="block text-brand-text-secondary font-mono mb-2">Pjesët / Asetet e Përdorura</label>
                      <div className="space-y-2">
                        {[
                          { id: 'inv-1', name: 'ONT Huawei HG8245H' },
                          { id: 'inv-3', name: 'MikroTik hAP ac2' },
                          { id: 'inv-7', name: 'Patch Cord SC-PC 3m' }
                        ].map(part => {
                          const existing = reportForm.partsUsed.find(p => p.partId === part.id);
                          return (
                            <div key={part.id} className="flex justify-between items-center bg-[#0d1324] p-2 border border-brand-border/40 rounded-lg text-[11px]">
                              <span className="text-brand-text-secondary">{part.name}</span>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (existing) {
                                      const nextQty = existing.quantity - 1;
                                      if (nextQty <= 0) {
                                        setReportForm({ ...reportForm, partsUsed: reportForm.partsUsed.filter(p => p.partId !== part.id) });
                                      } else {
                                        setReportForm({ ...reportForm, partsUsed: reportForm.partsUsed.map(p => p.partId === part.id ? { ...p, quantity: nextQty } : p) });
                                      }
                                    }
                                  }}
                                  className="w-5 h-5 rounded-full bg-brand-card border border-brand-border text-white text-xs"
                                >-</button>
                                <span className="font-bold text-white w-4 text-center">{existing ? existing.quantity : 0}</span>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (existing) {
                                      setReportForm({ ...reportForm, partsUsed: reportForm.partsUsed.map(p => p.partId === part.id ? { ...p, quantity: p.quantity + 1 } : p) });
                                    } else {
                                      setReportForm({ ...reportForm, partsUsed: [...reportForm.partsUsed, { partId: part.id, partName: part.name, quantity: 1 }] });
                                    }
                                  }}
                                  className="w-5 h-5 rounded-full bg-brand-card border border-brand-border text-white text-xs"
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Speed Test inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-text-secondary font-mono mb-1">Shpejtësia para riparimit</label>
                        <input 
                          type="text" 
                          value={reportForm.beforeSpeed}
                          onChange={(e) => setReportForm({ ...reportForm, beforeSpeed: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-brand-text-secondary font-mono mb-1">Shpejtësia mbas riparimit</label>
                        <input 
                          type="text" 
                          value={reportForm.afterSpeed}
                          onChange={(e) => setReportForm({ ...reportForm, afterSpeed: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Resolution Notes */}
                    <div>
                      <label className="block text-brand-text-secondary font-mono mb-1">Shënimet e detajuara të ndërhyrjes</label>
                      <textarea 
                        rows={3}
                        required
                        value={reportForm.resolutionNotes}
                        onChange={(e) => setReportForm({ ...reportForm, resolutionNotes: e.target.value })}
                        placeholder="Çfarë provuat, si u rregulluan vlerat..."
                        className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white"
                      />
                    </div>

                    {/* Customer signature pad using Canvas */}
                    <div className="border border-brand-border rounded-xl overflow-hidden bg-brand-bg">
                      <div className="bg-brand-card p-2 border-b border-brand-border flex justify-between items-center">
                        <span className="text-[10px] font-mono text-brand-text-secondary">Signature e Klientit (Nënshkrimi)</span>
                        <button type="button" onClick={clearCanvas} className="text-[10px] text-brand-accent-red">Pastro</button>
                      </div>
                      <canvas 
                        ref={canvasRef}
                        width={350}
                        height={100}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-24 bg-white/5 cursor-crosshair touch-none"
                      />
                    </div>

                    {/* Dummy Camera Upload */}
                    <div>
                      <button 
                        type="button" 
                        onClick={() => alert("Kamera u hap! Fotoja u bashkëngjit si 'evidence_photo.jpg'.")}
                        className="w-full py-2 border border-dashed border-brand-border rounded-xl text-xs font-mono text-brand-text-secondary hover:text-white hover:bg-brand-card-hover flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4 text-brand-accent-amber" />
                        SHTO FOTO TERRENI (Deri në 5 foto)
                      </button>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-brand-accent-green hover:opacity-95 text-brand-bg rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      DËRGO RAPORTIN & MBYLL DETYRËN
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: AI IN-FIELD GUIDE ASSISTANT */}
        {activeTab === 'assistant' && (
          <div className="space-y-4">
            <div className="p-4 bg-brand-card border border-brand-border rounded-2xl space-y-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Udhëzuesi i Terrenit DigiNet AI
              </h3>
              <p className="text-[11px] text-brand-text-secondary leading-normal">
                Ndani pyetje mbi GPON, vlerat Rx (dBm), komandat e MikroTik RouterOS të klientit, ose problemet e IPTV.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="p.sh. LOS e kuqe te Huawei..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-brand-text-muted focus:outline-none focus:border-brand-accent-green"
                />
                <button 
                  onClick={handleTriggerAI}
                  disabled={assistantLoading}
                  className="p-2.5 bg-brand-accent-green hover:opacity-95 text-brand-bg rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {assistantLoading ? (
                <div className="p-4 bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center gap-1">
                  <div className="w-5 h-5 border-2 border-brand-accent-green border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-brand-text-muted font-mono uppercase mt-1">Po konsultohem me sistemin...</span>
                </div>
              ) : assistantResponse ? (
                <div className="p-4 bg-brand-card border border-indigo-500/10 rounded-2xl prose prose-invert font-sans text-xs text-brand-text-secondary whitespace-pre-wrap leading-relaxed">
                  {assistantResponse}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-brand-border/40 rounded-2xl text-center text-[10px] font-mono text-brand-text-muted py-16">
                  Nuk ka bisedë aktive. Shkruani problemin më lart dhe pyetni AI.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PARTS REQUESTS WORKSPACE */}
        {activeTab === 'parts' && (
          <div className="space-y-4">
            <form onSubmit={handlePartsRequest} className="p-4 bg-brand-card border border-brand-border rounded-2xl space-y-4">
              <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-brand-border/40 pb-2">Kërko Pjese / Routera</h3>
              
              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-brand-text-secondary font-mono mb-1">Emri i Pajisjes / Kabllit</label>
                  <input 
                    type="text" 
                    required
                    value={partRequest.name}
                    onChange={(e) => setPartRequest({ ...partRequest, name: e.target.value })}
                    placeholder="p.sh. ONT Huawei HG8245H"
                    className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brand-text-secondary font-mono mb-1">Sasia</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      value={partRequest.qty}
                      onChange={(e) => setPartRequest({ ...partRequest, qty: parseInt(e.target.value) || 1 })}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-brand-text-secondary font-mono mb-1">Urgjenca</label>
                    <select 
                      value={partRequest.urgency}
                      onChange={(e) => setPartRequest({ ...partRequest, urgency: e.target.value as any })}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-white font-mono"
                    >
                      <option value="normal">Normale</option>
                      <option value="high">Kritike / Urgjet</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-brand-accent-green hover:opacity-95 text-brand-bg rounded-xl font-bold font-sans"
                >
                  DËRGO KËRKESËN SOT
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <h4 className="text-[10px] font-mono text-brand-text-secondary uppercase">Kërkesat e mia (Historiku)</h4>
              {partsRequests.filter(r => r.techId === activeTechId).map(req => (
                <div key={req.id} className="p-3 bg-brand-card border border-brand-border rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-white">{req.partName}</p>
                    <p className="text-[10px] text-brand-text-secondary font-mono mt-0.5">Sasia: {req.quantity} • {new Date(req.createdAt).toLocaleDateString('sq')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono capitalize ${
                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PERSONAL STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
              <Award className="w-12 h-12 text-brand-accent-amber animate-pulse" />
              <h3 className="text-sm font-semibold text-white">Çlirim Rama</h3>
              <p className="text-xs text-brand-text-secondary font-mono">ID: TECH-3 • ZONE 3 (DON BOSKO)</p>
              
              <div className="flex gap-2 font-mono text-[11px] pt-3 w-full">
                <div className="flex-1 bg-[#0d1324] border border-brand-border p-2.5 rounded-xl">
                  <p className="text-brand-text-muted uppercase text-[9px]">Vlersimi</p>
                  <p className="text-sm font-bold text-brand-accent-amber mt-1">{techsRating() || '5.0'} ★</p>
                </div>
                <div className="flex-1 bg-[#0d1324] border border-brand-border p-2.5 rounded-xl">
                  <p className="text-brand-text-muted uppercase text-[9px]">Të Mbyllura</p>
                  <p className="text-sm font-bold text-white mt-1">{jobsDoneThisWeek}</p>
                </div>
              </div>
            </div>

            {/* Work log guidelines */}
            <div className="p-4 bg-brand-card border border-brand-border rounded-2xl space-y-2">
              <h4 className="text-xs font-mono font-bold text-white uppercase">Mjetet e sigurisë në terren</h4>
              <p className="text-[11px] text-brand-text-secondary leading-normal">
                Gjatë saldimeve optike mbani gjithmonë syzet mbrojtëse dhe pastroni mbetjet e fijeve optike sipas rregullit kombëtar të pastërtisë ISP.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation Tab Bar (mobile style only) */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-brand-card border-t border-brand-border flex justify-around items-center z-30">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${activeTab === 'jobs' ? 'text-brand-accent-green' : 'text-brand-text-secondary hover:text-white'}`}
        >
          <Wrench className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-mono font-bold uppercase">Detyrat</span>
        </button>

        <button 
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${activeTab === 'assistant' ? 'text-brand-accent-green' : 'text-brand-text-secondary hover:text-white'}`}
        >
          <Sparkles className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-mono font-bold uppercase">Guide AI</span>
        </button>

        <button 
          onClick={() => setActiveTab('parts')}
          className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${activeTab === 'parts' ? 'text-brand-accent-green' : 'text-brand-text-secondary hover:text-white'}`}
        >
          <ListPlus className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-mono font-bold uppercase">Asete</span>
        </button>

        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${activeTab === 'stats' ? 'text-brand-accent-green' : 'text-brand-text-secondary hover:text-white'}`}
        >
          <BarChart2 className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-mono font-bold uppercase">Efiçenca</span>
        </button>
      </nav>

    </div>
  );

  function techsRating () {
    return ratingAverage;
  }
};
