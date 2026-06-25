/**
 * Multi-Format Exporter
 * 
 * Exports notes as Markdown (.md), Plain Text (.txt), or HTML (.html).
 */

/**
 * Convert HTML content to Markdown (basic conversion)
 */
function htmlToMarkdown(html: string): string {
  let md = html;

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Bold & Italic
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');

  // Code blocks
  md = md.replace(/<pre><code>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');

  // Lists
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul[^>]*>/gi, '');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '');
  md = md.replace(/<\/ol>/gi, '\n');

  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  md = md.replace(/&/g, '&');
  md = md.replace(/</g, '<');
  md = md.replace(/>/g, '>');
  md = md.replace(/"/g, '"');
  md = md.replace(/&#39;/g, "'");

  // Clean up excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

/**
 * Strip HTML tags for plain text
 */
function htmlToPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  let text = div.textContent || div.innerText || '';
  // Clean up excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Wrap content in a standalone HTML page
 */
function wrapHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      color: #1a1a2e;
      line-height: 1.7;
    }
    h1 { font-size: 2em; margin-bottom: 8px; }
    h2 { font-size: 1.5em; margin: 24px 0 8px; }
    p { margin-bottom: 16px; }
    pre { background: #f4f4f5; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
    code { background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    blockquote { border-left: 3px solid #3b82f6; padding-left: 16px; color: #52525b; margin: 16px 0; }
    ul, ol { padding-left: 24px; margin-bottom: 16px; }
    li { margin-bottom: 4px; }
    hr { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a note as Markdown (.md)
 */
export function exportAsMarkdown(title: string, htmlContent: string) {
  const md = htmlToMarkdown(htmlContent);
  const header = `# ${title}\n\n`;
  downloadFile(header + md, `${sanitizeFilename(title)}.md`, 'text/markdown');
}

/**
 * Export a note as Plain Text (.txt)
 */
export function exportAsPlainText(title: string, htmlContent: string) {
  const text = htmlToPlainText(htmlContent);
  const header = `${title}\n${'='.repeat(title.length)}\n\n`;
  downloadFile(header + text, `${sanitizeFilename(title)}.txt`, 'text/plain');
}

/**
 * Export a note as HTML (.html)
 */
export function exportAsHtml(title: string, htmlContent: string) {
  const fullHtml = wrapHtml(title, htmlContent);
  downloadFile(fullHtml, `${sanitizeFilename(title)}.html`, 'text/html');
}

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100) || 'note';
}