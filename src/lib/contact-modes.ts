export const CONTACT_MODES = [
  "Call",
  "Message",
  "WhatsApp",
  "Instagram",
  "YouTube",
  "Email",
  "Direct",
  "LinkedIn"
] as const;

export type ContactMode = (typeof CONTACT_MODES)[number];

export function normalizeContactModes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((mode) => mode.trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((mode) => mode.trim())
      .filter(Boolean);
  }

  return ["Call"];
}

export function formatContactModes(modes: string[] | string | null | undefined) {
  return normalizeContactModes(modes).join(", ");
}

export function countContactModes(
  clients: Array<{ contactMode: string | string[] | null | undefined }>
) {
  const counts: Record<string, number> = {};

  for (const client of clients) {
    for (const mode of normalizeContactModes(client.contactMode)) {
      counts[mode] = (counts[mode] || 0) + 1;
    }
  }

  return counts;
}
