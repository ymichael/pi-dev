import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

type WebSearchDetails = {
  resultCount?: number;
  error?: string;
};

function toolResult(text: string, details: WebSearchDetails) {
  return {
    content: [{ type: "text" as const, text }],
    details,
  };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web for current information. Use for finding recent news, looking up facts, researching topics, finding documentation, or answering questions requiring up-to-date information.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      count: Type.Optional(Type.Number({ description: "Number of results (default 10, max 20)" })),
    }),
    async execute(
      _toolCallId: string,
      params: { query: string; count?: number },
      _onUpdate: unknown,
      _ctx: unknown,
      signal?: AbortSignal,
    ) {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) {
        return toolResult(
          "Error: BRAVE_API_KEY environment variable not set.\nGet a free API key (2,000 searches/month) at: https://brave.com/search/api/",
          { error: "Missing API key" },
        );
      }

      try {
        const url = new URL("https://api.search.brave.com/res/v1/web/search");
        url.searchParams.set("q", params.query);
        url.searchParams.set("count", String(Math.min(params.count || 10, 20)));

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": apiKey,
          },
          signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`API error ${response.status}: ${text}`);
        }

        const data = await response.json();

        const results = (data.web?.results || []).map((r: { title: string; url: string; description: string }) => ({
          title: r.title,
          url: r.url,
          description: r.description,
        }));

        return toolResult(JSON.stringify(results, null, 2), {
          resultCount: results.length,
        });
      } catch (error) {
        return toolResult(`Error: ${(error as Error).message}`, {
          error: (error as Error).message,
        });
      }
    },
  });
}
