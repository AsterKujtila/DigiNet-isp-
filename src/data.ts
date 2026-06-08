import { 
  Client, 
  TechnicianAvailability, 
  Ticket, 
  InfrastructureIssue, 
  InventoryItem, 
  KnowledgeArticle, 
  Announcement,
  PartsRequest,
  SLATarget,
  User,
  ChatMessage
} from './types';

export const INITIAL_USERS: User[] = [
  { id: 'usr-1', username: 'andi.koxha', fullName: 'Andi Koxha', role: 'technician', email: 'andi@diginet.al', phone: '+355 69 12 34 567', zone: 'Zone 1 (Kavaja/Shyri)', status: 'offline' },
  { id: 'usr-2', username: 'besnik.lata', fullName: 'Besnik Lata', role: 'technician', email: 'besnik@diginet.al', phone: '+355 69 22 44 888', zone: 'Zone 2 (Bardhyl/Xhanfize)', status: 'online' },
  { id: 'usr-3', username: 'clirim.rama', fullName: 'Çlirim Rama', role: 'technician', email: 'clirim@diginet.al', phone: '+355 69 33 55 999', zone: 'Zone 3 (Don Bosko)', status: 'online' },
  { id: 'usr-4', username: 'dritan.dervishi', fullName: 'Dritan Dervishi', role: 'technician', email: 'dritan@diginet.al', phone: '+355 69 44 66 111', zone: 'Durrës 1 (Plazh)', status: 'online' },
  { id: 'usr-5', username: 'erjon.gashi', fullName: 'Erjon Gashi', role: 'technician', email: 'erjon@diginet.al', phone: '+355 69 55 77 222', zone: 'Zone 4 (Elbasani)', status: 'online' },
  { id: 'usr-6', username: 'fatos.mema', fullName: 'Fatos Mema', role: 'technician', email: 'fatos@diginet.al', phone: '+355 69 66 88 333', zone: 'Zone 5 (Kombinat)', status: 'online' },
  { id: 'usr-7', username: 'genti.bardhi', fullName: 'Genti Bardhi', role: 'technician', email: 'genti@diginet.al', phone: '+355 69 77 99 444', zone: 'Durrës 2 (Qendër)', status: 'offline' },
  { id: 'usr-8', username: 'hekuran.pepa', fullName: 'Hekuran Pepa', role: 'technician', email: 'hekuran@diginet.al', phone: '+355 69 88 00 555', zone: 'Zone 3 (Don Bosko)', status: 'online' },
  { id: 'usr-9', username: 'operator.anila', fullName: 'Anila Spahiu', role: 'operator', email: 'anila@diginet.al', phone: '+355 69 11 22 333', status: 'online' },
  { id: 'usr-10', username: 'admin.fatmir', fullName: 'Fatmir Hoxha', role: 'admin', email: 'fatmir@diginet.al', phone: '+355 69 99 99 999', status: 'online' },
  { id: 'usr-11', username: 'engineer.sokol', fullName: 'Sokol Demiri', role: 'engineer', email: 'sokol@diginet.al', phone: '+355 69 44 44 444', status: 'online' }
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'CL-101', name: 'Arben Hoxha', phone: '+355 68 11 11 111', address: 'Rruga e Kavajës, pranë ish-Parkut, Tiranë', zone: 'Zone 1 (Kavaja/Shyri)', plan: 'Fiber 100 Mbps + IPTV Premium', currentSpeed: '100 / 100 Mbps', routerModel: 'Huawei HG8245H', ontSerial: '210235A1GP0KB3004543', status: 'active' },
  { id: 'CL-102', name: 'Fatime Gashi', phone: '+355 67 22 22 222', address: 'Rruga Bardhyl, Pallati 14, Ap 9, Tiranë', zone: 'Zone 2 (Bardhyl/Xhanfize)', plan: 'Fiber 200 Mbps + IPTV Elite', currentSpeed: '200 / 200 Mbps', routerModel: 'ZTE F660', ontSerial: 'ZTEGC904F03C', status: 'active' },
  { id: 'CL-103', name: 'Elisabeta Leka', phone: '+355 69 33 33 333', address: 'Rruga Don Bosko, Pallati Vizion Plus, Tiranë', zone: 'Zone 3 (Don Bosko)', plan: 'Wireless Home Lite 30 Mbps', currentSpeed: '30 / 10 Mbps', routerModel: 'MikroTik hAP ac2', ontSerial: 'MTK9120H9A3', status: 'active' },
  { id: 'CL-104', name: 'Blerim Kurti', phone: '+355 68 44 44 444', address: 'Rruga e Elbasanit, përballë Filologjikut, Tiranë', zone: 'Zone 4 (Elbasani)', plan: 'Fiber Pro 500 Mbps', currentSpeed: '500 / 500 Mbps', routerModel: 'Nokia G-2425G-A', ontSerial: 'ALCLB492E391', status: 'active' },
  { id: 'CL-105', name: 'Valbona Shehu', phone: '+355 69 55 55 555', address: 'Rruga Taulantia, Vollga, Durrës', zone: 'Durrës 2 (Qendër)', plan: 'Fiber 100 Mbps + IPTV Premium', currentSpeed: '100 / 100 Mbps', routerModel: 'ZTE F660', ontSerial: 'ZTEGCA43DE01', status: 'active' },
  { id: 'CL-106', name: 'Ilir Meta', phone: '+355 67 66 66 666', address: 'Rruga Pjetër Bogdani, Blloku, Tiranë', zone: 'Zone 1 (Kavaja/Shyri)', plan: 'Fiber Giga 1 Gbps + IPTV Elite', currentSpeed: '1000 / 1000 Mbps', routerModel: 'ZTE F680 Wi-Fi 6', ontSerial: 'ZTEGCEEE77F2', status: 'active' },
  { id: 'CL-107', name: 'Edona Kastrati', phone: '+355 69 77 77 777', address: 'Rruga Myslym Shyri, përballë Postës, Tiranë', zone: 'Zone 1 (Kavaja/Shyri)', plan: 'Fiber 100 Mbps', currentSpeed: '100 / 100 Mbps', routerModel: 'Huawei HG8245H', ontSerial: '210235A1GP0KA34591A2', status: 'active' },
  { id: 'CL-108', name: 'Kujtim Shala', phone: '+355 68 88 88 888', address: 'Rruga Llazi Miho, Kombinat, Tiranë', zone: 'Zone 5 (Kombinat)', plan: 'Wireless Home Lite 30 Mbps', currentSpeed: '30 / 10 Mbps', routerModel: 'TP-Link WR840N', ontSerial: 'TPLA0492FDD1', status: 'suspended' },
  { id: 'CL-109', name: 'Dhurata Çela', phone: '+355 67 99 99 999', address: 'Rruga e Durrësit, pranë Ambasadës, Tiranë', zone: 'Zone 3 (Don Bosko)', plan: 'Fiber 200 Mbps + IPTV Premium', currentSpeed: '200 / 200 Mbps', routerModel: 'Huawei HG8245H', ontSerial: '210235A1GP0KB4F4B231', status: 'active' },
  { id: 'CL-110', name: 'Sali Berisha', phone: '+355 69 12 34 000', address: 'Rruga Muhamet Gjollesha, pranë Inxhinierisë, Tiranë', zone: 'Zone 1 (Kavaja/Shyri)', plan: 'Fiber Duo 200 Mbps', currentSpeed: '200 / 200 Mbps', routerModel: 'ZTE F660', ontSerial: 'ZTEGC90ADF42', status: 'active' },
  { id: 'CL-111', name: 'Fredi Beleri', phone: '+355 68 23 45 111', address: 'Bulevardi kryesor Plazh, ndërtesa 4, Durrës', zone: 'Durrës 1 (Plazh)', plan: 'Fiber 100 Mbps + IPTV Lite', currentSpeed: '100 / 100 Mbps', routerModel: 'Huawei HG8546M', ontSerial: 'HWA77FA19DC2', status: 'active' },
  { id: 'CL-112', name: 'Majlinda Bregu', phone: '+355 67 34 56 222', address: 'Siri Kodra, pranë Shkollës "Kuqe", Tiranë', zone: 'Zone 2 (Bardhyl/Xhanfize)', plan: 'Fiber Duo 100 Mbps', currentSpeed: '100 / 100 Mbps', routerModel: 'ZTE F660', ontSerial: 'ZTEGC92EF112', status: 'active' },
  { id: 'CL-113', name: 'Erion Veliaj', phone: '+355 69 45 67 333', address: 'Rruga Mine Peza, Pallati i Ri, Tiranë', zone: 'Zone 3 (Don Bosko)', plan: 'Fiber Giga 1 Gbps + IPTV Ultimate', currentSpeed: '1000 / 1000 Mbps', routerModel: 'Huawei HN8245Q', ontSerial: 'HWAFFEE88821', status: 'active' },
  { id: 'CL-114', name: 'Lulzim Basha', phone: '+355 68 56 78 444', address: 'Rruga Ibrahim Rugova, pranë Sky Tower, Tiranë', zone: 'Zone 1 (Kavaja/Shyri)', plan: 'Fiber Duo 200 Mbps', currentSpeed: '200 / 200 Mbps', routerModel: 'Nokia G-2425G-A', ontSerial: 'ALCLCE81B4F9', status: 'active' },
  { id: 'CL-115', name: 'Edi Rama', phone: '+355 67 67 89 555', address: 'Rruga e Kavajës, pranë 21 Dhjetorit, Tiranë', zone: 'Zone 1 (Kavaja/Shyri)', plan: 'Fiber Duo 500 Mbps + IPTV Premium', currentSpeed: '500 / 500 Mbps', routerModel: 'ZTE F680 Wi-Fi 6', ontSerial: 'ZTEGCFED711F', status: 'active' }
];

