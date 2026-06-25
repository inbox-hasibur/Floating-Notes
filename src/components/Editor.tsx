'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useNoteStore } from '@/store/useNoteStore';
import { useEffect, useRef } from 'react';
import FloatingDock from './FloatingDock';

export default function Editor() {
  const { notes, activeNoteId, updateNote, floatingWindowOpen } = useNoteStore();
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storageListenerRef = useRef<(() => void) | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your note here...',
      }),
    ],
    content: activeNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeNoteId) return;

      const html = editor.getHTML();
      const text = editor.getText();
      const firstLine = text.split('\n')[0] || 'Untitled Note';

      // 1000ms debounce as requested
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        updateNote(activeNoteId, {
          content: html,
          title: firstLine.substring(0, 50),
        });
      }, 1000);
    },
  });

  // Update editor content when active note changes
  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content);
      }
    } else if (editor && !activeNote) {
      editor.commands.setContent('');
    }
  }, [activeNoteId, editor]);

  // Listen for localStorage changes from floating window (PiP/popup)
  useEffect(() => {
    if (!activeNoteId || !editor) return;

    // Poll localStorage for changes made by the floating window
    const storagePoll = setInterval(() => {
      if (!floatingWindowOpen) return;

      const stored = localStorage.getItem('floating-notes-storage');
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        const state = parsed?.state;
        if (!state) return;

        const note = state.notes?.find((n: any) => n.id === activeNoteId);
        if (note?.content && note.content !== editor.getHTML()) {
          // Only update if editor isn't focused (user is typing in main window)
          const isEditorFocused = window.document.activeElement?.closest('.ProseMirror');
          if (!isEditorFocused) {
            editor.commands.setContent(note.content);
          }
        }
      } catch {}
    }, 800);

    return () => clearInterval(storagePoll);
  }, [activeNoteId, editor, floatingWindowOpen]);

  if (!activeNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#15181c] text-zinc-500">
        <p>Select a note or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#15181c] text-zinc-100 overflow-y-auto">
      {/* Floating Dock Toolbar */}
      <div className="sticky top-0 z-10 bg-[#15181c]/80 backdrop-blur-sm border-b border-zinc-800 px-6 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-zinc-400 font-medium truncate">
            {activeNote?.title || 'Untitled Note'}
          </div>
          <FloatingDock />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
