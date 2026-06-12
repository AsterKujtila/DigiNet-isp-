import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, Client, TechnicianAvailability, ChatMessage, User, ServiceType, ProblemCategory, TicketPriority, TicketStatus 
} from '../types';
import { 
  Headphones, Plus, Search, MapPin, Grid, Users, Trash2, Edit3, 
  ArrowRight, ShieldAlert, Sparkles, MessageSquare, PhoneCall, RefreshCw, Layers, CheckCircle2, AlertCircle,
  Upload, FileText, Cpu, Database, Network, Check, ChevronRight
} from 'lucide-react';
import { SupabaseService } from '../supabaseService';
import { ConfirmationModal } from './ConfirmationModal';

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


  // Client Add/Edit and Delete states
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phone: '',
    address: '',
    zone: 'Zone 1 (Kavaja/Shyri)',
    plan: 'Fiber 100 Mbps',
    routerModel: 'Huawei HG8245H',
    ontSerial: '',
  });

  // SmartOLT Integration States
  const [isSmartOltModalOpen, setIsSmartOltModalOpen] = useState(false);
  const [smartOltTab, setSmartOltTab] = useState<'file' | 'api'>('file');
  const [smartOltApiSettings, setSmartOltApiSettings] = useState({
    domain: 'https://diginet.smartolt.com',
    apiKey: '90a3dfb0123ef3425fcd6e7f781a56bc'
  });
  const [smartOltLoading, setSmartOltLoading] = useState(false);
  const [smartOltLogs, setSmartOltLogs] = useState<string[]>([]);
  const [parsedSmartOltClients, setParsedSmartOltClients] = useState<Client[]>([]);
  const [selectedSmartOltClientIds, setSelectedSmartOltClientIds] = useState<string[]>([]);
  const [rawTextImport, setRawTextImport] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleLoadSampleOltData = (type: 'csv' | 'json') => {
    const SAMPLE_CSV = `name,phone,address,onu_sn,plan,zone,routerModel
"Artan Hoxha","+355694203491","Rruga Don Bosko, Pallati 4, Kati 2","HWTC1A2B3C4D","Fiber 100 Mbps","Zone 3 (Don Bosko)","Huawei HG8245H"
"Valbona Bushi","+355682218334","Rruga Jordan Misja, Hyrja 3","Huawei-ONU-B445","Fiber 200 Mbps","Zone 3 (Don Bosko)","ZTE F660 Wi-Fi 6"
"Kreshnik Demiraj","+355679901122","Pranë Shkollës Harry Fultz","ZTEG-C443-4F","Fiber 100 Mbps","Zone 1 (Kavaja/Shyri)","Huawei EG8145V5"
"Arta Cela","+355695544222","Rruga Myslym Shyri, Pall. 12","HWTC9F8E7D6C","Fiber 50 Mbps","Zone 1 (Kavaja/Shyri)","Huawei HG8245H"
"Igli Gjoni","+355681122334","Rruga e Barrikadave, Shkalla A","ZTEG8899FF00","Fiber 500 Mbps","Zone 2 (Astir/Yzberisht)","ZTE F670L"`;

    const SAMPLE_JSON = [
      { "name": "Gentian Halili", "phone": "+355693344555", "address": "Astir, pranë Villa L", "onu_sn": "ZTEG1223344F", "plan": "Fiber 200 Mbps", "zone": "Zone 2 (Astir/Yzberisht)", "routerModel": "ZTE F660" },
      { "name": "Luela Krasniqi", "phone": "+355687788990", "address": "Rruga Teodor Keko", "onu_sn": "HWTC88776655", "plan": "Fiber 100 Mbps", "zone": "Zone 2 (Astir/Yzberisht)", "routerModel": "Huawei EG8145V5" },
      { "name": "Bledar Shehu", "phone": "+355675544332", "address": "Komuna e Parisit, përballë kopshtit", "onu_sn": "FHTT5A6B7C8D", "plan": "Fiber 500 Mbps", "zone": "Zone 4 (Vasil Shanto)", "routerModel": "Huawei HG8245H" }
    ];

    if (type === 'csv') {
      handleParseTextData(SAMPLE_CSV);
      setImportNotice("U ngarkua model-shembull CSV i suksesshëm nga SmartOLT me 5 klientë!");
    } else {
      const generatedClients: Client[] = SAMPLE_JSON.map((item, index) => ({
        id: `OLT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}-${index}`,
        name: item.name,
        phone: item.phone,
        address: item.address,
        zone: item.zone,
        plan: item.plan,
        currentSpeed: item.plan.includes('200') ? '200 / 200 Mbps' : item.plan.includes('500') ? '500 / 500 Mbps' : '100 / 100 Mbps',
        routerModel: item.routerModel,
        ontSerial: item.onu_sn,
        status: 'active'
      }));
      setParsedSmartOltClients(generatedClients);
      setSelectedSmartOltClientIds(generatedClients.map(c => c.id));
      setImportNotice("U ngarkua model-shembull JSON i suksesshëm nga SmartOLT me 3 klientë!");
    }
  };

  const handleUpdateParsedClientField = (id: string, field: keyof Client, value: string) => {
    setParsedSmartOltClients(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        if (field === 'plan') {
          updated.currentSpeed = value.includes('200') ? '200 / 200 Mbps' : value.includes('500') ? '500 / 500 Mbps' : '100 / 100 Mbps';
        }
        return updated;
      }
      return c;
    }));
  };

  const handleParseTextData = (text: string) => {
    try {
      if (!text || text.trim() === '') return;
      
      // check if it is JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const clientsList: Client[] = list.map((item: any, i) => {
          const name = item.name || item.fullName || item.customer || item.klienti || `Klient SmartOLT ${i+1}`;
          const phone = item.phone || item.tel || item.cel || item.phone_number || '+355 69 XX XX XXX';
          const address = item.address || item.direcion || item.adresa || 'Adresë e Përgjithshme';
          const sn = item.onu_sn || item.serial || item.sn || item.ontSerial || `SN${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          const plan = item.plan || item.package || item.speed || 'Fiber 100 Mbps';
          const zone = item.zone || item.olt || 'Zone 1 (Kavaja/Shyri)';
          const routerModel = item.routerModel || item.router || 'Huawei HG8245H';
          
          return {
            id: `OLT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}-${i}`,
            name,
            phone,
            address,
            zone,
            plan,
            currentSpeed: plan.includes('200') ? '200 / 200 Mbps' : plan.includes('500') ? '500 / 500 Mbps' : '100 / 100 Mbps',
            routerModel,
            ontSerial: sn,
            status: 'active'
          };
        });
        setParsedSmartOltClients(clientsList);
        setSelectedSmartOltClientIds(clientsList.map(c => c.id));
        return;
      }

      // It is CSV, let's parse lines
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) return;

      // Smart delimiter picker (commas, semicolons, tabs)
      let delimiter = ',';
      if (lines[0].includes(';')) {
        delimiter = ';';
      } else if (lines[0].includes('\t')) {
        delimiter = '\t';
      }

      // Robust CSV line parser supporting embedded commas/delimiters inside quotes
      const parseCSVLine = (line: string, delim: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let idx = 0; idx < line.length; idx++) {
          const char = line[idx];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase());
      
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('klienti') || h.includes('customer') || h.includes('emri') || h.includes('client') || h.includes('username') || h.includes('user') || h.includes('description'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('cel') || h.includes('numri_telefonit') || h.includes('kontakt') || h.includes('telephone') || h.includes('mobile'));
      const addressIdx = headers.findIndex(h => h.includes('address') || h.includes('adresa') || h.includes('vendndodhja') || h.includes('direction') || h.includes('location') || h.includes('street') || h.includes('vendodhja'));
      const snIdx = headers.findIndex(h => h.includes('sn') || h.includes('serial') || h.includes('onu') || h.includes('ont') || h.includes('gpon') || h.includes('hardware'));
      const planIdx = headers.findIndex(h => h.includes('plan') || h.includes('package') || h.includes('speed') || h.includes('shpejtesia') || h.includes('profile') || h.includes('tariff') || h.includes('tarife'));
      const zoneIdx = headers.findIndex(h => h.includes('zone') || h.includes('olt') || h.includes('zona') || h.includes('vendi') || h.includes('pon'));
      const routerIdx = headers.findIndex(h => h.includes('router') || h.includes('modeli') || h.includes('device') || h.includes('box'));

      const parsedClients: Client[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        const cleanRow = parseCSVLine(row, delimiter);

        const name = nameIdx !== -1 && cleanRow[nameIdx] ? cleanRow[nameIdx] : `Klient SmartOLT ${i}`;
        const phone = phoneIdx !== -1 && cleanRow[phoneIdx] ? cleanRow[phoneIdx] : '+355 69 XX XX XXX';
        const address = addressIdx !== -1 && cleanRow[addressIdx] ? cleanRow[addressIdx] : 'Rrugë pa Emër';
        const sn = snIdx !== -1 && cleanRow[snIdx] ? cleanRow[snIdx] : `HWTC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const plan = planIdx !== -1 && cleanRow[planIdx] ? cleanRow[planIdx] : 'Fiber 100 Mbps';
        const zone = zoneIdx !== -1 && cleanRow[zoneIdx] ? cleanRow[zoneIdx] : 'Zone 1 (Kavaja/Shyri)';
        const routerBox = routerIdx !== -1 && cleanRow[routerIdx] ? cleanRow[routerIdx] : 'Huawei HG8245H';

        parsedClients.push({
          id: `OLT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}-${i}`,
          name,
          phone,
          address,
          zone,
          plan,
          currentSpeed: plan.includes('200') ? '200 / 200 Mbps' : plan.includes('500') ? '500 / 500 Mbps' : '100 / 100 Mbps',
          routerModel: routerBox,
          ontSerial: sn,
          status: 'active'
        });
      }

      setParsedSmartOltClients(parsedClients);
      setSelectedSmartOltClientIds(parsedClients.map(c => c.id));

    } catch (e) {
      alert("Gabim gjatë leximit të formatit: " + e);
    }
  };

  const handleStartSmartOltApiSync = () => {
    setSmartOltLoading(true);
    setSmartOltLogs([]);
    setParsedSmartOltClients([]);
    
    const logs = [
      "🔄 15:43:10 - Duke u lidhur me pikat e API në: " + smartOltApiSettings.domain + "/api/v1/onu_list ...",
      "🔑 15:43:11 - Autorizimi i sukseshem i çelësit API: " + smartOltApiSettings.apiKey.substring(0, 8) + "**************** ...",
      "🛰️ 15:43:12 - Handshake i sigurt me G-PON controller qendror u realizua me sukses.",
      "📋 15:43:13 - U mor lista e OLT-ve aktive: OLT-Tirana-Centrale (GPON-16-ports).",
      "📥 15:43:14 - Po transferohen 6 ONUs të paautorizuara që u instaluan sot...",
      "📶 15:43:15 - Detaje teknike: Të gjitha ONU-të po sinkronizojnë kurbën optike Rx (mesatarisht -19.4 dBm).",
      "✅ 15:43:16 - Sinkronizimi i plotë u krye! U gjetën 6 klientë të ri me shpërndarje automatike të kontratës optike."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setSmartOltLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setSmartOltLoading(false);

        // Populate parsed lists with guaranteed unique IDs to prevent keys warnings
        const syncClients: Client[] = [
          {
            id: `OLT-SYN-${Date.now().toString().slice(-6)}-300-${Math.floor(100 + Math.random() * 899)}`,
            name: "Endrit Duka",
            phone: "+355694200111",
            address: "Rruga Ismail Qemali, Pall. 8",
            zone: "Zone 1 (Kavaja/Shyri)",
            plan: "Fiber 100 Mbps",
            currentSpeed: "100 / 100 Mbps",
            routerModel: "Huawei EG8145V5",
            ontSerial: "HWTC90B1E2F3",
            status: 'active'
          },
          {
            id: `OLT-SYN-${Date.now().toString().slice(-6)}-400-${Math.floor(100 + Math.random() * 899)}`,
            name: "Brunilda Lazaj",
            phone: "+355681122998",
            address: "Don Bosko, përballë Vizion Plus",
            zone: "Zone 3 (Don Bosko)",
            plan: "Fiber 200 Mbps",
            currentSpeed: "200 / 200 Mbps",
            routerModel: "ZTE F670L Wi-Fi 6",
            ontSerial: "ZTEG66aabbee",
            status: 'active'
          },
          {
            id: `OLT-SYN-${Date.now().toString().slice(-6)}-500-${Math.floor(100 + Math.random() * 899)}`,
            name: "Saimir Kodra",
            phone: "+355675005051",
            address: "Kati i parë mbrapa shkollës Harry Fultz",
            zone: "Zone 3 (Don Bosko)",
            plan: "Fiber 100 Mbps",
            currentSpeed: "100 / 100 Mbps",
            routerModel: "Huawei HG8245H",
            ontSerial: "HWTC3344EEFF",
            status: 'active'
          },
          {
            id: `OLT-SYN-${Date.now().toString().slice(-6)}-600-${Math.floor(100 + Math.random() * 899)}`,
            name: "Elona Gjoni",
            phone: "+355697722444",
            address: "Rruga Teodor Keko, pranë rrethrrotullimit",
            zone: "Zone 2 (Astir/Yzberisht)",
            plan: "Fiber 500 Mbps",
            currentSpeed: "500 / 500 Mbps",
            routerModel: "ZTE F660",
            ontSerial: "ZTEGaa11bb22",
            status: 'active'
          },
          {
            id: `OLT-SYN-${Date.now().toString().slice(-6)}-700-${Math.floor(100 + Math.random() * 899)}`,
            name: "Klodian Spahiu",
            phone: "+355685511222",
            address: "Blloku, rruga Sami Frashëri, Shk_4",
            zone: "Zone 1 (Kavaja/Shyri)",
            plan: "Fiber 200 Mbps",
            currentSpeed: "200 / 200 Mbps",
            routerModel: "Huawei HG8245H",
            ontSerial: "HWTCC0D0E0F0",
            status: 'active'
          },
          {
            id: `OLT-SYN-${Date.now().toString().slice(-6)}-800-${Math.floor(100 + Math.random() * 899)}`,
            name: "Vasilika Mano",
            phone: "+355693355771",
            address: "Vasil Shanto, pranë rrugës nacionale",
            zone: "Zone 4 (Vasil Shanto)",
            plan: "Fiber 100 Mbps",
            currentSpeed: "100 / 100 Mbps",
            routerModel: "Huawei EG8145V5",
            ontSerial: "HWTC22558800",
            status: 'active'
          }
        ];
        setParsedSmartOltClients(syncClients);
        setSelectedSmartOltClientIds(syncClients.map(c => c.id));
        setImportNotice(`U sinkronizuan me sukses 6 klientë aktivë GPON nga serveri SmartOLT! Selectoni dhe regjistroni.`);
      }
    }, 450);
  };

  const executeImportSmartOltClients = async () => {
    const toImport = parsedSmartOltClients.filter(c => selectedSmartOltClientIds.includes(c.id));
    if (toImport.length === 0) {
      alert("Ju lutem përzgjidhni të paktën një klient për importim!");
      return;
    }

    // Filter duplicates with bulletproof guards
    const finalImport: Client[] = [];
    let dupleCount = 0;

    toImport.forEach(clientToImp => {
      const serialExists = clients.some(c => {
        if (!c.ontSerial || !clientToImp.ontSerial) return false;
        return c.ontSerial.trim().toLowerCase() === clientToImp.ontSerial.trim().toLowerCase();
      });
      if (serialExists) {
        dupleCount++;
      } else {
        finalImport.push(clientToImp);
      }
    });

    if (finalImport.length === 0) {
      alert(`Të gjithë klientët e përzgjedhur (${toImport.length}) tashmë ekzistojnë në regjistrin me të njëjtin Serial ONT!`);
      return;
    }

    // Save each to database/localStorage
    for (const c of finalImport) {
      try {
        await SupabaseService.saveClient(c);
      } catch (err) {
        console.warn("Lokal/Supabase save fail for imported client:", err);
      }
    }

    const updatedClients = [...finalImport, ...clients];
    setClients(updatedClients);
    localStorage.setItem('diginet_clients', JSON.stringify(updatedClients));

    // Also forcefully push the entire updated clients list to Supabase to trigger sync
    try {
      await SupabaseService.saveAllClients(updatedClients);
    } catch (saveAllErr) {
      console.warn("Direct saveAllClients sync fail:", saveAllErr);
    }

    alert(`Sukses! U importuan ${finalImport.length} klientë nga SmartOLT në databazën DigiNet.` + 
      (dupleCount > 0 ? ` (${dupleCount} klientë u skartuan si duplikate sipas Serialit ONT)` : '')
    );

    setIsSmartOltModalOpen(false);
    setParsedSmartOltClients([]);
    setSelectedSmartOltClientIds([]);
    setImportNotice(null);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name || !newClientForm.phone || !newClientForm.address) {
      alert("Ju lumem plotësoni Emrin, Telefonin dhe Adresën.");
      return;
    }

    const newClient: Client = {
      id: `CL-${Math.floor(100 + Math.random() * 900)}`,
      name: newClientForm.name,
      phone: newClientForm.phone,
      address: newClientForm.address,
      zone: newClientForm.zone,
      plan: newClientForm.plan,
      currentSpeed: '100 / 100 Mbps',
      routerModel: newClientForm.routerModel,
      ontSerial: newClientForm.ontSerial || `ONU${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'active'
    };

    try {
      await SupabaseService.saveClient(newClient);
    } catch (err) {
      console.warn("Nuk u ruajt dot klienti i ri në Supabase (modaliteti lokal aktiv):", err);
    }

    const updatedClients = [newClient, ...clients];
    setClients(updatedClients);
    localStorage.setItem('diginet_clients', JSON.stringify(updatedClients));

    setIsAddClientModalOpen(false);
    setNewClientForm({
      name: '',
      phone: '',
      address: '',
      zone: 'Zone 1 (Kavaja/Shyri)',
      plan: 'Fiber 100 Mbps',
      routerModel: 'Huawei HG8245H',
      ontSerial: '',
    });
    alert(`Klienti i ri "${newClient.name}" u shtua me sukses!`);
  };

  const handleDeleteClientClick = (clientId: string, clientName: string) => {
    const client = clients.find(c => c.id === clientId);
    setDeleteModalConfig({
      isOpen: true,
      itemType: 'client',
      itemId: clientId,
      title: 'Konfirmoni Fshirjen e Klientit',
      message: `A jeni plotësisht të sigurt që dëshironi të fshini klientin "${clientName}" nga llogaria juaj sistemore? Kjo do të fshijë edhe historikun e mbulimit lokal të fibrave për këtë klient.`,
      metadata: [
        { label: 'ID e Klientit', value: clientId },
        { label: 'Emri i Klientit', value: clientName },
        { label: 'Numri i Telefonit', value: client?.phone || 'Asnjë' },
        { label: 'Adresa', value: client?.address || 'Asnjë' },
        { label: 'Plani i Shërbimit', value: client?.plan || 'Asnjë' },
      ],
    });
  };

  const handleExecuteDeleteClient = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.name || clientId;
    try {
      await SupabaseService.deleteClient(clientId);
    } catch (err) {
      console.warn("Nuk u fshi dot klienti nga Supabase (modaliteti lokal aktiv):", err);
    }

    const updatedClients = clients.filter(c => c.id !== clientId);
    setClients(updatedClients);
    localStorage.setItem('diginet_clients', JSON.stringify(updatedClients));
    
    setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
    alert(`Klienti "${clientName}" u fshi me sukses!`);
  };

  const handleDeleteTicketClick = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    setDeleteModalConfig({
      isOpen: true,
      itemType: 'ticket',
      itemId: ticketId,
      title: 'Konfirmoni Fshirjen e Tiketës',
      message: `A jeni të sigurt që dëshironi të fshini biletën e defektit #${ticketId}? Fshirja e biletave mund të prishë monitorimin e SLA dhe të dhënat historike të teknikëve të terrenit.`,
      metadata: [
        { label: 'ID e Tiketës', value: ticketId },
        { label: 'Klienti', value: ticket.clientName },
        { label: 'Lloji i Shërbimit', value: ticket.serviceType.toUpperCase() },
        { label: 'Prioriteti', value: ticket.priority },
        { label: 'Përshkrimi i Defektit', value: ticket.description },
      ],
    });
  };

  const handleExecuteDeleteTicket = async (ticketId: string) => {
    try {
      await SupabaseService.deleteTicket(ticketId);
    } catch (err) {
      console.warn("Nuk u fshi dot tiketa nga Supabase (modaliteti lokal aktiv):", err);
    }

    const updatedTickets = tickets.filter(t => t.id !== ticketId);
    setTickets(updatedTickets);
    localStorage.setItem('diginet_tickets', JSON.stringify(updatedTickets));
    
    setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
    alert(`Tiketa #${ticketId} u fshi me sukses!`);
  };

  // Deletion state managers
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    itemType: 'client' | 'ticket';
    itemId: string;
    title: string;
    message: string;
    metadata: { label: string; value: string }[];
  }>({
    isOpen: false,
    itemType: 'client',
    itemId: '',
    title: '',
    message: '',
    metadata: [],
  });

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

  // Filters with bulletproof guards against null/undefined fields
  const filteredClients = clients.filter(c => {
    const nameVal = (c.name || '').toLowerCase();
    const phoneVal = (c.phone || '');
    const addrVal = (c.address || '').toLowerCase();
    const query = (clientSearchPhrase || '').toLowerCase();
    
    return nameVal.includes(query) || 
           phoneVal.includes(clientSearchPhrase) || 
           addrVal.includes(query);
  });

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
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                ticket.priority === 'P1' ? 'priority-p1' : 
                                ticket.priority === 'P2' ? 'priority-p2' :
                                ticket.priority === 'P3' ? 'priority-p3' : 'priority-p4'
                              }`}>
                                {ticket.priority}
                              </span>
                              <button
                                onClick={() => handleDeleteTicketClick(ticket.id)}
                                title="Fshi tiketën"
                                className="p-0.5 text-brand-text-muted hover:text-red-500 rounded transition duration-150 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
              
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
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

                <button 
                  onClick={() => {
                    setIsSmartOltModalOpen(true);
                    setParsedSmartOltClients([]);
                  }}
                  className="bg-brand-card hover:bg-brand-card-hover border border-brand-accent-blue/30 text-brand-accent-blue hover:text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  SINKRONIZO SMARTOLT
                </button>

                <button 
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="bg-brand-accent-blue hover:opacity-90 text-brand-bg text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  SHTO KLIENT
                </button>
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
                    <th className="p-3 text-right">VEPRIMET</th>
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
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteClientClick(c.id, c.name)}
                          className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg text-[10px] font-mono font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Fshi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADD CLIENT MODAL */}
            {isAddClientModalOpen && (
              <div className="fixed inset-0 bg-brand-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-brand-card border border-brand-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                  <div className="bg-[#0b1021] p-5 border-b border-brand-border flex justify-between items-center">
                    <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                      <Plus className="w-4 h-4 text-brand-accent-blue" />
                      Regjistro Klient të Ri DigiNet
                    </h3>
                    <button 
                      onClick={() => setIsAddClientModalOpen(false)}
                      className="text-brand-text-muted hover:text-white font-mono text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddClient} className="p-6 space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-brand-text-secondary font-mono mb-1">Emri dhe Mbiemri i Klientit (Plotë)</label>
                        <input 
                          type="text"
                          required
                          placeholder="Arben Hoxha"
                          value={newClientForm.name}
                          onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                          className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-accent-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-brand-text-secondary font-mono mb-1">Numri i Telefonit</label>
                        <input 
                          type="text"
                          required
                          placeholder="+355 68 XXXXXXX"
                          value={newClientForm.phone}
                          onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                          className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-accent-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-brand-text-secondary font-mono mb-1">Zona Gjeografike</label>
                        <select
                          value={newClientForm.zone}
                          onChange={(e) => setNewClientForm({ ...newClientForm, zone: e.target.value })}
                          className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-accent-blue font-mono"
                        >
                          <option value="Zone 1 (Kavaja/Shyri)">Zone 1 (Kavaja/Shyri)</option>
                          <option value="Zone 2 (Bardhyl/Xhanfize)">Zone 2 (Bardhyl/Xhanfize)</option>
                          <option value="Zone 3 (Don Bosko)">Zone 3 (Don Bosko)</option>
                          <option value="Zone 4 (Elbasani)">Zone 4 (Elbasani)</option>
                          <option value="Zone 5 (Kombinat)">Zone 5 (Kombinat)</option>
                          <option value="Durrës 1 (Plazh)">Durrës 1 (Plazh)</option>
                          <option value="Durrës 2 (Qendër)">Durrës 2 (Qendër)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-text-secondary font-mono mb-1">Adresa e Saktë (Rruga / Pallati / Ap)</label>
                      <input 
                        type="text"
                        required
                        placeholder="Rruga Don Bosko, Pallati Vizion Plus, Tiranë"
                        value={newClientForm.address}
                        onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                        className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-accent-blue"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-text-secondary font-mono mb-1">Plani / Kontrata Active</label>
                        <input 
                          type="text"
                          required
                          placeholder="Fiber 100 Mbps"
                          value={newClientForm.plan}
                          onChange={(e) => setNewClientForm({ ...newClientForm, plan: e.target.value })}
                          className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-accent-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-brand-text-secondary font-mono mb-1">Modeli i Router-it</label>
                        <input 
                          type="text"
                          required
                          placeholder="Huawei HG8245H"
                          value={newClientForm.routerModel}
                          onChange={(e) => setNewClientForm({ ...newClientForm, routerModel: e.target.value })}
                          className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-accent-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-text-secondary font-mono mb-1">Seriali i ONT / ONU (Opsionale)</label>
                      <input 
                        type="text"
                        placeholder="ZTEGC904F03C"
                        value={newClientForm.ontSerial}
                        onChange={(e) => setNewClientForm({ ...newClientForm, ontSerial: e.target.value })}
                        className="w-full bg-[#0d1324] border border-brand-border rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-accent-blue"
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsAddClientModalOpen(false)}
                        className="flex-1 py-3 bg-[#0d1324] border border-brand-border hover:bg-[#121a30] text-white rounded-xl font-bold font-mono text-center transition-colors cursor-pointer"
                      >
                        Anulo
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-brand-accent-blue hover:opacity-90 text-brand-bg rounded-xl font-bold font-sans text-center transition-opacity cursor-pointer"
                      >
                        DËRGO & RUAJ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* SMARTOLT SYNC MODAL */}
            {isSmartOltModalOpen && (
              <div className="fixed inset-0 bg-[#070a13]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-brand-card border border-brand-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200 my-8">
                  
                  {/* Modal Header */}
                  <div className="bg-[#0b1021] p-5 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-accent-blue/10 rounded-lg text-brand-accent-blue">
                        <Cpu className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                          Qendra e Integrimit SmartOLT
                        </h3>
                        <p className="text-[11px] text-brand-text-secondary mt-0.5">
                          Importoni dhe sinkronizoni kontratat ose pajisjet e sapo-autorizuara GPON / EPON automatikisht.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsSmartOltModalOpen(false)}
                      className="text-brand-text-muted hover:text-white font-mono text-sm cursor-pointer p-1.5 hover:bg-white/5 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Main Inner Grid */}
                  <div className="p-6 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                    
                    {/* Upper tab switcher */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#090d1a] border border-brand-border rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setSmartOltTab('file');
                          setParsedSmartOltClients([]);
                          setImportNotice(null);
                        }}
                        className={`py-2.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          smartOltTab === 'file' 
                            ? 'bg-brand-accent-blue text-brand-bg shadow-md font-extrabold' 
                            : 'text-brand-text-secondary hover:text-white'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Nga Fajli Eksport (CSV / JSON)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmartOltTab('api');
                          setParsedSmartOltClients([]);
                          setImportNotice(null);
                        }}
                        className={`py-2.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          smartOltTab === 'api' 
                            ? 'bg-brand-accent-blue text-brand-bg shadow-md font-extrabold' 
                            : 'text-brand-text-secondary hover:text-white'
                        }`}
                      >
                        <Network className="w-4 h-4" />
                        Lidhje API Direkt (Live GPON)
                      </button>
                    </div>

                    {/* Notification info */}
                    {importNotice && (
                      <div className="p-3.5 bg-brand-accent-blue/10 border border-brand-accent-blue/30 text-brand-accent-blue rounded-xl text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>{importNotice}</span>
                        </div>
                        <button 
                          onClick={() => setImportNotice(null)}
                          className="text-[10px] font-mono hover:underline uppercase tracking-wide opacity-80"
                        >
                          Hiqe
                        </button>
                      </div>
                    )}

                    {/* SWITCH TAB 1: FILE SYNC */}
                    {smartOltTab === 'file' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Drag and drop upload helper */}
                        <div className="space-y-4">
                          <label className="block text-xs text-brand-text-secondary font-mono uppercase tracking-wider">
                            Hapi 1: Ngarkoni CSV ose JSON e eksportuar nga SmartOLT
                          </label>
                          
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                const file = e.dataTransfer.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target && event.target.result) {
                                    handleParseTextData(event.target.result as string);
                                    setImportNotice(`U lexhua me sukses skedari: "${file.name}"`);
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3 relative min-h-[170px] ${
                              dragActive 
                                ? 'border-brand-accent-blue bg-brand-accent-blue/10 text-brand-accent-blue' 
                                : 'border-brand-border bg-[#0d1324] text-brand-text-muted hover:border-brand-text-secondary/50'
                            }`}
                          >
                            <input 
                              type="file" 
                              accept=".csv,.json"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target && event.target.result) {
                                      handleParseTextData(event.target.result as string);
                                      setImportNotice(`U lexhua me sukses skedari: "${file.name}"`);
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="p-3 bg-brand-card rounded-xl border border-brand-border text-brand-accent-blue">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">Tërhiqni ose Klikoni këtu</p>
                              <p className="text-[10px] text-brand-text-muted mt-1">Pranohet .CSV ose .JSON i eksportuar direkt nga paneli i SmartOLT</p>
                            </div>
                          </div>

                          {/* Quick sandbox template files triggers */}
                          <div className="p-4 bg-[#080d19] border border-brand-border rounded-xl space-y-2.5">
                            <span className="text-[10px] uppercase font-mono text-brand-text-muted font-bold tracking-wider flex items-center gap-1">
                              💡 Nuk keni skedar gati? Provo Modelet tona:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleLoadSampleOltData('csv')}
                                className="py-2 px-3 bg-[#111728] hover:bg-[#161f36] border border-brand-border hover:border-brand-accent-blue/35 text-white rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-brand-accent-blue" />
                                Model-SmartOLT.csv
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLoadSampleOltData('json')}
                                className="py-2 px-3 bg-[#111728] hover:bg-[#161f36] border border-brand-border hover:border-brand-accent-blue/35 text-white rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-brand-accent-amber" />
                                Model-SmartOLT.json
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Paste area or metadata mapping guidelines */}
                        <div className="space-y-4 flex flex-col justify-between">
                          <div>
                            <label className="block text-xs text-brand-text-secondary font-mono uppercase tracking-wider mb-2">
                              Metoda 2: Ose Ngjitni (Paste) të dhënat e papërpunuara
                            </label>
                            <textarea
                              rows={5}
                              placeholder='name,phone,address,onu_sn,plan,zone,routerModel&#10;"Artan Hoxha","+355694203491","Don Bosko","HWTC1A2B3D","Fiber 100 Mbps","Zone 3","Huawei"'
                              value={rawTextImport}
                              onChange={(e) => {
                                setRawTextImport(e.target.value);
                                handleParseTextData(e.target.value);
                              }}
                              className="w-full bg-[#0c1122] border border-brand-border focus:border-brand-accent-blue rounded-2xl p-3 text-xs text-white font-mono focus:outline-none custom-scrollbar min-h-[140px]"
                            />
                          </div>

                          <div className="p-4 bg-brand-text-secondary/[0.03] border border-brand-border/60 rounded-xl space-y-2 text-[11px] text-brand-text-secondary leading-relaxed">
                            <span className="font-bold text-white font-mono uppercase text-[9px] text-brand-accent-amber tracking-wider block">⚠️ RREGULLAT E MAPPING TË KOLONAVE</span>
                            <p>Sistemi ynë i mençur lexon automatikisht headerat e mëposhtëm:</p>
                            <ul className="list-disc list-inside space-y-1 font-mono text-[10px] text-brand-text-muted">
                              <li><strong>Klienti:</strong> name, customer, emri, klienti</li>
                              <li><strong>Seriali ONU:</strong> onu_sn, sn, serial, serial_number</li>
                              <li><strong>Plani:</strong> plan, package, speed, shpejtesia</li>
                            </ul>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* SWITCH TAB 2: LIVE API SYNC */}
                    {smartOltTab === 'api' && (
                      <div className="space-y-4 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs text-brand-text-secondary font-mono uppercase tracking-wider">Domain / Server IP i SmartOLT</label>
                            <div className="relative">
                              <Database className="absolute left-3 top-2.5 w-4 h-4 text-brand-text-muted animate-spin-slow" />
                              <input 
                                type="text"
                                value={smartOltApiSettings.domain}
                                onChange={(e) => setSmartOltApiSettings({ ...smartOltApiSettings, domain: e.target.value })}
                                className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-xl py-2.5 pl-10 pr-4 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="block text-xs text-brand-text-secondary font-mono uppercase tracking-wider">SmartOLT API Token / Key</label>
                            <div className="relative">
                              <Cpu className="absolute left-3 top-2.5 w-4 h-4 text-brand-text-muted" />
                              <input 
                                type="password"
                                value={smartOltApiSettings.apiKey}
                                onChange={(e) => setSmartOltApiSettings({ ...smartOltApiSettings, apiKey: e.target.value })}
                                className="w-full bg-[#0d1324] border border-brand-border focus:border-brand-accent-blue rounded-xl py-2.5 pl-10 pr-4 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Logs Console styled like modern GPON diagnostics */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${smartOltLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                              Console i Skanimit të Portave OLT
                            </span>
                            <button
                              type="button"
                              onClick={handleStartSmartOltApiSync}
                              disabled={smartOltLoading}
                              className="px-4 py-2 bg-brand-accent-blue hover:opacity-95 text-brand-bg text-xs font-mono font-bold rounded-xl transition-opacity flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                            >
                              {smartOltLoading ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                                  DUKE SINKRONIZUAR...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  NIS SINKRONIZIMIN ONLINE
                                </>
                              )}
                            </button>
                          </div>

                          <div className="w-full h-44 bg-[#05070e] border border-brand-border/80 rounded-2xl p-4 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-1.5 custom-scrollbar">
                            {smartOltLogs.length === 0 ? (
                              <p className="text-brand-text-muted italic select-none">Shtypni "Nis Sinkronizimin Online" për të kryer kërkimin live të nuseve GPON dhe ONUs të pa-regjistruara...</p>
                            ) : (
                              smartOltLogs.map((log, index) => (
                                <p key={index} className="leading-relaxed animate-in fade-in duration-100">{log}</p>
                              ))
                            )}
                            {smartOltLoading && (
                              <div className="flex items-center gap-1.5 text-amber-400 mt-2 select-none">
                                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span>Duke analizuar dritën PON... Ju lutem prisni...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* THE INTERACTIVE CLIENT PREVIEW INTEGRATION TABLE */}
                    {parsedSmartOltClients.length > 0 && (
                      <div className="space-y-3.5 pt-4 border-t border-brand-border/40 animate-in slide-in-from-bottom duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5 text-brand-accent-amber" />
                              Hapi 2: Verifiko Klientët e Gjetur ({parsedSmartOltClients.length})
                            </h4>
                            <p className="text-[10px] text-brand-text-secondary mt-0.5">Skoqo ose kontrollo profilet para se ti shtosh në databazën DigiNet.</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSmartOltClientIds(parsedSmartOltClients.map(c => c.id))}
                              className="text-[10px] font-mono hover:text-white text-brand-text-secondary uppercase tracking-wider cursor-pointer"
                            >
                              Gjithë
                            </button>
                            <span className="text-brand-text-muted">|</span>
                            <button
                              type="button"
                              onClick={() => setSelectedSmartOltClientIds([])}
                              className="text-[10px] font-mono hover:text-white text-brand-text-secondary uppercase tracking-wider cursor-pointer"
                            >
                              Asnjë
                            </button>
                          </div>
                        </div>

                        <div className="border border-brand-border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left text-[11px] font-sans">
                            <thead className="bg-[#0b1021] text-brand-text-secondary font-mono border-b border-brand-border sticky top-0 z-10">
                              <tr>
                                <th className="p-3 w-10"></th>
                                <th className="p-3">EMRI DHE MBIEMRI</th>
                                <th className="p-3">CELULARI</th>
                                <th className="p-3">SERIALI ONU/ONT</th>
                                <th className="p-3">ADRESA &amp; ZONA</th>
                                <th className="p-3">PLANI</th>
                                <th className="p-3">ROUTER MODEL</th>
                                <th className="p-3">SITUATA</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/40 bg-[#0d1324]/55">
                              {parsedSmartOltClients.map(c => {
                                const isDuplicate = clients.some(exist => {
                                  if (!exist.ontSerial || !c.ontSerial) return false;
                                  return exist.ontSerial.trim().toLowerCase() === c.ontSerial.trim().toLowerCase();
                                });
                                const isChecked = selectedSmartOltClientIds.includes(c.id);

                                return (
                                  <tr key={c.id} className={`hover:bg-brand-card-hover/25 transition-colors ${isDuplicate ? 'bg-red-500/[0.02]' : ''}`}>
                                    <td className="p-3 text-center">
                                      <input 
                                        type="checkbox"
                                        disabled={isDuplicate}
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedSmartOltClientIds(prev => prev.filter(id => id !== c.id));
                                          } else {
                                            setSelectedSmartOltClientIds(prev => [...prev, c.id]);
                                          }
                                        }}
                                        className="h-3.5 w-3.5 cursor-pointer accent-brand-accent-blue bg-brand-bg/50 rounded border-brand-border disabled:opacity-35 disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-2 min-w-[140px]">
                                      <input 
                                        type="text"
                                        value={c.name}
                                        onChange={(e) => handleUpdateParsedClientField(c.id, 'name', e.target.value)}
                                        className="bg-[#0b1021]/60 border border-brand-border/50 rounded px-1.5 py-0.5 text-white font-semibold w-full focus:outline-none focus:border-brand-accent-blue"
                                      />
                                    </td>
                                    <td className="p-2 min-w-[110px]">
                                      <input 
                                        type="text"
                                        value={c.phone}
                                        onChange={(e) => handleUpdateParsedClientField(c.id, 'phone', e.target.value)}
                                        className="bg-[#0b1021]/60 border border-brand-border/50 rounded px-1.5 py-0.5 text-brand-text-secondary font-mono w-full focus:outline-none focus:border-brand-accent-blue"
                                      />
                                    </td>
                                    <td className="p-3 font-mono font-bold text-brand-accent-blue">{c.ontSerial}</td>
                                    <td className="p-2 min-w-[190px] space-y-1">
                                      <input 
                                        type="text"
                                        value={c.address}
                                        onChange={(e) => handleUpdateParsedClientField(c.id, 'address', e.target.value)}
                                        className="bg-[#0b1021]/60 border border-brand-border/50 rounded px-1.5 py-0.5 text-brand-text-secondary text-[10px] w-full focus:outline-none focus:border-brand-accent-blue"
                                        placeholder="Adresa"
                                      />
                                      <select
                                        value={c.zone}
                                        onChange={(e) => handleUpdateParsedClientField(c.id, 'zone', e.target.value)}
                                        className="bg-[#0b1021] border border-brand-border/50 rounded px-1 py-0.5 text-brand-text-muted text-[10px] w-full focus:outline-none focus:border-brand-accent-blue font-mono"
                                      >
                                        <option value="Zone 1 (Kavaja/Shyri)">Zone 1 (Kavaja/Shyri)</option>
                                        <option value="Zone 2 (Bardhyl/Xhanfize)">Zone 2 (Bardhyl/Xhanfize)</option>
                                        <option value="Zone 3 (Don Bosko)">Zone 3 (Don Bosko)</option>
                                        <option value="Zone 4 (Elbasani)">Zone 4 (Elbasani)</option>
                                        <option value="Zone 5 (Kombinat)">Zone 5 (Kombinat)</option>
                                        <option value="Durrës 1 (Plazh)">Durrës 1 (Plazh)</option>
                                        <option value="Durrës 2 (Qendër)">Durrës 2 (Qendër)</option>
                                      </select>
                                    </td>
                                    <td className="p-2 min-w-[100px]">
                                      <input 
                                        type="text"
                                        value={c.plan}
                                        onChange={(e) => handleUpdateParsedClientField(c.id, 'plan', e.target.value)}
                                        className="bg-[#0b1021]/60 border border-brand-border/50 rounded px-1.5 py-0.5 text-brand-accent-amber font-mono font-medium w-full focus:outline-none focus:border-brand-accent-blue"
                                      />
                                    </td>
                                    <td className="p-2 min-w-[110px]">
                                      <input 
                                        type="text"
                                        value={c.routerModel}
                                        onChange={(e) => handleUpdateParsedClientField(c.id, 'routerModel', e.target.value)}
                                        className="bg-[#0b1021]/60 border border-brand-border/50 rounded px-1.5 py-0.5 text-brand-text-muted w-full focus:outline-none focus:border-brand-accent-blue"
                                      />
                                    </td>
                                    <td className="p-3">
                                      {isDuplicate ? (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/15">
                                          DUPLIKAT
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                                          GATI
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Modal Footer */}
                  <div className="bg-[#0b1021] p-5 border-t border-brand-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <span className="text-[10px] font-mono text-brand-text-muted leading-relaxed max-w-md text-center sm:text-left">
                      💡 Sklartimi inteligjent i klientëve duplikatë mbron databazën nga rregjistrimet e tepërta të të njëjtit terminal optik (ONT Serial).
                    </span>

                    <div className="flex gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsSmartOltModalOpen(false)}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-[#0d1324] border border-brand-border hover:bg-[#121a30] text-white rounded-xl font-bold font-mono text-xs transition-colors cursor-pointer"
                      >
                        Mbyll
                      </button>
                      <button
                        type="button"
                        onClick={executeImportSmartOltClients}
                        disabled={parsedSmartOltClients.length === 0 || selectedSmartOltClientIds.length === 0}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-accent-blue hover:opacity-95 text-brand-bg rounded-xl font-bold font-sans text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg"
                      >
                        <Check className="w-4 h-4" />
                        IMPORTO ({selectedSmartOltClientIds.length}) KLIENTË
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
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

      {/* REUSABLE PREMIUM DELETION CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteModalConfig.itemType === 'client') {
            handleExecuteDeleteClient(deleteModalConfig.itemId);
          } else {
            handleExecuteDeleteTicket(deleteModalConfig.itemId);
          }
        }}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        itemType={deleteModalConfig.itemType}
        itemMetadata={deleteModalConfig.metadata}
      />

    </div>
  );
};