export const INITIAL_TECHNICIANS: TechnicianAvailability[] = [
  { id: 'tech-1', name: 'Andi Koxha', phone: '+355 69 12 34 567', zone: 'Zone 1 (Kavaja/Shyri)', status: 'offline', jobsCompleted: 42, rating: 4.8 },
  { id: 'tech-2', name: 'Besnik Lata', phone: '+355 69 22 44 888', zone: 'Zone 2 (Bardhyl/Xhanfize)', status: 'available', jobsCompleted: 51, rating: 4.7 },
  { id: 'tech-3', name: 'Çlirim Rama', phone: '+355 69 33 55 999', zone: 'Zone 3 (Don Bosko)', status: 'on_job', currentJobId: 'TK-1002', jobsCompleted: 38, rating: 4.9 },
  { id: 'tech-4', name: 'Dritan Dervishi', phone: '+355 69 44 66 111', zone: 'Durrës 1 (Plazh)', status: 'available', jobsCompleted: 64, rating: 4.5 },
  { id: 'tech-5', name: 'Erjon Gashi', phone: '+355 69 55 77 222', zone: 'Zone 4 (Elbasani)', status: 'on_job', currentJobId: 'TK-1004', jobsCompleted: 30, rating: 4.6 },
  { id: 'tech-6', name: 'Fatos Mema', phone: '+355 69 66 88 333', zone: 'Zone 5 (Kombinat)', status: 'available', jobsCompleted: 45, rating: 4.9 },
  { id: 'tech-7', name: 'Genti Bardhi', phone: '+355 69 77 99 444', zone: 'Durrës 2 (Qendër)', status: 'offline', jobsCompleted: 22, rating: 4.4 },
  { id: 'tech-8', name: 'Hekuran Pepa', phone: '+355 69 88 00 555', zone: 'Zone 3 (Don Bosko)', status: 'available', jobsCompleted: 58, rating: 4.8 }
];

