import React from 'react';
import { UserRole } from '../types';
import { Shield, Headphones, Wrench, ShieldAlert, RotateCcw, AlertCircle } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onResetData: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onChangeRole,
  demoMode,
  onToggleDemoMode,
  onResetData
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 py-2 px-3 bg-brand-card/90 backdrop-blur-md border border-brand-border rounded-full flex items-center gap-2 shadow-2xl scale-95 hover:scale-100 transition-all duration-300">
      <div className="flex items-center gap-1.5 px-2 border-r border-brand-border text-xs text-brand-text-secondary pr-3 font-mono">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        DEMO CONTROLS:
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChangeRole('admin')}
          className={`flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === 'admin'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-semibold'
              : 'hover:bg-brand-card-hover text-brand-text-secondary border border-transparent'
          }`}
          title="Admin Panel"
        >
          <Shield className="w-3 h-3" />
          ADMIN
        </button>

        <button
          onClick={() => onChangeRole('operator')}
          className={`flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === 'operator'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold'
              : 'hover:bg-brand-card-hover text-brand-text-secondary border border-transparent'
          }`}
          title="Operator Panel"
        >
          <Headphones className="w-3 h-3" />
          OPERATOR
        </button>

        <button
          onClick={() => onChangeRole('technician')}
          className={`flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === 'technician'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'hover:bg-brand-card-hover text-brand-text-secondary border border-transparent'
          }`}
          title="Technician Panel"
        >
          <Wrench className="w-3 h-3" />
          TECHNICIAN
        </button>

        <button
          onClick={() => onChangeRole('engineer')}
          className={`flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === 'engineer'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold'
              : 'hover:bg-brand-card-hover text-brand-text-secondary border border-transparent'
          }`}
          title="Engineer Panel"
        >
          <ShieldAlert className="w-3 h-3" />
          ENGINEER
        </button>
      </div>

      <div className="flex items-center gap-1.5 pl-3 border-l border-brand-border">
        {/* Reset State Button */}
        <button
          onClick={() => {
            if (confirm('A jeni të sigurtë që dëshironi të fshini ndryshimet dhe të kaloni të dhënat në gjendjen fillestare? (LocalStorage do të resetohet)')) {
              onResetData();
            }
          }}
          className="p-1.5 hover:bg-brand-card-hover rounded-full text-brand-text-secondary hover:text-brand-text-primary transition-colors duration-200"
          title="Rivendos të dhënat fillestare"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
