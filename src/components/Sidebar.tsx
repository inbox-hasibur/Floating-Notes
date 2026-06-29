'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNoteStore, Note } from '@/store/useNoteStore';
import { useSession, signIn, signOut } from 'next-auth/react';
import { migrateLocalToCloud, syncNoteToCloud } from '@/lib/migrate';
import { useTheme } from 'next-themes';
import {
  Plus, LogIn, LogOut, Cloud, Loader2, Sun, Moon, Mail, Lock, UserPlus,
  Search, Trash2, Tag, Palette, X, Check,
} from 'lucide-react';

const NOTE_COLORS = [
  { id: 'default', label: 'Default', color: 'transparent' },
  { id: 'red', label: 'Red', color: '#ef4444' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'yellow', label: 'Yellow', color: '#eab308' },
  { id: 'green', label: 'Green', color: '#22c55e' },
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'purple', label: 'Purple', color: '#a855f7' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
];

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNoteId, deleteNote, updateNote, searchQuery, setSearchQuery, floatingWindowOpen } = useNoteStore();
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
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated';

  // Auto-sync notes to cloud when they change
  useEffect(() => {
    if (!isAuthenticated || notes.length === 0) return;
    const timer = setInterval(() => {
      const activeNote = notes.find((n) => n.id === activeNoteId);
      if (activeNote && activeNote.content) {
        syncNoteToCloud({
          id: activeNote.id,
          title: activeNote.title,
          content: activeNote.content,
        });
      }
    }, 10000); // Auto-sync every 10 seconds
    return () => clearInterval(timer);
  }, [isAuthenticated, notes, activeNoteId]);

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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this note permanently?')) {
      deleteNote(id);
    }
  };

  const handleAddTag = (noteId: string) => {
    if (!tagInput.trim()) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const newTags = [...new Set([...note.tags, tagInput.trim().toLowerCase()])];
    updateNote(noteId, { tags: newTags });
    setTagInput('');
  };

  const handleRemoveTag = (noteId: string, tag: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    updateNote(noteId, { tags: note.tags.filter((t) => t !== tag) });
  };

  const handleSetColor = (noteId: string, color: string) => {
    updateNote(noteId, { color });
    setShowColorPicker(null);
  };

  // Filter notes by search query
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      note.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const getNoteColorStyle = (color: string) => {
    if (color === 'default') return {};
    return { borderLeft: `3px solid ${color}` };
  };

  return (
    <aside className="w-60 h-full flex flex-col border-r" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text)' }}>FloatNote</h1>
        <div className="flex items-center gap-1">
          {floatingWindowOpen && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ color: '#3b82f6', borderColor: '#3b82f680', background: '#3b82f610' }}>
              ●
            </span>
          )}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2.5 pt-2.5">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <Search size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none"
            style={{ color: 'var(--text)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2.5 space-y-1.5">
        <button
          onClick={addNote}
          className="w-full flex items-center justify-center gap-1.5 text-white py-1.5 rounded text-sm font-medium transition-colors active:scale-95"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
        >
          <Plus size={14} /> New Note
        </button>
        {isAuthenticated && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <Cloud size={13} />}
            <span>{syncMsg || 'Sync'}</span>
          </button>
        )}
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredNotes.length === 0 ? (
          <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>
            {searchQuery ? 'No notes match your search' : 'No notes yet'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filteredNotes.map((note) => (
              <li key={note.id}>
                <div
                  className="group relative rounded transition-colors"
                  style={{
                    background: activeNoteId === note.id ? 'var(--bg-card)' : 'transparent',
                    ...getNoteColorStyle(note.color),
                  }}
                >
                  <button
                    onClick={() => setActiveNoteId(note.id)}
                    className="w-full text-left px-2.5 py-1.5 pr-8 text-sm truncate flex flex-col gap-0.5 transition-colors"
                    style={{
                      color: activeNoteId === note.id ? 'var(--text)' : 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => { if (activeNoteId !== note.id) e.currentTarget.parentElement!.style.background = 'var(--bg-alt)'; }}
                    onMouseLeave={(e) => { if (activeNoteId !== note.id) e.currentTarget.parentElement!.style.background = 'transparent'; }}
                  >
                    <span className="flex-1 truncate text-left">{note.title || 'Untitled'}</span>
                    {note.tags.length > 0 && (
                      <span className="flex gap-1 flex-wrap">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1 py-0.5 rounded"
                            style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{note.tags.length - 3}</span>
                        )}
                      </span>
                    )}
                  </button>

                  {/* Action buttons (visible on hover) */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Color picker */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowColorPicker(showColorPicker === note.id ? null : note.id); }}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Color"
                      >
                        <Palette size={12} />
                      </button>
                      {showColorPicker === note.id && (
                        <div
                          className="absolute right-0 top-full mt-1 p-1.5 rounded-lg shadow-xl z-30 flex gap-1"
                          style={{ background: 'var(--popup-bg)', border: '1px solid var(--popup-border)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {NOTE_COLORS.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleSetColor(note.id, c.id)}
                              className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                              style={{
                                background: c.color || 'var(--bg-alt)',
                                border: '1px solid var(--color-picker-border)',
                                outline: note.color === c.id ? '2px solid var(--accent)' : 'none',
                                outlineOffset: 1,
                              }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTags(editingTags === note.id ? null : note.id); setTagInput(''); }}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Tags"
                      >
                        <Tag size={12} />
                      </button>
                      {editingTags === note.id && (
                        <div
                          className="absolute right-0 top-full mt-1 p-2 rounded-lg shadow-xl z-30 w-48"
                          style={{ background: 'var(--popup-bg)', border: '1px solid var(--popup-border)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <input
                              type="text"
                              placeholder="Add tag..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(note.id); }}
                              className="flex-1 px-2 py-1 rounded text-xs outline-none"
                              style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                            />
                            <button
                              onClick={() => handleAddTag(note.id)}
                              className="p-1 rounded transition-colors"
                              style={{ color: 'var(--accent)' }}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(note.id, tag)}
                                    className="hover:text-red-400 transition-colors"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom: note count + auth */}
      <div className="px-2.5 py-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? 's' : ''}
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