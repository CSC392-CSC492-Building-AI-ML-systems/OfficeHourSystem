const HTTP_URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

export type LocationTextPart =
  | { kind: "text"; value: string }
  | { kind: "link"; href: string; label: string };

function stripTrailingUrlPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/, "");
}

/** Split location text into plain text and http(s) URL segments. */
export function splitLocationText(text: string): LocationTextPart[] {
  const parts: LocationTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(HTTP_URL_PATTERN)) {
    const raw = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, index) });
    }

    const href = stripTrailingUrlPunctuation(raw);
    parts.push({ kind: "link", href, label: href });
    lastIndex = index + href.length;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ kind: "text", value: text });
  }

  return parts;
}

export function locationContainsLink(text: string): boolean {
  return /https?:\/\//i.test(text);
}
