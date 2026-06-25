/**
 * Floating Window Utility
 * 
 * Manages Document Picture-in-Picture (PiP) and standard popup windows
 * for the un-docked note editor experience.
 */

// Ultra-minimal CSS for floating window
const FLOATING_STYLES = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #15181c;
      color: #d4d4d8;
      height: 100vh;
      overflow: hidden;
    }
    #floating-editor { height: 100vh; display: flex; flex-direction: column; }
    .top-bar {
      height: 28px;
      display: flex; align-items: center; justify-content: flex-end;
      padding: 0 6px;
      background: #1e2329;
      border-bottom: 1px solid #27272a;
      flex-shrink: 0;
    }
    .top-bar button {
      background: none; border: none; color: #52525b; cursor: pointer;
      padding: 2px 6px; border-radius: 3px; font-size: 11px;
      line-height: 1; transition: all 0.12s ease;
    }
    .top-bar button:hover { background: #27272a; color: #e4e4e7; }
    .content {
      flex: 1; padding: 16px 20px; overflow-y: auto;
      font-size: 14px; line-height: 1.6; color: #d4d4d8; outline: none;
    }
    .content:empty::before { content: attr(data-placeholder); color: #52525b; pointer-events: none; }
    .content p { margin-bottom: 4px; }
    .content h1 { font-size: 1.4em; font-weight: 600; margin: 12px 0 6px; color: #f4f4f5; }
    .content h2 { font-size: 1.2em; font-weight: 600; margin: 10px 0 4px; color: #f4f4f5; }
    .content ul, .content ol { padding-left: 20px; margin-bottom: 4px; }
    .content code { background: #27272a; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
    .content pre { background: #1a1d23; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
    .content blockquote { border-left: 2px solid #3b82f6; padding-left: 10px; color: #a1a1aa; margin: 6px 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
  </style>
`;

interface FloatingWindowConfig {
  width: number;
  height: number;
  left?: number;
  top?: number;
}

export function isPiPSupported(): boolean {
  return 'documentPictureInPicture' in window;
}

/**
 * Open a note in a minimal popup window
 */
export function openPopupWindow(
  noteId: string,
  noteTitle: string,
  config: FloatingWindowConfig = { width: 440, height: 400 }
): Window | null {
  const { width, height } = config;
  const left = config.left ?? Math.round((screen.width - width) / 2);
  const top = config.top ?? Math.round((screen.height - height) / 2);

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no', 'toolbar=no', 'location=no',
    'status=no', 'resizable=yes', 'scrollbars=yes',
  ].join(',');

  return window.open(
    `/floating?noteId=${noteId}&title=${encodeURIComponent(noteTitle)}`,
    `floating-note-${noteId}`,
    features
  );
}

/**
 * Open a note using the Document Picture-in-Picture API (Always-on-Top)
 */
export async function openPiPWindow(
  noteId: string,
  noteTitle: string,
  config: FloatingWindowConfig = { width: 440, height: 400 }
): Promise<Window | null> {
  if (!isPiPSupported()) {
    return openPopupWindow(noteId, noteTitle, config);
  }

  try {
    const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
      width: config.width,
      height: config.height,
    });

    const doc = pipWindow.document;
    doc.head.insertAdjacentHTML('beforeend', FLOATING_STYLES);

    doc.body.innerHTML = `
      <div id="floating-editor">
        <div class="top-bar">
          <button id="btn-pin" title="Pin (Always on Top)">📌</button>
          <button id="btn-close" title="Close">✕</button>
        </div>
        <div id="fc" class="content" contenteditable="true" data-placeholder="Write..."></div>
      </div>
    `;

    let isPinned = true;
    const btnPin = doc.getElementById('btn-pin');
    const btnClose = doc.getElementById('btn-close');

    btnPin?.addEventListener('click', async () => {
      isPinned = !isPinned;
      if (isPinned) {
        btnPin.textContent = '📌';
        btnPin.title = 'Pin (Always on Top)';
        // Re-request PiP to bring back on top
        try {
          const newPip = await (window as any).documentPictureInPicture.requestWindow({
            width: config.width,
            height: config.height,
          });
          newPip.document.head.insertAdjacentHTML('beforeend', FLOATING_STYLES);
          newPip.document.body.innerHTML = doc.body.innerHTML;
          // Transfer content
          const newContent = newPip.document.getElementById('fc');
          if (newContent) newContent.innerHTML = doc.getElementById('fc')?.innerHTML || '';
          pipWindow.close();
          return newPip;
        } catch {}
      } else {
        btnPin.textContent = '📍';
        btnPin.title = 'Unpinned — click to pin again';
      }
    });

    btnClose?.addEventListener('click', () => pipWindow.close());

    const contentDiv = doc.getElementById('fc');
    if (contentDiv) {
      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const note = parsed?.state?.notes?.find((n: any) => n.id === noteId);
          if (note?.content) contentDiv.innerHTML = note.content;
        } catch {}
      }
    }

    const syncInterval = setInterval(() => {
      if (pipWindow.closed) { clearInterval(syncInterval); return; }
      const pipContent = doc.getElementById('fc')?.innerHTML;
      if (!pipContent) return;

      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const state = parsed?.state;
          if (state) {
            const idx = state.notes?.findIndex((n: any) => n.id === noteId);
            if (idx !== -1 && state.notes[idx]?.content !== pipContent) {
              state.notes[idx].content = pipContent;
              state.notes[idx].updatedAt = Date.now();
              const tempDiv = doc.createElement('div');
              tempDiv.innerHTML = pipContent;
              const firstText = tempDiv.textContent?.trim() || '';
              state.notes[idx].title = firstText.split('\n')[0]?.substring(0, 50) || 'Untitled';
              localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
            }
          }
        } catch {}
      }
    }, 500);

    pipWindow.addEventListener('pagehide', () => clearInterval(syncInterval));
    return pipWindow;
  } catch {
    return null;
  }
}

export function closeFloatingWindow(win: Window | null): void {
  if (win && !win.closed) win.close();
}