export const INITIAL_SLA: SLATarget[] = [
  { id: 'sla-1', priority: 'P1', responseTimeHours: 2 },
  { id: 'sla-2', priority: 'P2', responseTimeHours: 4 },
  { id: 'sla-3', priority: 'P3', responseTimeHours: 8 },
  { id: 'sla-4', priority: 'P4', responseTimeHours: 24 }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann-1', title: 'Mirëmbajtje Fiber Optike në Nyjen Don Bosko', message: 'Të nderuar teknikë, natën e sotme nga ora 02:00 deri në 05:00 do të ketë mirëmbajtje të linjës kryesore të fibrave në rrethrrotullimin Don Bosko. Ju lutem kryeni monitorimet e duhura.', targetRole: 'all', author: 'Sokol Demiri (Engineer)', createdAt: '2026-06-06T12:00:00Z', priority: 'high' },
  { id: 'ann-2', title: 'Zëvendësimi i Modelit të vjetër të ONT Huawei', message: 'Vini re: Të gjitha ONT-të e vjetra Huawei duhet të zëvendësohen me modelin e ri HG8245H në çdo vizitë riparimi nëse konstatoni luhatje të sinjalit Optik.', targetRole: 'technician', author: 'Fatmir Hoxha (Admin)', createdAt: '2026-06-05T09:30:00Z', priority: 'normal' },
  { id: 'ann-3', title: 'Raportoni çdo incident përmes Platformës', message: 'Nga sot, asnjë bisedë apo urdhër pune nuk do të kryhet përmes grupeve të WhatsApp. Çdo gjë do të kontrollohet dhe logoret në këtë aplikacion.', targetRole: 'all', author: 'Fatmir Hoxha (Admin)', createdAt: '2026-06-04T08:00:00Z', priority: 'high' }
];

