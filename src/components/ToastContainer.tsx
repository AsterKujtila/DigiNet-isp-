import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  User, 
  X, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Phone,
  ArrowUpRight,
  ShieldAlert,
  Wifi,
  Tv,
  Users,
  Printer
} from 'lucide-react';
import { Ticket } from '../types';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'P1' | 'P2';
  timestamp: Date;
  ticketId: string;
}

export function playNotificationChime(priority: 'P1' | 'P2') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (priority === 'P1') {
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1100, now + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(550, now + 0.15);

      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else {
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.start(now);
      osc1.stop(now + 0.4);
    }
  } catch (err) {
    console.warn('Silent chime fail:', err);
  }
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onSelectTicket: (ticketId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onSelectTicket,
  isMuted,
  onToggleMute
}) => {
  return (
    <div 
      id="global-toast-viewport"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-md pointer-events-none"
    >
      {/* Toast Sound Controller HUD */}
      {toasts.length > 0 && (
        <div 
          id="toast-sound-controller"
          className="self-end mb-1 mr-2 pointer-events-auto flex items-center gap-2 bg-[#0d1325]/90 border border-brand-border px-3 py-1.5 rounded-full shadow-xl"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-secondary select-none">
            Alarme Akustike:
          </span>
          <button
            id="toggle-chime-sound-btn"
            onClick={onToggleMute}
            className={`p-1 rounded-full hover:scale-105 transition-all cursor-pointer ${
              isMuted 
                ? 'text-brand-text-muted bg-[#151c30]' 
                : 'text-brand-accent-amber bg-brand-accent-amber/15 border border-brand-accent-amber/20'
            }`}
            title={isMuted ? "Aktivizo tingujt e alarmit" : "Hesht tingujt e alarmit"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
          </button>
        </div>
      )}

      {/* Main interactive sliding items list */}
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isP1 = toast.type === 'P1';
          return (
            <motion.div
              key={toast.id}
              id={`toast-card-${toast.id}`}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, x: 100 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className={`pointer-events-auto relative overflow-hidden backdrop-blur-md rounded-xl border p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-3 ${
                isP1 
                  ? 'bg-red-950/20 border-red-500/30 shadow-red-500/5'
                  : 'bg-amber-950/20 border-brand-accent-amber/30 shadow-brand-accent-amber/5'
              }`}
            >
              {/* Highlight Neon background glow dots */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                isP1 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-brand-accent-amber shadow-[0_0_15px_rgba(245,158,11,0.8)]'
              }`} />

              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2.5">
                  <div className={`mt-0.5 p-1.5 rounded-lg flex items-center justify-center ${
                    isP1 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/25' 
                      : 'bg-brand-accent-amber/20 text-brand-accent-amber border border-brand-accent-amber/25'
                  }`}>
                    {isP1 ? (
                      <ShieldAlert className="w-4 h-4 animate-bounce" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white tracking-tight">
                        {toast.title}
                      </h4>
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                        isP1 ? 'bg-red-500/20 text-red-400' : 'bg-brand-accent-amber/20 text-brand-accent-amber'
                      }`}>
                        {toast.type}
                      </span>
                    </div>
                    <p className="text-xs text-brand-text-primary/95 mt-1 leading-snug">
                      {toast.description}
                    </p>
                  </div>
                </div>

                <button
                  id={`dismiss-btn-${toast.id}`}
                  onClick={() => onDismiss(toast.id)}
                  className="text-brand-text-muted hover:text-white hover:scale-105 p-1 rounded-md hover:bg-white/5 transition-all bg-transparent border-none cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lower Actions Section */}
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-brand-border/40 text-[11px]">
                <span className="text-[9px] font-mono text-brand-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {toast.timestamp.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>

                <button
                  id={`view-details-${toast.id}`}
                  onClick={() => onSelectTicket(toast.ticketId)}
                  className={`px-2.5 py-1 rounded-md font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                    isP1 
                      ? 'bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/30' 
                      : 'bg-brand-accent-amber/25 hover:bg-brand-accent-amber text-brand-accent-amber hover:text-[#070b13] border border-brand-accent-amber/30'
                  }`}
                >
                  <span>HAP BILETËN</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// GLOBAL TICKET INSPECTOR COMPONENT (MODAL OVERLAY)
// ============================================
interface TicketInspectorProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export const TicketInspector: React.FC<TicketInspectorProps> = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const isP1 = ticket.priority === 'P1';

  return (
    <div 
      id="global-ticket-inspector-modal"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#05080e]/85 backdrop-blur-sm"
    >
      <motion.div
        id="ticket-inspector-box"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl bg-[#0b101c] border rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5 ${
          isP1 ? 'border-red-500/40 shadow-red-500/5' : 'border-brand-accent-amber/40 shadow-brand-accent-amber/5'
        }`}
      >
        {/* Glow ambient accent in modal background */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] pointer-events-none ${
          isP1 ? 'bg-red-500/10' : 'bg-brand-accent-amber/10'
        }`} />

        {/* Modal Header */}
        <div className="flex justify-between items-start gap-4 pb-3 border-b border-brand-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-mono font-extrabold rounded-md ${
                isP1 ? 'bg-red-500/20 text-red-300' : 'bg-brand-accent-amber/19 text-brand-accent-amber'
              }`}>
                {ticket.priority} - {isP1 ? 'Kritike' : 'Lartë'}
              </span>
              <span className="text-xs text-brand-text-secondary font-mono">ID: {ticket.id}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1 leading-tight">
              {ticket.clientName} - Problem me Shërbimin
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1 px-2.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-100 font-mono text-xs cursor-pointer border border-emerald-500/30 transition-all flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              id="close-ticket-inspector"
              onClick={onClose}
              className="p-1 px-2.5 rounded-lg bg-[#141b2e] hover:bg-white/10 text-brand-text-secondary hover:text-white font-mono text-xs cursor-pointer border border-brand-border/80 transition-all flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Mbyll</span>
            </button>
          </div>
        </div>

        {/* Detailed Grid Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Details Section */}
          <div className="space-y-3 bg-[#0d1425] p-4 rounded-xl border border-brand-border/40">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#4162a8] font-mono flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Të Dhënat e Klientit
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Emri:</span>
                <span className="text-white font-semibold">{ticket.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-text-muted">Telefon:</span>
                <span className="text-white font-mono font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-brand-text-muted" />
                  {ticket.clientPhone}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-text-muted">Adresa / Zona:</span>
                <span className="text-white font-medium flex items-center gap-1 max-w-[200px] truncate">
                  <MapPin className="w-3 h-3 text-brand-text-muted" />
                  {ticket.clientAddress} ({ticket.clientZone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Shërbimi:</span>
                <span className="text-white font-bold capitalize font-mono flex items-center gap-1">
                  {ticket.serviceType === 'fiber' ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <Tv className="w-3.5 h-3.5 text-blue-400" />}
                  {ticket.serviceType}
                </span>
              </div>
            </div>
          </div>

          {/* SLA and Progression status card */}
          <div className="space-y-3 bg-[#0d1425] p-4 rounded-xl border border-brand-border/40">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#4162a8] font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Informacione SLA & Statusi
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-brand-text-muted">Statusi Aktual:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  ticket.status === 'open' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 
                  ticket.status === 'assigned' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                  ticket.status === 'in_progress' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Afati i SLA:</span>
                <span className={`font-mono font-semibold ${ticket.slaBreach ? 'text-red-400' : 'text-amber-400'}`}>
                  {new Date(ticket.slaDeadline).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })} ({ticket.slaBreach ? 'SLA të shkelura' : 'Në kohë'})
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-text-muted">U krijua:</span>
                <span className="text-brand-text-primary font-mono">
                  {new Date(ticket.createdAt).toLocaleString('sq-AL')}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-text-muted">Tekniku i caktuar:</span>
                <span className="text-brand-accent-blue font-bold">
                  {ticket.assignedTechName || 'I pacaktuar'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Descriptive details notes section */}
        <div className="bg-[#0c1221] p-4 rounded-xl border border-brand-border/40 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono tracking-wider text-[#4162a8] uppercase font-bold">Përshkrimi i Incidentit</label>
          <p className="text-xs text-brand-text-primary leading-relaxed bg-[#050912]/80 p-3 rounded-lg border border-[#1b253b] whitespace-pre-wrap font-mono">
            {ticket.description || 'Nuk ka përshkrim shtesë të ofruar për këtë rast.'}
          </p>
        </div>

        {/* Modal visual footer guide */}
        <div className="flex justify-between items-center text-[10px] text-brand-text-muted">
          <span>Krijuar nga: <strong className="text-brand-text-secondary">{ticket.createdBy}</strong></span>
          <span>Sistemi Monitorues Real-Time</span>
        </div>

      </motion.div>
    </div>
  );
};
