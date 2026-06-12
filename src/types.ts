export type UserRole = 'admin' | 'operator' | 'technician' | 'engineer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone: string;
  zone?: string;
  status: 'active' | 'inactive' | 'online' | 'offline';
  avatar?: string;
}

export type ServiceType = 'fiber' | 'wireless' | 'iptv' | 'phone';

export type ProblemCategory = 
  | 'no_internet' 
  | 'slow_speed' 
  | 'intermittent' 
  | 'no_signal' 
  | 'equipment' 
  | 'installation' 
  | 'other';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketStatus = 
  | 'open' 
  | 'assigned' 
  | 'in_progress' 
  | 'pending_parts' 
  | 'resolved' 
  | 'closed';

export interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface PartUsed {
  partId: string;
  partName: string;
  quantity: number;
}

export interface WorkReport {
  whatDone: string[];
  partsUsed: PartUsed[];
  beforeSpeed?: string;
  afterSpeed?: string;
  signature?: string; // base64 drawing
  photos?: string[];
  resolutionNotes: string;
  submittedAt?: string;
}

export interface AuditLog {
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  note?: string;
}

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientZone: string;
  serviceType: ServiceType;
  category: ProblemCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTechId?: string;
  assignedTechName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  scheduledTime?: string;
  respondedAt?: string;
  resolvedAt?: string;
  slaDeadline: string;
  slaBreach: boolean;
  description: string;
  techNotes?: string;
  resolutionNotes?: string;
  partsUsed?: PartUsed[];
  photosUrls?: string[];
  messagesList?: ChatMessage[]; // local message list copy or full thread
  workReport?: WorkReport;
  escalatedTo?: 'engineer' | 'admin';
  escalationReason?: string;
  linkedInfraIssueId?: string;
  customerRating?: number;
  customerFeedback?: string;
  history: AuditLog[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  zone: string;
  plan: string;
  currentSpeed: string;
  routerModel: string;
  ontSerial: string;
  status: 'active' | 'suspended';
  lat?: number;
  lng?: number;
}

export interface TechnicianAvailability {
  id: string;
  name: string;
  phone: string;
  zone: string;
  status: 'available' | 'on_job' | 'unavailable' | 'offline';
  currentJobId?: string;
  estimatedFreeTime?: string;
  rating: number;
  jobsCompleted: number;
  lat?: number;
  lng?: number;
}

export interface InfrastructureIssue {
  id: string;
  title: string;
  type: 'fiber_cut' | 'olt_down' | 'node_power' | 'upstream_outage' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  zone: string;
  affectedClientsCount: number;
  estResolutionTime: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  reserved: number;
  unit: string;
  minRequired: number;
  status: 'ok' | 'low';
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  language: string;
  articleBody: string;
  author: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetRole: 'all' | 'operator' | 'technician' | 'engineer';
  author: string;
  createdAt: string;
  priority: 'high' | 'normal';
}

export interface PartsRequest {
  id: string;
  techId: string;
  techName: string;
  ticketId?: string;
  partName: string;
  quantity: number;
  urgency: 'high' | 'normal';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SLATarget {
  id: string;
  priority: TicketPriority;
  responseTimeHours: number;
}
