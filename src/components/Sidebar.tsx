'use client';

import { useState } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { useSession, signIn, signOut } from 'next-auth/react';
import { migrateLocalToCloud } from '@/lib/migrate';
import { useTheme } from 'next-themes';
import { Plus, LogIn, LogOut, Cloud, Loader2, Sun, Moon } from 'lucide-react';

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNoteId, floatingWindowOpen } = useNoteStore();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('Syncing...');
    try {
      const cloudNotes = await migrateLocalToCloud();
      setSyncMsg(cloudNotes.length > 0 ? `Merged ${cloudNotes.length} notes` : 'All synced');
    } catch {
      setSyncMsg('Sync failed');
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const isAuthenticated = status === 'authenticated';

  return (
    <aside className="w-56 h-full flex flex-col border-r" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text)' }}>FloatNote</h1>
        <div className="flex items-center gap-1">
          {floatingWindowOpen && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ color: '#3b82f6', borderColor: '#3b82f680', background: '#3b82f610' }}>
              ●
            </span>
          )}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2.5 space-y-1.5">
        <button onClick={addNote} className="w-full flex items-center justify-center gap-1.5 text-white py-1.5 rounded text-sm font-medium transition-colors active:scale-95"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
          <Plus size={14} /> New Note
        </button>
        {isAuthenticated && (
          <button onClick={handleSync} disabled={syncing} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <Cloud size={13} />}
            <span>{syncMsg || 'Sync'}</span>
          </button>
        )}
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-2">
        {notes.length === 0 ? (
          <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>No notes yet</p>
        ) : (
          <ul className="space-y-0.5">
            {notes.map((note) => (
              <li key={note.id}>
                <button onClick={() => setActiveNoteId(note.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-sm truncate flex items-center gap-1.5 transition-colors"
                  style={{
                    background: activeNoteId === note.id ? 'var(--bg-card)' : 'transparent',
                    color: activeNoteId === note.id ? 'var(--text)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => { if (activeNoteId !== note.id) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                  onMouseLeave={(e) => { if (activeNoteId !== note.id) e.currentTarget.style.background = 'transparent'; }}>
                  <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                  {floatingWindowOpen && activeNoteId === note.id && (
                    <span style={{ color: '#3b82f6', fontSize: 10 }}>↗</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom: user */}
      <div className="px-2.5 py-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>
        {isAuthenticated ? (
          <div className="flex items-center gap-2 px-1">
            {session?.user?.image && <img src={session.user.image} alt="" className="w-5 h-5 rounded-full" />}
            <span className="text-xs truncate flex-1" style={{ color: 'var(--text-muted)' }}>
              {session?.user?.name || session?.user?.email}
            </span>
            <button onClick={() => signOut()} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button onClick={() => signIn('google')} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            <LogIn size={12} /> Sign in with Google
          </button>
        )}
      </div>
    </aside>
  );
}