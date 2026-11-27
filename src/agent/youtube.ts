import { Innertube } from "youtubei.js/web.bundle";
import { createProxiedFetch } from "./proxyFetch";
import type { EpisodeMetadata, EpisodeTranscript } from "./types";

interface Json3CaptionEvent {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{
    utf8?: string;
  }>;
}

interface Json3CaptionsResponse {
  events?: Json3CaptionEvent[];
}

interface CachedYoutubeClient {
  clientPromise: Promise<Innertube>;
  signalRef: { current: AbortSignal | undefined };
}

const clientCache = new Map<string, CachedYoutubeClient>();

function getYoutubeClient(
  corsProxyUrl: string,
  signal?: AbortSignal,
): Promise<Innertube> {
  const cacheKey = corsProxyUrl.trim();
  const existing = clientCache.get(cacheKey);
  if (existing) {
    existing.signalRef.current = signal;
    return existing.clientPromise;
  }

  const signalRef: { current: AbortSignal | undefined } = { current: signal };
  const proxiedFetch = createProxiedFetch(corsProxyUrl, () => signalRef.current);

  const clientPromise = Innertube.create({
    fetch: proxiedFetch,
  }).catch((error) => {
    clientCache.delete(cacheKey);
    throw error;
  });

  clientCache.set(cacheKey, { clientPromise, signalRef });
  return clientPromise;
}

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function normalizeYoutubeError(prefix: string, error: unknown): Error {
  if (isAbortError(error)) {
    return error as Error;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  if (
    message.includes("Could not find captions") ||
    message.includes("no transcript") ||
    message.includes("Transcript panel not found")
  ) {
    return new Error("No captions or transcript are available for this Episode.");
  }

  if (message.includes("unavailable")) {
    return new Error(
      "Episode is unavailable. It may be private, deleted, or region-restricted.",
    );
  }

  return new Error(`${prefix}: ${message}`);
}

export async function fetchEpisodeData(options: {
  episodeUrl: string;
  corsProxyUrl: string;
  signal?: AbortSignal;
  onMetadata?: (metadata: EpisodeMetadata) => void;
  onBeforeTranscript?: () => void;
}): Promise<{ metadata: EpisodeMetadata; transcript: EpisodeTranscript }> {
  const { episodeUrl, corsProxyUrl, signal, onMetadata, onBeforeTranscript } =
    options;

  const videoId = extractVideoId(episodeUrl);
  if (!videoId) {
    throw new Error(
      "Invalid YouTube Episode URL or video ID. Paste a valid YouTube URL (such as https://www.youtube.com/watch?v=...) or 11-character video ID.",
    );
  }

  throwIfAborted(signal);

  const youtube = await getYoutubeClient(corsProxyUrl, signal).catch((error) => {
    throw normalizeYoutubeError("Failed to initialize YouTube client", error);
  });

  throwIfAborted(signal);

  const info = await youtube
    .getBasicInfo(videoId, { client: "ANDROID" })
    .catch((error) => {
      throw normalizeYoutubeError("Failed to fetch Episode metadata", error);
    });

  const basicInfo = info.basic_info;
  if (!basicInfo) {
    throw new Error("Episode details not found. The Episode may be unavailable.");
  }

  const durationSeconds = basicInfo.duration || 0;
  const metadata: EpisodeMetadata = {
    videoId,
    title: basicInfo.title || "",
    author: basicInfo.author || basicInfo.channel?.name || "",
    description: basicInfo.short_description || "",
    durationSeconds,
    durationFormatted: formatTimestamp(durationSeconds),
  };

  onMetadata?.(metadata);
  throwIfAborted(signal);
  onBeforeTranscript?.();

  const captionTracks = info.captions?.caption_tracks ?? [];
  if (captionTracks.length === 0) {
    throw new Error(
      "No transcript is available for this Episode. Captions may be disabled.",
    );
  }

  const selectedTrack =
    captionTracks.find(
      (track) => track.language_code === "en" && track.kind !== "asr",
    ) ??
    captionTracks.find(
      (track) => track.language_code?.startsWith("en") && track.kind !== "asr",
    ) ??
    captionTracks.find((track) => track.language_code === "en") ??
    captionTracks.find((track) => track.language_code?.startsWith("en")) ??
    captionTracks[0];

  const captionUrl = new URL(selectedTrack.base_url, "https://www.youtube.com");
  captionUrl.searchParams.set("fmt", "json3");

  const proxiedFetch = createProxiedFetch(corsProxyUrl, () => signal);
  let response: Response;
  try {
    response = await proxiedFetch(captionUrl.toString());
  } catch (error) {
    throw normalizeYoutubeError("Failed to fetch Episode transcript", error);
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Episode transcript (${response.status} ${response.statusText}).`,
    );
  }

  const data = (await response.json()) as Json3CaptionsResponse;
  const events = data.events ?? [];

  const transcriptSegments = events
    .map((event) => {
      if (typeof event.tStartMs !== "number" || !event.segs) {
        return null;
      }

      const text = event.segs
        .map((seg) => seg.utf8 ?? "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      if (!text) {
        return null;
      }

      return {
        start: event.tStartMs / 1000,
        duration: (event.dDurationMs ?? 0) / 1000,
        text,
      };
    })
    .filter(
      (segment): segment is { start: number; duration: number; text: string } =>
        segment !== null,
    );

  if (transcriptSegments.length === 0) {
    throw new Error(
      "No transcript segments were found for this Episode. Captions may be empty.",
    );
  }

  const transcriptText = transcriptSegments
    .map((segment) => `[${formatTimestamp(segment.start)}] ${segment.text}`)
    .join("\n");

  const lastSegment = transcriptSegments[transcriptSegments.length - 1];
  const totalDuration =
    durationSeconds || lastSegment.start + lastSegment.duration;

  return {
    metadata,
    transcript: {
      videoId,
      transcript: transcriptText,
      segmentCount: transcriptSegments.length,
      durationFormatted: formatTimestamp(totalDuration),
    },
  };
}