export const INITIAL_INFRASTRUCTURE: InfrastructureIssue[] = [
  { id: 'INF-501', title: 'Këputje Fiber Optike në Unazë pranë Don Bosko', type: 'fiber_cut', severity: 'critical', status: 'active', zone: 'Zone 3 (Don Bosko)', affectedClientsCount: 450, estResolutionTime: '2 orë', description: 'Gjatë punimeve të Bashkisë është këputur kabllo kryesor 96-fije. Skuadra e inxhinierisë është në vendngjarje duke bërë saldimin e fibrave.', createdAt: '2026-06-07T08:15:00Z' },
  { id: 'INF-502', title: 'Rënie e Energjisë në Kabinën Pop-Durrës-Beach', type: 'node_power', severity: 'high', status: 'active', zone: 'Durrës 1 (Plazh)', affectedClientsCount: 120, estResolutionTime: '1 orë', description: 'OSHEE ka stakuar linjën kryesore të tensionit të mesëm. UPS-i lokal mbulon edhe 30 minuta të tjera. Gjeneratori është rrugës.', createdAt: '2026-06-07T09:00:00Z' },
  { id: 'INF-503', title: 'Portë OLT e mbingarkuar (G-PON 0/1/4) - Qendër', type: 'olt_down', severity: 'medium', status: 'resolved', zone: 'Zone 1 (Kavaja/Shyri)', affectedClientsCount: 64, estResolutionTime: 'Zgjidhur', description: 'Kanali optik pati luhatje për shkak të një splitteri të dëmtuar. U pastrua lidhësi dhe splitter-i u zëvendësua.', createdAt: '2026-06-06T14:20:00Z', resolvedAt: '2026-06-06T16:10:00Z' }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'ONT Huawei HG8245H', code: 'HW-8245', quantity: 45, reserved: 4, unit: 'Cope', minRequired: 15, status: 'ok' },
  { id: 'inv-2', name: 'ONT ZTE F660', code: 'ZTE-660', quantity: 23, reserved: 2, unit: 'Cope', minRequired: 10, status: 'ok' },
  { id: 'inv-3', name: 'MikroTik hAP ac2 Router', code: 'MT-HAPAC2', quantity: 8, reserved: 3, unit: 'Cope', minRequired: 10, status: 'low' },
  { id: 'inv-4', name: 'Kabllo Fiber Optike Drop 1-Core', code: 'FB-DROP1C', quantity: 1200, reserved: 200, unit: 'Metra', minRequired: 500, status: 'ok' },
  { id: 'inv-5', name: 'Splicing Sleeves (Mëngë saldimi)', code: 'SL-60MM', quantity: 180, reserved: 10, unit: 'Cope', minRequired: 50, status: 'ok' },
  { id: 'inv-6', name: 'Splitter Optik 1x8 PLC', code: 'SPL-1*8', quantity: 4, reserved: 1, unit: 'Cope', minRequired: 5, status: 'low' },
  { id: 'inv-7', name: 'Patch Cord SC-PC 3m', code: 'PC-SC3M', quantity: 65, reserved: 5, unit: 'Cope', minRequired: 20, status: 'ok' }
];

