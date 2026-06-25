# Floating Notes — Your Notes, Anywhere, Always on Top

**URL:** [https://floating-notes.vercel.app/](https://floating-notes.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) ![NextAuth](https://img.shields.io/badge/NextAuth-black?style=for-the-badge&logo=next-auth&logoColor=white)

Floating Notes is a productivity app that lets you write notes in a browser and instantly "float" them into a separate, always-accessible window on your desktop. No more tab-switching — your notes stay visible while you work in other apps.

---

## Key Features

**Un-Dock Your Notes**
- **Float Mode:** One click pops your note into a separate, resizable window that stays on top of all other apps.
- **Always Accessible:** Write in one window, reference in another — perfect for research, coding, or quick memos.
- **Real-Time Sync:** Edits sync instantly between the main app and floating window.

**Rich Editing**
- **Formatting Toolbar:** Bold, italic, headings (H1/H2), bullet/numbered lists, blockquotes, and code blocks.
- **Auto-Save:** Notes save automatically as you type — no manual save button needed.
- **Multi-Format Export:** Download notes as Markdown (.md), Plain Text (.txt), or HTML (.html).

**Cloud Sync & Auth**
- **Google OAuth:** One-click sign-in with Google.
- **Email + Password:** Simple email-based login for quick access.
- **Local-First:** Works offline with localStorage. Cloud sync merges your notes when you log in.

**Clean, Minimal UI**
- **Dual Themes:** Dark mode (default) and light mode — toggle with one click.
- **Slim Floating Window:** Minimal toolbar, no clutter, just your content.
- **PWA Ready:** Install as a standalone app on your OS.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Editor:** TipTap (ProseMirror-based rich-text editor)
- **State Management:** Zustand with localStorage persistence
- **Auth:** NextAuth.js (Google OAuth + Credentials)
- **Database:** MongoDB Atlas with Mongoose
- **Theming:** next-themes (Dark + Light)
- **Deployment:** Vercel