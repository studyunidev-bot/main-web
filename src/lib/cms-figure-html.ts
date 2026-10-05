/**
 * Quill 2's Image blot does not keep <figure>/<figcaption>.
 * Convert at the editor boundary so stored CMS HTML stays semantic
 * while the editor round-trips caption on img[data-caption].
 */
function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeAttr(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

/** CMS / frontend HTML → Quill-safe img[data-caption] */
export function toEditorHtml(html: string): string {
  if (!html) return "";
  return html.replace(
    /<figure\b[^>]*>\s*(<img\b[^>]*>)\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi,
    (_match, imgTag: string, captionHtml = "") => {
      const caption = stripTags(captionHtml);
      if (!caption) return imgTag;
      if (/\sdata-caption\s*=/i.test(imgTag)) return imgTag;
      return imgTag.replace(/<img\b/i, `<img data-caption="${escapeAttr(caption)}"`);
    },
  );
}

/** Quill HTML → stored semantic figure + figcaption */
export function fromEditorHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<img\b([^>]*?)>/gi, (full, attrs: string) => {
    const capMatch = attrs.match(/\sdata-caption\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (!capMatch) return full;
    const caption = unescapeAttr(capMatch[2] ?? capMatch[3] ?? "").trim();
    const cleanAttrs = attrs.replace(/\sdata-caption\s*=\s*("([^"]*)"|'([^']*)')/i, "");
    const img = `<img${cleanAttrs}>`;
    if (!caption) return img;
    return `<figure>${img}<figcaption>${escapeAttr(caption)}</figcaption></figure>`;
  });
}
