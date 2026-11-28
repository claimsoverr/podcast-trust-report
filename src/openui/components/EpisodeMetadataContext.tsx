import { createContext, useContext } from "react";
import type { EpisodeMetadata } from "@/agent";

const EpisodeMetadataContext = createContext<EpisodeMetadata | null>(null);

export const EpisodeMetadataProvider = EpisodeMetadataContext.Provider;

export function useEpisodeMetadata(): EpisodeMetadata | null {
  return useContext(EpisodeMetadataContext);
}

const SeekTimestampContext = createContext<((seconds: number) => void) | null>(
  null,
);

export const SeekTimestampProvider = SeekTimestampContext.Provider;

export function useSeekTimestamp(): ((seconds: number) => void) | null {
  return useContext(SeekTimestampContext);
}