export const INITIAL_KNOWLEDGE: KnowledgeArticle[] = [
  {
    id: 'kb-101',
    title: 'Troubleshooting me Red LOS Light në ONT Huawei',
    category: 'G-PON',
    tags: ['Huawei', 'LOS', 'Red Light', 'Fiber'],
    language: 'sq',
    articleBody: 'Kur ONT ka dritën LOS të kuqe (mungesë sinjali optik):\n\n1. Verifikoni nëse lidhësi i fibrave i verdhë (APC) është lidhur saktë në portën e poshtme të ONT-së.\n2. Inspektoni kabllin Drop për thyerje ose lakime të forta (Microbending).\n3. Matni sinjalin me Power Meter. Niveli normal i pranisë optike duhet të jetë ndërmjet -16 dBm dhe -25 dBm. Nëse është mbi -27 dBm, sinjali është shumë i dobët.\n4. Verifikoni kutinë e shpërndarjes (ODF) në rrugë ose lidhjen e splitter-it në kat.',
    author: 'Sokol Demiri',
    createdAt: '2026-05-15T10:00:00Z'
  },
  {
    id: 'kb-102',
    title: 'Konfigurimi bazë i MikroTik hAP ac2 për Shërbim Interneti DigiNet',
    category: 'MikroTik RouterOS',
    tags: ['MikroTik', 'Konfigurim', 'Router', 'PPPoE'],
    language: 'sq',
    articleBody: 'Për të konfiguruar pajisjen MikroTik për shërbimet tona PPPoE:\n\n1. Lidhni kabllin që vjen nga ONT në portën ether1 të MikroTik-ut.\n2. Lidhuni përmes Winbox në Mac Address.\n3. Shtoni një interface të ri PPPoE Client në ether1.\n4. Vendosni Username dhe Password e klientit (gjenden në fletën e kontratës).\n5. Aktivizoni "Use Peer DNS" dhe "Add Default Route".\n6. Konfiguroni NAT masquerade për rrjetin lokal (LAN) në ports ether2-ether5 dhe WLAN.',
    author: 'Sokol Demiri',
    createdAt: '2026-05-20T14:30:00Z'
  },
  {
    id: 'kb-103',
    title: 'Troubleshooting Luhatje Shpejtësie & IPTV Buffer',
    category: 'IPTV',
    tags: ['Luhatje', 'IPTV', 'Buffer', 'ZTE'],
    language: 'sq',
    articleBody: 'IPTV kërkon transmetim pa humbje paketash (jitter minimal):\n\n1. Gjatë ankesave për ngrirje të IPTV, sigurohuni që Set-Top Box të jetë lidhur me kabllo LAN (jo Wi-Fi) direkt në portën LAN të caktuar për IPTV (zakonisht LAN 2 ose 3 me VLAN përkatës).\n2. Aktivizoni IGMP Snooping në router dhe switch-at e klientit.\n3. Matni shpejtësinë direkt me kabllo duke fikur të gjitha pajisjet e tjera për të bërë izolimin e duhur.',
    author: 'Sokol Demiri',
    createdAt: '2026-05-28T11:15:00Z'
  }
];

