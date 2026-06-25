'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useNoteStore } from '@/store/useNoteStore';
import { useEffect, useRef } from 'react';

export default function Editor() {
  const { notes, activeNoteId, updateNote } = useNoteStore();
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  if (!activeNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#15181c] text-zinc-500">
        <p>Select a note or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#15181c] text-zinc-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
