/**
 * Floating Window Utility
 * 
 * Opens a note in a separate floating popup window.
 */

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
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 8px;
      background: #1e2329;
      border-bottom: 1px solid #27272a;
      flex-shrink: 0;
      user-select: none;
    }
    .top-bar button {
      background: none; border: none; color: #52525b; cursor: pointer;
      padding: 2px 6px; border-radius: 3px; font-size: 11px;
      line-height: 1; transition: all 0.12s ease;
    }
    .top-bar button:hover { background: #27272a; color: #e4e4e7; }
    .pin-label {
      font-size: 11px;
      color: #52525b;
      cursor: default;
    }
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

export function openPopupWindow(
  noteId: string,
  noteTitle: string,
  config: FloatingWindowConfig = { width: 480, height: 400 }
): Window | null {
  const { width, height } = config;
  const left = config.left ?? Math.round((screen.width - width) / 2);
  const top = config.top ?? Math.round((screen.height - height) / 2);

  const features = [
    `width=${width}`, `height=${height}`, `left=${left}`, `top=${top}`,
    'menubar=no', 'toolbar=no', 'location=no', 'status=no',
    'resizable=yes', 'scrollbars=yes',
  ].join(',');

  return window.open(
    `/floating?noteId=${noteId}&title=${encodeURIComponent(noteTitle)}`,
    `float-${noteId}`,
    features
  );
}

export function closeFloatingWindow(win: Window | null): void {
  if (win && !win.closed) win.close();
}