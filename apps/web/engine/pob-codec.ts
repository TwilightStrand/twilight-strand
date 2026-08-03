import pako from "pako";

const MAX_DECODE_SIZE = 32 * 1024 * 1024;

function toUrlSafeBase64(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

function fromUrlSafeBase64(urlSafe: string): string {
  return urlSafe.replace(/-/g, "+").replace(/_/g, "/");
}

export function decodePobCode(code: string): string | null {
  try {
    const cleaned = code.replace(/\s/g, "");
    if (cleaned.length < 20 || cleaned.length > MAX_DECODE_SIZE) return null;

    const b64 = fromUrlSafeBase64(cleaned);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoded = pako.inflate(bytes);
    const xml = new TextDecoder().decode(decoded);
    if (!xml.includes("<?xml") && !xml.includes("<PathOfBuilding")) {
      return null;
    }
    return xml;
  } catch {
    return null;
  }
}

export function encodePobCode(xml: string): string {
  const compressed = pako.deflate(xml);
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return toUrlSafeBase64(btoa(binary));
}

export type BuildInputKind =
  | "pob-code"
  | "pastebin-url"
  | "pobbin-url"
  | "raw-xml"
  | "unknown";

export function classifyBuildInput(input: string): BuildInputKind {
  const trimmed = input.trim();

  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<PathOfBuilding")) {
    return "raw-xml";
  }

  if (trimmed.includes("pastebin.com/")) return "pastebin-url";
  if (trimmed.includes("pobb.in/")) return "pobbin-url";

  const cleaned = trimmed.replace(/\s/g, "");
  if (cleaned.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(cleaned)) {
    return "pob-code";
  }

  return "unknown";
}
