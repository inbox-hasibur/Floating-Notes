/**
 * Floating Window Utility
 * 
 * Opens a note in a draggable, resizable popup overlay within the same page.
 * Works fully offline - no new browser window needed.
 */

export interface FloatingPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const STORAGE_KEY = 'floating-notes-popup-state';

export function savePopupState(state: FloatingPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadPopupState(): FloatingPosition | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function getDefaultPosition(): FloatingPosition {
  return {
    x: Math.round((window.innerWidth - 640) / 2),
    y: Math.round((window.innerHeight - 480) / 2),
    width: 640,
    height: 480,
  };
}