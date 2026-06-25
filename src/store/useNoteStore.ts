import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface NoteState {
  notes: Note[];
  activeNoteId: string | null;
  addNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNoteId: (id: string | null) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,
      addNote: () => {
        const newNote: Note = {
          id: Date.now().toString(),
          title: '',
          content: '',
          updatedAt: Date.now(),
        }
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }))
      },
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          ),
        }))
      },
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }))
      },
      setActiveNoteId: (id) => set({ activeNoteId: id }),
    }),
    {
      name: 'floating-notes-storage',
    }
  )
)
