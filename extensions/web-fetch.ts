import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

type WebFetchDetails = {
  url?: string;
  length?: number;
  truncated?: boolean;
  error?: string;
};

function toolResult(text: string, details: WebFetchDetails) {
  return {
    content: [{ type: "text" as const, text }],
    details,
  };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_fetch",
    label: "Web Fetch",
    description:
      "Fetch a webpage and return its content as clean markdown. Use this to read articles, documentation, blog posts, or any web page in detail. The content is automatically cleaned and converted to markdown for easy reading.",
    parameters: Type.Object({
      url: Type.String({ description: "The URL to fetch" }),
    }),
    async execute(
      _toolCallId: string,
      params: { url: string },
      signal?: AbortSignal,
      _onUpdate?: unknown,
      _ctx?: unknown,
    ) {
      try {
        const headers: Record<string, string> = {
          Accept: "text/markdown",
        };

        // Optional: Use API key for higher rate limits (200/min vs 20/min)
        const apiKey = process.env.JINA_API_KEY;
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const jinaUrl = `https://r.jina.ai/${params.url}`;

        const response = await fetch(jinaUrl, {
          headers,
          signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to fetch: ${response.status} - ${text}`);
        }

        const content = await response.text();

        // Truncate if extremely long (over 50k chars)
        const maxLength = 50000;
        const truncated = content.length > maxLength;
        const output = truncated ? content.slice(0, maxLength) + "\n\n[Content truncated...]" : content;

        return toolResult(output, {
          url: params.url,
          length: content.length,
          truncated,
        });
      } catch (error) {
        return toolResult(`Error fetching ${params.url}: ${(error as Error).message}`, {
          error: (error as Error).message,
        });
      }
    },
  });
}
