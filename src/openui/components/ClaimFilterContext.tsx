import { createContext, useContext } from "react";

interface ClaimFilterContextValue {
  activeVerdict: string | null;
}

const ClaimFilterContext = createContext<ClaimFilterContextValue>({
  activeVerdict: null,
});

export const ClaimFilterProvider = ClaimFilterContext.Provider;

export function useClaimFilter(): ClaimFilterContextValue {
  return useContext(ClaimFilterContext);
}
