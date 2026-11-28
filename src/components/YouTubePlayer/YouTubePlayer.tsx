import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui";
import styles from "./YouTubePlayer.module.css";

const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
}

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  ref?: Ref<YouTubePlayerHandle>;
}

function buildEmbedUrl(videoId: string): string {
  const base = `${YOUTUBE_EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?enablejsapi=1&rel=0`;
  if (
    typeof window !== "undefined" &&
    /^https?:$/.test(window.location.protocol)
  ) {
    return `${base}&origin=${encodeURIComponent(window.location.origin)}`;
  }
  return base;
}

export function YouTubePlayer({ videoId, title, ref }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isReadyRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  const postCommand = useCallback(
    (func: string, args: unknown[] = []) => {
      const targetWindow = iframeRef.current?.contentWindow;
      if (!targetWindow) {
        return;
      }
      targetWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        YOUTUBE_EMBED_ORIGIN,
      );
    },
    [],
  );

  const flushPendingSeek = useCallback(() => {
    const pending = pendingSeekRef.current;
    if (pending === null) {
      return;
    }
    pendingSeekRef.current = null;
    postCommand("seekTo", [pending, true]);
    postCommand("playVideo");
  }, [postCommand]);

  useEffect(() => {
    isReadyRef.current = false;
    pendingSeekRef.current = null;
  }, [videoId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== YOUTUBE_EMBED_ORIGIN) {
        return;
      }
      if (typeof event.data !== "string") {
        return;
      }

      try {
        const payload: unknown = JSON.parse(event.data);
        if (
          typeof payload === "object" &&
          payload !== null &&
          "event" in payload &&
          (payload.event === "onReady" || payload.event === "initialDelivery")
        ) {
          isReadyRef.current = true;
          flushPendingSeek();
        }
      } catch {
        // Ignore non-JSON messages from the embed frame.
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [flushPendingSeek]);

  const handleIframeLoad = () => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) {
      return;
    }
    targetWindow.postMessage(
      JSON.stringify({ event: "listening", id: 1 }),
      YOUTUBE_EMBED_ORIGIN,
    );
    flushPendingSeek();
  };

  useImperativeHandle(
    ref,
    () => ({
      seekTo(seconds: number) {
        const target = Math.max(0, Math.floor(seconds));
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            const prefersReducedMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            container.scrollIntoView({
              behavior: prefersReducedMotion ? "auto" : "smooth",
              block: "nearest",
            });
          }
        }

        if (isReadyRef.current) {
          postCommand("seekTo", [target, true]);
          postCommand("playVideo");
          return;
        }

        pendingSeekRef.current = target;
        postCommand("seekTo", [target, true]);
        postCommand("playVideo");
      },
    }),
    [postCommand],
  );

  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  return (
    <aside ref={containerRef} aria-label="Episode video player">
      <Card as="div" className={styles.playerCard}>
        <div className={styles.frameWrapper}>
          <iframe
            ref={iframeRef}
            className={styles.iframe}
            src={buildEmbedUrl(videoId)}
            title={title ? `YouTube video: ${title}` : "Episode YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={handleIframeLoad}
          />
        </div>
        <div className={styles.footer}>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            Open on YouTube
            <ExternalLink aria-hidden="true" size={12} />
          </a>
        </div>
      </Card>
    </aside>
  );
}
