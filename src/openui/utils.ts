export function sanitizeHttpUrl(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatUrlHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") || url;
  } catch {
    return url;
  }
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function parseScoreValue(value: number | string | undefined | null): number {
  if (typeof value === "number") {
    return clampPercentage(value);
  }
  if (typeof value === "string") {
    const match = value.trim().match(/-?\d+(?:\.\d+)?/);
    if (match) {
      return clampPercentage(Number(match[0]));
    }
  }
  return 0;
}

export function parseTimestampToSeconds(
  timestamp: string | undefined | null,
): number | null {
  if (!timestamp) {
    return null;
  }

  const cleaned = timestamp.trim().replace(/^\[|\]$/g, "").trim();
  if (!cleaned) {
    return null;
  }

  const parts = cleaned.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const nums = parts.map((part) => Number(part));
  if (nums.some((num) => !Number.isInteger(num) || num < 0)) {
    return null;
  }

  if (nums.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds >= 60) {
      return null;
    }
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = nums;
  if (minutes >= 60 || seconds >= 60) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

export function buildYouTubeTimestampUrl(
  videoId: string | undefined | null,
  timestamp: string | undefined | null,
): string | null {
  if (!videoId || !videoId.trim()) {
    return null;
  }

  const seconds = parseTimestampToSeconds(timestamp);
  if (seconds === null) {
    return null;
  }

  return `https://youtube.com/watch?v=${encodeURIComponent(videoId.trim())}&t=${seconds}s`;
}

export function normalizeOpenUiResponse(raw: string): string {
  const trimmedStart = raw.trimStart();
  if (!trimmedStart.startsWith("```")) {
    return raw;
  }

  const firstNewline = trimmedStart.indexOf("\n");
  if (firstNewline === -1) {
    return "";
  }

  let body = trimmedStart.slice(firstNewline + 1);
  const trimmedEnd = body.trimEnd();
  if (trimmedEnd.endsWith("```")) {
    const lastFenceIndex = trimmedEnd.lastIndexOf("```");
    const beforeFence = trimmedEnd.slice(0, lastFenceIndex);
    if (beforeFence.endsWith("\n") || lastFenceIndex === 0) {
      body = beforeFence.trimEnd();
    }
  }

  return body;
}
