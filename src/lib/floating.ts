/**
 * Floating Window Utility
 * 
 * Manages Document Picture-in-Picture (PiP) and standard popup windows
 * for the un-docked note editor experience.
 */

// CSS to inject into the floating window head
const FLOATING_STYLES = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #15181c;
      color: #e4e4e7;
      height: 100vh;
      overflow: hidden;
    }
    #floating-editor {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .floating-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #1e2329;
      border-bottom: 1px solid #27272a;
      -webkit-app-region: drag;
      user-select: none;
    }
    .floating-header h2 {
      font-size: 13px;
      font-weight: 500;
      color: #a1a1aa;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 70%;
    }
    .floating-header-actions {
      display: flex;
      gap: 6px;
      -webkit-app-region: no-drag;
    }
    .floating-header-actions button {
      background: none;
      border: none;
      color: #71717a;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      transition: all 0.15s ease;
    }
    .floating-header-actions button:hover {
      background: #27272a;
      color: #e4e4e7;
    }
    .floating-content {
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
      font-size: 15px;
      line-height: 1.7;
      color: #d4d4d8;
      outline: none;
    }
    .floating-content:empty::before {
      content: attr(data-placeholder);
      color: #52525b;
      pointer-events: none;
    }
    .floating-content:focus {
      outline: none;
    }
    .floating-content p { margin-bottom: 8px; }
    .floating-content h1 { font-size: 1.5em; font-weight: 600; margin: 16px 0 8px; color: #f4f4f5; }
    .floating-content h2 { font-size: 1.25em; font-weight: 600; margin: 14px 0 6px; color: #f4f4f5; }
    .floating-content ul, .floating-content ol { padding-left: 24px; margin-bottom: 8px; }
    .floating-content code {
      background: #27272a;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    .floating-content pre {
      background: #1a1d23;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
    }
    .floating-content pre code {
      background: none;
      padding: 0;
    }
    .floating-content blockquote {
      border-left: 3px solid #3b82f6;
      padding-left: 12px;
      color: #a1a1aa;
      margin: 8px 0;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #52525b; }
  </style>
`;

interface FloatingWindowConfig {
  width: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
}

/**
 * Check if Document Picture-in-Picture API is supported
 */
export function isPiPSupported(): boolean {
  return 'documentPictureInPicture' in window;
}

/**
 * Open a note in a standard popup window
 */
export function openPopupWindow(
  noteId: string,
  noteTitle: string,
  config: FloatingWindowConfig = { width: 600, height: 500 }
): Window | null {
  const { width, height } = config;
  const left = config.left ?? Math.round((screen.width - width) / 2);
  const top = config.top ?? Math.round((screen.height - height) / 2);

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');

  const popup = window.open(
    `/floating?noteId=${noteId}&title=${encodeURIComponent(noteTitle)}`,
    `floating-note-${noteId}`,
    features
  );

  return popup;
}

/**
 * Open a note using the Document Picture-in-Picture API (Always-on-Top)
 */
export async function openPiPWindow(
  noteId: string,
  noteTitle: string,
  config: FloatingWindowConfig = { width: 600, height: 500 }
): Promise<Window | null> {
  if (!isPiPSupported()) {
    console.warn('Document Picture-in-Picture API not supported. Falling back to popup.');
    return openPopupWindow(noteId, noteTitle, config);
  }

  try {
    const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
      width: config.width,
      height: config.height,
    });

    // Inject styles into the PiP window
    const doc = pipWindow.document;
    doc.head.insertAdjacentHTML('beforeend', FLOATING_STYLES);

    // Build the floating editor HTML
    doc.body.innerHTML = `
      <div id="floating-editor">
        <div class="floating-header">
          <h2 id="floating-title">${escapeHtml(noteTitle) || 'Untitled Note'}</h2>
          <div class="floating-header-actions">
            <button id="btn-close" title="Close">✕</button>
          </div>
        </div>
        <div 
          id="floating-content" 
          class="floating-content" 
          contenteditable="true" 
          data-placeholder="Start typing..."
        ></div>
      </div>
    `;

    // Close button
    doc.getElementById('btn-close')?.addEventListener('click', () => {
      pipWindow.close();
    });

    // Sync content from parent to PiP
    const contentDiv = doc.getElementById('floating-content');
    if (contentDiv) {
      // Load initial content from localStorage
      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const state = parsed?.state;
          if (state) {
            const note = state.notes?.find((n: any) => n.id === noteId);
            if (note?.content) {
              contentDiv.innerHTML = note.content;
            }
          }
        } catch {}
      }
    }

    // Sync content from PiP back to parent via localStorage polling
    const syncInterval = setInterval(() => {
      if (pipWindow.closed) {
        clearInterval(syncInterval);
        return;
      }
      const pipContent = doc.getElementById('floating-content')?.innerHTML;
      if (pipContent) {
        // Write to localStorage so the parent can pick it up
        const stored = localStorage.getItem('floating-notes-storage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const state = parsed?.state;
            if (state) {
              const noteIndex = state.notes?.findIndex((n: any) => n.id === noteId);
              if (noteIndex !== -1 && state.notes[noteIndex]?.content !== pipContent) {
                state.notes[noteIndex].content = pipContent;
                state.notes[noteIndex].updatedAt = Date.now();
                // Update title from first line
                const tempDiv = doc.createElement('div');
                tempDiv.innerHTML = pipContent;
                const firstText = tempDiv.textContent?.trim() || '';
                const firstLine = firstText.split('\n')[0] || 'Untitled Note';
                state.notes[noteIndex].title = firstLine.substring(0, 50);
                localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
                // Update header title
                const titleEl = doc.getElementById('floating-title');
                if (titleEl) titleEl.textContent = firstLine.substring(0, 50);
              }
            }
          } catch {}
        }
      }
    }, 500);

    // Clean up interval when PiP closes
    pipWindow.addEventListener('pagehide', () => {
      clearInterval(syncInterval);
    });

    return pipWindow;
  } catch (error) {
    console.error('PiP request failed:', error);
    return null;
  }
}

/**
 * Close a floating window by reference
 */
export function closeFloatingWindow(win: Window | null): void {
  if (win && !win.closed) {
    win.close();
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}