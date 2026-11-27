import { tool } from "ai";
import { z } from "zod";
import { createProxiedFetch } from "./proxyFetch";

interface ExaSearchResultItem {
  title?: string | null;
  url?: string;
  summary?: string;
  publishedDate?: string;
}

interface ExaSearchResponse {
  results?: ExaSearchResultItem[];
}

export function createWebSearchTool(options: {
  apiKey: string;
  corsProxyUrl: string;
  signal?: AbortSignal;
}) {
  const { apiKey, corsProxyUrl, signal } = options;
  const proxiedFetch = createProxiedFetch(corsProxyUrl, () => signal);

  return tool({
    description:
      "Searches the web via Exa and returns relevant pages with short summaries. Use it to fact-check factual Claims made in the Episode and research Guest or Host background.",
    inputSchema: z.object({
      query: z.string().describe("Focused web search query"),
      numResults: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Number of results to return (default 5, max 10)"),
    }),
    execute: async ({ query, numResults }) => {
      const cleanKey = apiKey.trim();
      if (!cleanKey) {
        return {
          success: false,
          error: "Exa API Key is not configured.",
        };
      }

      try {
        const response = await proxiedFetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-api-key": cleanKey,
          },
          body: JSON.stringify({
            query,
            numResults: numResults ?? 5,
            contents: { summary: true },
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: `Exa search failed with status ${response.status} (${response.statusText}).`,
          };
        }

        const data = (await response.json()) as ExaSearchResponse;
        const results = (data.results ?? []).map((item) => ({
          title: item.title ?? null,
          url: item.url ?? "",
          summary: item.summary ?? "",
          ...(item.publishedDate ? { publishedDate: item.publishedDate } : {}),
        }));

        return {
          success: true,
          results,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        return {
          success: false,
          error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
}
