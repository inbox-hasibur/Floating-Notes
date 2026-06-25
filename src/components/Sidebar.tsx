'use client';

import { useNoteStore } from '@/store/useNoteStore';
import { Plus, Settings, Search } from 'lucide-react';

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNoteId } = useNoteStore();

  return (
    <aside className="w-64 h-full bg-[#1e2329] text-gray-300 flex flex-col border-r border-zinc-800">
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <h1 className="font-semibold text-white tracking-wide">Floating Notes</h1>
      </div>
      
      <div className="p-3">
        <button 
          onClick={addNote}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
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
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                    activeNoteId === note.id 
                      ? 'bg-zinc-800 text-white' 
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  {note.title || 'Untitled Note'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 flex gap-4 text-zinc-400">
        <button className="hover:text-white transition-colors"><Settings size={18} /></button>
        <button className="hover:text-white transition-colors"><Search size={18} /></button>
      </div>
    </aside>
  );
}
