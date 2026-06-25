'use client';

import { useNoteStore } from '@/store/useNoteStore';
import { Plus } from 'lucide-react';

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNoteId, floatingWindowOpen } = useNoteStore();

  return (
    <aside className="w-64 h-full bg-[#1e2329] text-gray-300 flex flex-col border-r border-zinc-800">
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <h1 className="font-semibold text-white tracking-wide">Floating Notes</h1>
        {floatingWindowOpen && (
          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            ● Floating
          </span>
        )}
      </div>
      
      <div className="p-3">
        <button 
          onClick={addNote}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors active:scale-95"
        >
          <Plus size={16} />
          <span>New Note</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
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

      <div className="p-4 border-t border-zinc-800">
        <p className="text-[11px] text-zinc-600 text-center">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>
      </div>
    </aside>
  );
}
