'use client';

import { useState, useRef, useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { useSession, signIn, signOut } from 'next-auth/react';
import { migrateLocalToCloud } from '@/lib/migrate';
import { useTheme } from 'next-themes';
import { Plus, LogIn, LogOut, Cloud, Loader2, Sun, Moon, Mail, Lock, UserPlus, Pencil, Trash2 } from 'lucide-react';

export default function Sidebar() {
  const { notes, activeNoteId, addNote, updateNote, deleteNote, setActiveNoteId, floatingWindowOpen } = useNoteStore();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitleId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTitleId]);

  const startEditing = (id: string, currentTitle: string) => {
    setEditingTitleId(id);
    setEditTitle(currentTitle);
  };

  const saveTitle = () => {
    if (editingTitleId && editTitle.trim()) {
      updateNote(editingTitleId, { title: editTitle.trim() });
    }
    setEditingTitleId(null);
    setEditTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      setEditingTitleId(null);
      setEditTitle('');
    }
  };

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      await signIn('credentials', { email, password, redirect: false });
    } else {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        setError('Invalid email or password');
      }
    }
    setShowAuth(false);
    setEmail('');
    setPassword('');
    setName('');
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
                <button onClick={() => { if (editingTitleId !== note.id) setActiveNoteId(note.id); }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors group"
                  style={{
                    background: activeNoteId === note.id ? 'var(--bg-card)' : 'transparent',
                    color: activeNoteId === note.id ? 'var(--text)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => { if (activeNoteId !== note.id) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                  onMouseLeave={(e) => { if (activeNoteId !== note.id) e.currentTarget.style.background = 'transparent'; }}>
                  {editingTitleId === note.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={handleTitleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-xs outline-none border-b border-blue-500 px-0 py-0"
                      style={{ color: 'var(--text)' }}
                    />
                  ) : (
                    <span className="flex-1 truncate text-left">{note.title || 'Note'}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(note.id, note.title || 'Note');
                    }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this note?')) {
                        deleteNote(note.id);
                      }
                    }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={10} />
                  </button>
                  {floatingWindowOpen && activeNoteId === note.id && (
                    <span style={{ color: '#3b82f6', fontSize: 10, flexShrink: 0 }}>↗</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom: auth */}
      <div className="px-2.5 py-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>

        {!showAuth ? (
          isAuthenticated ? (
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
            <button onClick={() => setShowAuth(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              <LogIn size={12} /> Sign in
            </button>
          )
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-1.5 p-2 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1 mb-1">
              <button type="button" onClick={() => { setIsRegister(false); setError(''); }}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${!isRegister ? 'font-semibold' : ''}`}
                style={{ color: !isRegister ? 'var(--accent)' : 'var(--text-muted)' }}>Login</button>
              <button type="button" onClick={() => { setIsRegister(true); setError(''); }}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${isRegister ? 'font-semibold' : ''}`}
                style={{ color: isRegister ? 'var(--accent)' : 'var(--text-muted)' }}>Register</button>
            </div>

            {isRegister && (
              <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-2 py-1 rounded text-xs outline-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <Mail size={11} style={{ color: 'var(--text-muted)' }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-transparent text-xs outline-none" style={{ color: 'var(--text)' }} />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <Lock size={11} style={{ color: 'var(--text-muted)' }} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-transparent text-xs outline-none" style={{ color: 'var(--text)' }} />
            </div>

            {error && <p className="text-[10px] text-red-400">{error}</p>}

            <button type="submit" className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs text-white font-medium transition-colors"
              style={{ background: 'var(--accent)' }}>
              {isRegister ? <UserPlus size={12} /> : <LogIn size={12} />}
              {isRegister ? 'Create Account' : 'Login'}
            </button>
            <button type="button" onClick={() => { setShowAuth(false); setError(''); }}
              className="w-full text-[10px] py-1 transition-colors" style={{ color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}