export const INITIAL_PARTS_REQUESTS: PartsRequest[] = [
  { id: 'pr-1', techId: 'tech-3', techName: 'Çlirim Rama', partName: 'ONT Huawei HG8245H', quantity: 1, urgency: 'high', status: 'approved', createdAt: '2026-06-07T07:45:00Z' },
  { id: 'pr-2', techId: 'tech-5', techName: 'Erjon Gashi', partName: 'Splitter Optik 1x8 PLC', quantity: 2, urgency: 'normal', status: 'pending', createdAt: '2026-06-07T08:30:00Z' },
  { id: 'pr-3', techId: 'tech-2', techName: 'Besnik Lata', partName: 'Kabllo Fiber Optike Drop 1-Core', quantity: 300, urgency: 'normal', status: 'pending', createdAt: '2026-06-07T09:10:00Z' }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TK-1001',
    clientId: 'CL-101',
    clientName: 'Arben Hoxha',
    clientPhone: '+355 68 11 11 111',
    clientAddress: 'Rruga e Kavajës, pranë ish-Parkut, Tiranë',
    clientZone: 'Zone 1 (Kavaja/Shyri)',
    serviceType: 'fiber',
    category: 'no_internet',
    priority: 'P1',
    status: 'open',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-07T06:30:00Z',
    updatedAt: '2026-06-07T06:30:00Z',
    scheduledTime: '10:00 - 12:00',
    slaDeadline: '2026-06-07T08:30:00Z',
    slaBreach: true, // breached since current time is 09:30:28
    description: 'Klienti raporton dritën LOS të kuqe që nga ora 6 e mëngjesit. Sapo u zgjua pa që nuk ka internet dhe IPTV.',
    history: [
      { timestamp: '2026-06-07T06:30:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' }
    ]
  },
  {
    id: 'TK-1002',
    clientId: 'CL-102',
    clientName: 'Fatime Gashi',
    clientPhone: '+355 67 22 22 222',
    clientAddress: 'Rruga Bardhyl, Pallati 14, Ap 9, Tiranë',
    clientZone: 'Zone 2 (Bardhyl/Xhanfize)',
    serviceType: 'fiber',
    category: 'slow_speed',
    priority: 'P3',
    status: 'in_progress',
    assignedTechId: 'tech-3',
    assignedTechName: 'Çlirim Rama',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-07T07:00:00Z',
    updatedAt: '2026-06-07T07:45:00Z',
    scheduledTime: '08:30 - 10:30',
    slaDeadline: '2026-06-07T15:00:00Z',
    slaBreach: false,
    description: 'Shpejtësia vjen vetëm 40 Mbps nga 200 Mbps të kontratës. Ndodh sidomos mbasdite dhe gjatë ditës.',
    techNotes: 'Në terren duke kontrolluar nivelin e sinjalit optik në katin e 3-të.',
    history: [
      { timestamp: '2026-06-07T07:00:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' },
      { timestamp: '2026-06-07T07:15:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Atribuoi teknikun Çlirim Rama' },
      { timestamp: '2026-06-07T07:45:00Z', user: 'Çlirim Rama', role: 'technician', action: 'Nisi punën' }
    ]
  },
  {
    id: 'TK-1003',
    clientId: 'CL-103',
    clientName: 'Elisabeta Leka',
    clientPhone: '+355 69 33 33 333',
    clientAddress: 'Rruga Don Bosko, Pallati Vizion Plus, Tiranë',
    clientZone: 'Zone 3 (Don Bosko)',
    serviceType: 'wireless',
    category: 'intermittent',
    priority: 'P2',
    status: 'open',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-07T08:00:00Z',
    updatedAt: '2026-06-07T08:00:00Z',
    scheduledTime: '13:00 - 15:00',
    slaDeadline: '2026-06-07T12:00:00Z',
    slaBreach: false,
    description: 'Interneti ndërpritet sa herë fryn erë ose lëviz koka e antenës së jashtme Ubiquiti.',
    linkedInfraIssueId: 'INF-501', // Linked to the fiber cut in Don Bosko!
    history: [
      { timestamp: '2026-06-07T08:00:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' },
      { timestamp: '2026-06-07T08:05:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Lidhi biletën me incidentin INF-501' }
    ]
  },
  {
    id: 'TK-1004',
    clientId: 'CL-104',
    clientName: 'Blerim Kurti',
    clientPhone: '+355 68 44 44 444',
    clientAddress: 'Rruga e Elbasanit, përballë Filologjikut, Tiranë',
    clientZone: 'Zone 4 (Elbasani)',
    serviceType: 'fiber',
    category: 'equipment',
    priority: 'P2',
    status: 'in_progress',
    assignedTechId: 'tech-5',
    assignedTechName: 'Erjon Gashi',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-07T08:20:00Z',
    updatedAt: '2026-06-07T08:45:00Z',
    scheduledTime: '08:30 - 10:30',
    slaDeadline: '2026-06-07T12:20:00Z',
    slaBreach: false,
    description: 'Llambat e routerit Nokia ndizen portokalli, nuk jep fare sinjal Wi-Fi në pajisje.',
    techNotes: 'Do të testoj zëvendësimin e ushqyesit të ushqimit (adapter) ose zëvendësimin e router-it.',
    history: [
      { timestamp: '2026-06-07T08:20:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' },
      { timestamp: '2026-06-07T08:30:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Atribuoi teknikun Erjon Gashi' },
      { timestamp: '2026-06-07T08:45:00Z', user: 'Erjon Gashi', role: 'technician', action: 'Nisi punën' }
    ]
  },
  {
    id: 'TK-1005',
    clientId: 'CL-105',
    clientName: 'Valbona Shehu',
    clientPhone: '+355 69 55 55 555',
    clientAddress: 'Rruga Taulantia, Vollga, Durrës',
    clientZone: 'Durrës 2 (Qendër)',
    serviceType: 'fiber',
    category: 'no_signal',
    priority: 'P1',
    status: 'open',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-07T09:10:00Z',
    updatedAt: '2026-06-07T09:10:00Z',
    scheduledTime: '11:00 - 13:00',
    slaDeadline: '2026-06-07T11:10:00Z',
    slaBreach: false,
    description: 'Ka ndërprerje totale të sinjalit optik. Shfaqet drita PON fikur e LOS bosh ose e kuqe.',
    history: [
      { timestamp: '2026-06-07T09:10:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' }
    ]
  },
  {
    id: 'TK-0994',
    clientId: 'CL-107',
    clientName: 'Edona Kastrati',
    clientPhone: '+355 69 77 77 777',
    clientAddress: 'Rruga Myslym Shyri, përballë Postës, Tiranë',
    clientZone: 'Zone 1 (Kavaja/Shyri)',
    serviceType: 'fiber',
    category: 'installation',
    priority: 'P4',
    status: 'resolved',
    assignedTechId: 'tech-1',
    assignedTechName: 'Andi Koxha',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-06T10:00:00Z',
    updatedAt: '2026-06-06T14:30:00Z',
    scheduledTime: '11:00 - 13:00',
    slaDeadline: '2026-06-07T10:00:00Z',
    slaBreach: false,
    description: 'Instalimi i ri i klientit. Ka kërkuar Fiber 100 Mbps me router Wi-Fi 6 sipas ofertës verore.',
    techNotes: 'Instalimi u realizua me sukses duke përdorur 45m kabllo drop fiber optike dhe një ONT Huawei.',
    resolutionNotes: 'Instalimi perfundoi, parametrat optik -20.5 dBm, shpejtesia arriti 100 Mbps ne download/upload.',
    customerRating: 5,
    customerFeedback: 'Shumë të sjellshëm teknikët dhe puna u krye shpejt!',
    workReport: {
      whatDone: ['replaced ONT', 'spliced fiber', 'updated firmware'],
      partsUsed: [
        { partId: 'inv-1', partName: 'ONT Huawei HG8245H', quantity: 1 }
      ],
      beforeSpeed: '0 / 0 Mbps',
      afterSpeed: '101 / 99 Mbps',
      resolutionNotes: 'Instalimi perfundoi, parametrat optik -20.5 dBm, shpejtesia arriti 100 Mbps ne download/upload.',
      submittedAt: '2026-06-06T14:30:00Z'
    },
    history: [
      { timestamp: '2026-06-06T10:00:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' },
      { timestamp: '2026-06-06T10:30:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Atribuoi teknikun Andi Koxha' },
      { timestamp: '2026-06-06T11:45:00Z', user: 'Andi Koxha', role: 'technician', action: 'Nisi punën' },
      { timestamp: '2026-06-06T14:30:00Z', user: 'Andi Koxha', role: 'technician', action: 'Zgjidhi biletën' }
    ]
  },
  {
    id: 'TK-0995',
    clientId: 'CL-109',
    clientName: 'Dhurata Çela',
    clientPhone: '+355 67 99 99 999',
    clientAddress: 'Rruga e Durrësit, pranë Ambasadës, Tiranë',
    clientZone: 'Zone 3 (Don Bosko)',
    serviceType: 'iptv',
    category: 'no_signal',
    priority: 'P3',
    status: 'closed',
    assignedTechId: 'tech-8',
    assignedTechName: 'Hekuran Pepa',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-05T09:00:00Z',
    updatedAt: '2026-06-05T13:00:00Z',
    scheduledTime: '10:00 - 12:00',
    slaDeadline: '2026-06-05T17:00:00Z',
    slaBreach: false,
    description: 'Set-Top Box nxjerr gabimin "Mungesë sinjali IP" (No stream received). Ndodh në të gjithë kanalet.',
    techNotes: 'Set-Top Box-i ishte bllokuar në një sesion të vjetër DHCP. U fshi konfigurimi i vjetër.',
    resolutionNotes: 'Set-Top Box u fshi nga sesioni i vjetër PPPoE/DHCP dhe u krye reset i plotë i pajisjes ZTE STB.',
    customerRating: 4,
    customerFeedback: 'Shërbimi u krye por STB duhet të ndërrohet mbase.',
    history: [
      { timestamp: '2026-06-05T09:00:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' },
      { timestamp: '2026-06-05T09:15:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Atribuoi teknikun Hekuran Pepa' },
      { timestamp: '2026-06-05T10:10:00Z', user: 'Hekuran Pepa', role: 'technician', action: 'Nisi punën' },
      { timestamp: '2026-06-05T12:00:00Z', user: 'Hekuran Pepa', role: 'technician', action: 'Zgjidhi biletën' },
      { timestamp: '2026-06-05T13:00:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Mbylli biletën (Closed)' }
    ]
  },
  {
    id: 'TK-1006',
    clientId: 'CL-110',
    clientName: 'Sali Berisha',
    clientPhone: '+355 69 12 34 000',
    clientAddress: 'Rruga Muhamet Gjollesha, pranë Inxhinierisë, Tiranë',
    clientZone: 'Zone 1 (Kavaja/Shyri)',
    serviceType: 'fiber',
    category: 'no_internet',
    priority: 'P1',
    status: 'assigned',
    assignedTechId: 'tech-1',
    assignedTechName: 'Andi Koxha',
    createdBy: 'Anila Spahiu',
    createdAt: '2026-06-07T09:00:00Z',
    updatedAt: '2026-06-07T09:05:00Z',
    scheduledTime: '09:30 - 11:30',
    slaDeadline: '2026-06-07T11:00:00Z',
    slaBreach: false,
    description: 'Nuk jep fare IP WAN router-i i klientit. Llamba PON ndizet jeshile stabile, por llamba INTERNET është e kuqe ose fikur.',
    history: [
      { timestamp: '2026-06-07T09:00:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Krijoi biletën' },
      { timestamp: '2026-06-07T09:05:00Z', user: 'Anila Spahiu', role: 'operator', action: 'Atribuoi teknikun Andi Koxha' }
    ]
  }
];

