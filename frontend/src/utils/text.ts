const MOJIBAKE_MARKERS = /[ÃÂ�]/;

function decodeUtf8Mojibake(value: string): string {
  const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function normalizeDisplayText(value: string | null | undefined): string {
  const text = String(value ?? "");
  if (!text || !MOJIBAKE_MARKERS.test(text)) {
    return text;
  }

  try {
    const decoded = decodeUtf8Mojibake(text);
    return decoded.includes("\uFFFD") ? text : decoded;
  } catch {
    return text;
  }
}
