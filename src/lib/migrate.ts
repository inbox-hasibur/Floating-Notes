import { Note } from '@/store/useNoteStore';

interface CloudNote {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  updatedAt: string;
}

/**
 * Merge local notes into the cloud database upon login.
 * Returns the merged cloud notes array.
 */
export async function migrateLocalToCloud(): Promise<CloudNote[]> {
  // 1. Get local notes from Zustand's localStorage
  const stored = localStorage.getItem('floating-notes-storage');
  if (!stored) return [];

  let localNotes: Note[] = [];
  try {
    const parsed = JSON.parse(stored);
    localNotes = parsed?.state?.notes || [];
  } catch {
    return [];
  }

  if (localNotes.length === 0) {
    // No local notes — just fetch cloud notes
    return fetchCloudNotes();
  }

  // 2. Push each local note to the cloud
  const uploadPromises = localNotes.map((note) =>
    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: note.title || 'Untitled Note',
        content: note.content || '',
        tags: [],
        color: 'default',
      }),
    }).then((res) => res.json())
  );

  await Promise.all(uploadPromises);

  // 3. Clear local notes after successful migration
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.state) {
      parsed.state.notes = [];
      parsed.state.activeNoteId = null;
      localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
    }
  } catch {}

  // 4. Fetch and return all cloud notes
  return fetchCloudNotes();
}

/**
 * Fetch all notes from the cloud for the logged-in user.
 */
export async function fetchCloudNotes(): Promise<CloudNote[]> {
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) return [];
    const data = await res.json();
    return data.notes || [];
  } catch {
    return [];
  }
}

/**
 * Sync a single note update to the cloud.
 */
export async function syncNoteToCloud(note: {
  id: string;
  title: string;
  content: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: note.id,
        title: note.title,
        content: note.content,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete a note from the cloud.
 */
export async function deleteCloudNote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notes?id=${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}