// Pre-create realistic messages
export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'msg-1', ticketId: 'TK-1002', senderId: 'usr-9', senderName: 'Anila Spahiu', senderRole: 'operator', text: 'Çlirim, si duket situata te Fatime Gashi? Kemi parë rënie të nivelit të sinjalit sot.', timestamp: '2026-06-07T07:16:00Z' },
  { id: 'msg-2', ticketId: 'TK-1002', senderId: 'usr-3', senderName: 'Çlirim Rama', senderRole: 'technician', text: 'Sapo mbërrita te pika, po kontrolloj lidhjen në splitter-in e katit për të parë vlerat para se të futem brenda.', timestamp: '2026-06-07T07:47:00Z' },
  { id: 'msg-3', ticketId: 'TK-1002', senderId: 'usr-11', senderName: 'Sokol Demiri', senderRole: 'engineer', text: 'Kujdes Çlirim, ajo linjë ka patur thyerje të fibrave në rrugë javën e kaluar, kontrolloni lidhësit mekanike.', timestamp: '2026-06-07T08:12:00Z' },
  { id: 'msg-4', ticketId: 'TK-1004', senderId: 'usr-5', senderName: 'Erjon Gashi', senderRole: 'technician', text: 'Kam nevojë për zëvendësim të routerit Nokia orë pas ore, ka shkrirë porta optike.', timestamp: '2026-06-07T08:48:00Z' }
];
