/**
 * Floating Window Utility
 * 
 * Opens a note in a true PiP (Picture-in-Picture) style popup
 * like Google FIFA World Cup score cards.
 */

interface FloatingWindowConfig {
  width: number;
  height: number;
  left?: number;
  top?: number;
}

export function openPopupWindow(
  noteId: string,
  noteTitle: string,
  config: FloatingWindowConfig = { width: 300, height: 180 }
): Window | null {
  const { width, height } = config;
  // Position at bottom-right corner with 20px margin
  const left = config.left ?? Math.round(screen.width - width - 20);
  const top = config.top ?? Math.round(screen.height - height - 80);

  const features = [
    `width=${width}`, `height=${height}`, `left=${left}`, `top=${top}`,
    'menubar=no', 'toolbar=no', 'location=no', 'status=no',
    'resizable=yes', 'scrollbars=no',
    'popup=1', // True popup mode - removes all browser chrome
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