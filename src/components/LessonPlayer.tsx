"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};

type YTPlayerOptions = {
  videoId?: string;
  width?: number | string;
  height?: number | string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number }) => void;
  };
};

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const HEARTBEAT_MS = 30_000;
const API_SRC = "https://www.youtube.com/iframe_api";

type Props = {
  lessonId: number;
  youtubeId: string;
  durationSec: number | null;
  initialWatchedSec: number;
  alreadyCompleted: boolean;
};

export function LessonPlayer({
  lessonId,
  youtubeId,
  durationSec,
  initialWatchedSec,
  alreadyCompleted,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const watchedRef = useRef<number>(initialWatchedSec);
  const [watched, setWatched] = useState(initialWatchedSec);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [certSerial, setCertSerial] = useState<string | null>(null);

  useEffect(() => {
    let player: YTPlayer | null = null;
    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;
      player = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            if (initialWatchedSec > 5) {
              e.target.seekTo(Math.max(0, initialWatchedSec - 5), true);
            }
          },
        },
      });
      playerRef.current = player;
    };

    if (window.YT?.Player) {
      init();
    } else {
      if (!document.querySelector(`script[src="${API_SRC}"]`)) {
        const tag = document.createElement("script");
        tag.src = API_SRC;
        document.body.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
    }

    return () => {
      cancelled = true;
      try {
        player?.destroy?.();
      } catch {
        // best-effort cleanup; iframe may already be gone
      }
      playerRef.current = null;
    };
  }, [youtubeId, initialWatchedSec]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const now = Math.floor(p.getCurrentTime() || 0);
      if (now <= watchedRef.current) return;

      watchedRef.current = now;
      setWatched(now);

      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId, watchedSec: now }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            completed?: boolean;
            certificateSerial?: string | null;
          };
          if (data.completed) setCompleted(true);
          if (data.certificateSerial) setCertSerial(data.certificateSerial);
        }
      } catch {
        // swallow — next heartbeat will retry
      }
    }, HEARTBEAT_MS);

    return () => clearInterval(interval);
  }, [lessonId]);

  const pct =
    durationSec && durationSec > 0
      ? Math.min(100, Math.round((watched / durationSec) * 100))
      : 0;

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {certSerial && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">🎉 You completed the course!</p>
          <Link
            href={`/cert/${certSerial}`}
            className="mt-1 inline-block font-medium underline"
          >
            View your certificate →
          </Link>
        </div>
      )}

      {completed ? (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
          <span aria-hidden>✓</span> Completed
        </div>
      ) : durationSec ? (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-900 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {formatTime(watched)} / {formatTime(durationSec)} watched · auto-completes at 90%
          </p>
        </div>
      ) : null}
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
