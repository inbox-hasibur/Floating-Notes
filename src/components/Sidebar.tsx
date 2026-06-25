'use client';

import { useState } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { useSession, signIn, signOut } from 'next-auth/react';
import { migrateLocalToCloud, fetchCloudNotes } from '@/lib/migrate';
import { Plus, LogIn, LogOut, Cloud, Loader2 } from 'lucide-react';

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNoteId, floatingWindowOpen } = useNoteStore();
  const { data: session, status } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('Syncing...');
    try {
      const cloudNotes = await migrateLocalToCloud();
      if (cloudNotes.length > 0) {
        setSyncMsg(`Merged ${cloudNotes.length} notes`);
      } else {
        setSyncMsg('All synced');
      }
    } catch {
      setSyncMsg('Sync failed');
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const isAuthenticated = status === 'authenticated';

  return (
    <aside className="w-64 h-full bg-[#1e2329] text-gray-300 flex flex-col border-r border-zinc-800">
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <h1 className="font-semibold text-white tracking-wide">Floating Notes</h1>
        {floatingWindowOpen && (
          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            ● Float
          </span>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <button 
          onClick={addNote}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors active:scale-95"
        >
          <Plus size={16} />
          <span>New Note</span>
        </button>

        {isAuthenticated && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Cloud size={14} />
            )}
            <span>{syncMsg || 'Sync to Cloud'}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mt-1">
        {notes.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 mt-10">
            No notes yet. Create one!
          </div>
        ) : (
          <ul className="space-y-1 px-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  onClick={() => setActiveNoteId(note.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate flex items-center gap-2 ${
                    activeNoteId === note.id 
                      ? 'bg-zinc-800 text-white' 
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="flex-1 truncate">{note.title || 'Untitled Note'}</span>
                  {floatingWindowOpen && activeNoteId === note.id && (
                    <span className="text-blue-400 text-[10px] shrink-0">↗</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 space-y-2">
        <p className="text-[11px] text-zinc-600 text-center">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 px-2">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 truncate">
                {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('google')}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 py-2 rounded-md text-sm transition-colors border border-zinc-700"
          >
            <LogIn size={14} />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
}
