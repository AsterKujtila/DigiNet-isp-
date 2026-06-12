import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Trash2, X, AlertTriangle, CheckSquare, Square, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemType: 'client' | 'ticket';
  itemMetadata: { label: string; value: string }[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemType,
  itemMetadata,
}) => {
  const [isUnderstandChecked, setIsUnderstandChecked] = useState(false);

  // Reset checkmark when modal state toggles
  useEffect(() => {
    if (isOpen) {
      setIsUnderstandChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="confirmation-modal-overlay" className="fixed inset-0 bg-[#040811]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          id="confirmation-modal-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-brand-card border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
        >
          {/* Accent Border Indicator */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-600"></div>

          {/* Header Section */}
          <div className="bg-[#0b1021] p-5 border-b border-brand-border/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-white tracking-wide uppercase">{title}</h3>
                <span className="text-[10px] text-brand-text-muted uppercase font-semibold">Veprim i pakthyeshëm i fshirjes</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-brand-border/40 border border-transparent hover:border-brand-border/55 rounded-xl text-brand-text-muted hover:text-white transition duration-150 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Section */}
          <div className="p-6 space-y-4">
            
            {/* Warning Message Statement */}
            <p className="text-xs text-brand-text-primary/90 leading-relaxed font-sans bg-amber-500/5 p-3.5 border border-amber-500/20 rounded-2xl">
              <span className="font-bold text-brand-accent-amber block mb-1">PARALAJMËRIM:</span>
              {message}
            </p>

            {/* Metadatat e Strukturuara si HUD */}
            <div className="bg-[#050914] p-4 rounded-2xl border border-brand-border/50 text-xs font-mono space-y-2.5">
              <span className="text-[10px] text-brand-accent-blue font-bold uppercase tracking-wider block border-b border-brand-border/30 pb-1.5">
                {itemType === 'client' ? 'DETAJET E KLIENTIT QË DO TË FSHIHET' : 'DETAJET E BILETËS QË DO TË FSHIHET'}
              </span>
              
              {itemMetadata.map((meta, i) => (
                <div key={i} className="flex justify-between items-start gap-4">
                  <span className="text-brand-text-muted shrink-0 uppercase text-[10px]">{meta.label}:</span>
                  <span className="text-white font-bold text-right truncate drop-shadow">{meta.value}</span>
                </div>
              ))}
            </div>

            {/* Checkbox Warning to Prevent Accidental Fast Clicks */}
            <button
              type="button"
              onClick={() => setIsUnderstandChecked(!isUnderstandChecked)}
              className="flex items-start gap-2.5 p-3 bg-brand-border/10 hover:bg-brand-border/20 border border-brand-border/30 rounded-2xl w-full text-left transition duration-150 cursor-pointer text-xs"
            >
              <div className="shrink-0 mt-0.5 text-brand-accent-blue">
                {isUnderstandChecked ? (
                  <CheckSquare className="w-4 h-4 text-red-500" />
                ) : (
                  <Square className="w-4 h-4 text-brand-text-secondary" />
                )}
              </div>
              <span className="text-brand-text-secondary leading-normal select-none">
                Kuptoj që ky veprim do të fshijë përgjithmonë këtë rekord nga sistemi dhe nuk mund të rikthehet më.
              </span>
            </button>
          </div>

          {/* Action Footer */}
          <div className="bg-[#0b1021] p-4 border-t border-brand-border/40 flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 hover:bg-brand-border/40 text-brand-text-primary rounded-xl text-xs font-mono font-bold border border-brand-border/55 transition duration-150 cursor-pointer"
            >
              ANULO
            </button>
            <button
              onClick={() => {
                if (isUnderstandChecked) {
                  onConfirm();
                }
              }}
              disabled={!isUnderstandChecked}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition duration-150 cursor-pointer ${
                isUnderstandChecked 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/10' 
                  : 'bg-red-500/20 text-red-500/50 cursor-not-allowed border border-red-500/10'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              KONFIRMO FSHIRJEN
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
