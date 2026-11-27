import { createContext, useContext } from "react";
import type { EpisodeMetadata } from "@/agent";

const EpisodeMetadataContext = createContext<EpisodeMetadata | null>(null);

export const EpisodeMetadataProvider = EpisodeMetadataContext.Provider;

export function useEpisodeMetadata(): EpisodeMetadata | null {
  return useContext(EpisodeMetadataContext);
}
