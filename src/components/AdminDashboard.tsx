import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Ticket } from '../types';
import { RefreshCw } from 'lucide-react';

interface AdminDashboardProps {
  tickets: Ticket[];
  lastSyncTime: Date | null;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tickets, lastSyncTime }) => {
  // 1. Tickets by Status (Pie)
  const statusData = useMemo(() => {
    const counts = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // 2. Ticket Volume over last 7 days (Line)
  const volumeData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      name: date.split('-').slice(1).join('/'),
      Volume: tickets.filter(t => t.createdAt.startsWith(date)).length
    }));
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Sync Status Header */}
      <div className="flex items-center justify-between bg-[#0d1324] border border-brand-border/50 p-3 px-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[10px] font-mono font-bold text-brand-text-secondary uppercase">Matusi i Sinkronizimit</h4>
            <p className="text-xs font-semibold text-white">Statusi i Sinkronizimit me Supabase</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-brand-text-secondary uppercase">Sinkronizimi i Fundit</p>
          <p className="text-xs font-mono font-bold text-emerald-400">
            {lastSyncTime ? lastSyncTime.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Po kërkohet...'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart: Status */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase mb-4">Biletat sipas Statusit</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e3a5f', padding: '10px', borderRadius: '12px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart: Volume */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase mb-4">Vëllimi i Biletave (7 ditët e fundit)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a354f" />
              <XAxis dataKey="name" fontSize={11} tick={{fill: '#64748b'}} />
              <YAxis fontSize={11} tick={{fill: '#64748b'}} />
              <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e3a5f', padding: '10px', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="Volume" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
  );
};
