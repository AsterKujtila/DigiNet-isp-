import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Ticket, Client, TechnicianAvailability, Announcement, ChatMessage, PartsRequest, SLATarget } from './types';

// Helper to check if a specific table exists and works
async function testTableAccess(tableName: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from(tableName).select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export const SupabaseService = {
  // Sync Tickets
  async getTickets(fallback: Ticket[]): Promise<Ticket[]> {
    if (!isSupabaseConfigured || !supabase) return fallback;
    try {
      const hasTable = await testTableAccess('tickets');
      if (!hasTable) {
        console.warn('Tabela "tickets" nuk ekziston në Supabase. Po përdoret LocalStorage/Mock.');
        return fallback;
      }
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data && data.length > 0 ? (data as Ticket[]) : fallback;
    } catch (e) {
      console.error('Gabim gjatë leximit të tickets nga Supabase:', e);
      return fallback;
    }
  },

  async saveTicket(ticket: Ticket): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const hasTable = await testTableAccess('tickets');
      if (!hasTable) return false;
      const { error } = await supabase
        .from('tickets')
        .upsert(ticket);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Gabim gjatë ruajtjes së tiketit në Supabase:', e);
      return false;
    }
  },

  async saveAllTickets(tickets: Ticket[]): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase || tickets.length === 0) return false;
    try {
      const { error } = await supabase
        .from('tickets')
        .upsert(tickets);
      return !error;
    } catch {
      return false;
    }
  },

  // Sync Clients
  async getClients(fallback: Client[]): Promise<Client[]> {
    if (!isSupabaseConfigured || !supabase) return fallback;
    try {
      const hasTable = await testTableAccess('clients');
      if (!hasTable) return fallback;
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data && data.length > 0 ? (data as Client[]) : fallback;
    } catch {
      return fallback;
    }
  },

  async saveClient(client: Client): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('clients').upsert(client);
      return !error;
    } catch {
      return false;
    }
  },

  // Sync Technicians
  async getTechnicians(fallback: TechnicianAvailability[]): Promise<TechnicianAvailability[]> {
    if (!isSupabaseConfigured || !supabase) return fallback;
    try {
      const hasTable = await testTableAccess('technicians');
      if (!hasTable) return fallback;
      const { data, error } = await supabase.from('technicians').select('*');
      if (error) throw error;
      return data && data.length > 0 ? (data as TechnicianAvailability[]) : fallback;
    } catch {
      return fallback;
    }
  },

  async saveTechnician(tech: TechnicianAvailability): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('technicians').upsert(tech);
      return !error;
    } catch {
      return false;
    }
  },

  // Sync Announcements
  async getAnnouncements(fallback: Announcement[]): Promise<Announcement[]> {
    if (!isSupabaseConfigured || !supabase) return fallback;
    try {
      const hasTable = await testTableAccess('announcements');
      if (!hasTable) return fallback;
      const { data, error } = await supabase.from('announcements').select('*');
      if (error) throw error;
      return data && data.length > 0 ? (data as Announcement[]) : fallback;
    } catch {
      return fallback;
    }
  },

  async saveAnnouncement(announcement: Announcement): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('announcements').upsert(announcement);
      return !error;
    } catch {
      return false;
    }
  },

  // Chat message syncing
  async getChats(fallback: ChatMessage[]): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured || !supabase) return fallback;
    try {
      const hasTable = await testTableAccess('chats');
      if (!hasTable) return fallback;
      const { data, error } = await supabase.from('chats').select('*').order('timestamp', { ascending: true });
      if (error) throw error;
      return data && data.length > 0 ? (data as ChatMessage[]) : fallback;
    } catch {
      return fallback;
    }
  },

  async saveChatMessage(msg: ChatMessage): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('chats').upsert(msg);
      return !error;
    } catch {
      return false;
    }
  }
};
