import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Ticket, Client, TechnicianAvailability, Announcement, ChatMessage, PartsRequest, SLATarget } from './types';

// Helper to check if a specific table exists and works
async function testTableAccess(tableName: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.warn(`Table "${tableName}" is not accessible or does not exist:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Error testing table access for "${tableName}":`, e);
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
      
      if (data && data.length > 0) {
        // Merge fallback (local list which has our imported ones) with Remote database data
        const mergedMap = new Map<string, Client>();
        fallback.forEach(c => {
          if (c && c.id) mergedMap.set(c.id, c);
        });
        (data as Client[]).forEach(c => {
          if (c && c.id) mergedMap.set(c.id, c);
        });
        return Array.from(mergedMap.values());
      }
      return fallback;
    } catch (e) {
      console.error("Gabim gjatë getClients nga Supabase:", e);
      return fallback;
    }
  },

  async saveClient(client: Client): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const hasTable = await testTableAccess('clients');
      if (!hasTable) return false;
      const { error } = await supabase.from('clients').upsert(client);
      if (error) {
        console.error('Error saving client to Supabase:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Exception saving client to Supabase:', e);
      return false;
    }
  },

  async saveAllClients(clients: Client[]): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase || clients.length === 0) return false;
    try {
      const hasTable = await testTableAccess('clients');
      if (!hasTable) return false;
      const { error } = await supabase.from('clients').upsert(clients);
      if (error) {
        console.error('Error saving all clients to Supabase:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Exception saving all clients to Supabase:', e);
      return false;
    }
  },

  async deleteClient(clientId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const hasTable = await testTableAccess('clients');
      if (!hasTable) return false;
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteTicket(ticketId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
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
