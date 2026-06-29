'use client';

import { useNoteStore } from '@/store/useNoteStore';
import { ExternalLink, Dock } from 'lucide-react';

export default function FloatingDock() {
  const { activeNoteId, floatingWindowOpen, setFloatingWindowOpen } = useNoteStore();

  if (!activeNoteId) return null;

  return (
    <button
      onClick={() => setFloatingWindowOpen(!floatingWindowOpen)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
      style={{
        background: floatingWindowOpen ? 'var(--accent)' : 'var(--bg-alt)',
        color: floatingWindowOpen ? '#ffffff' : 'var(--text)',
        border: '1px solid',
        borderColor: floatingWindowOpen ? 'var(--accent)' : 'var(--border)',
      }}
      title={floatingWindowOpen ? 'Close floating window' : 'Float note in popup'}
    >
      {floatingWindowOpen ? <Dock size={14} /> : <ExternalLink size={14} />}
      <span className="hidden sm:inline">{floatingWindowOpen ? 'Dock' : 'Float'}</span>
    </button>
  );
}