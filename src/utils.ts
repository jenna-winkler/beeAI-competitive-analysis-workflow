import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { getEnv } from "bee-agent-framework/internals/env";
import { MAX_WEB_RESEARCH_LOOPS } from "./main.js";
import { State } from "./state.js";
import { Steps } from "./workflow.js";

export interface SearchResult {
  url: string;
  title: string;
  content: string;
  raw_content?: string | null;
}

/**
 * Search the web using the Tavily API.
 *
 * @param query - The search query to execute
 * @param maxResults - Maximum number of results to return
 * @returns Search response containing results with title, URL, content, and optional raw content
 */
export async function tavilySearch(query: string, maxResults = 3): Promise<SearchResult[]> {
  const tool = new TavilySearchResults({ apiKey: getEnv("TAVILY_API_KEY") ?? "", maxResults });
  const response = await tool.invoke(query);
  const parsed = JSON.parse(response);
  return parsed;
}

/**
 * Takes either a single search response or list of responses from search APIs and formats them.
 * Limits the raw_content to approximately max_tokens_per_source.
 *
 * @param searchResults -
 * @param maxTokensPerSource - Maximum number of tokens to include per source
 * @param includeRawContent - Whether to include the raw_content from Tavily in the formatted string
 * @returns Formatted string with deduplicated sources
 */
export function deduplicateAndFormatSources(
  searchResults: SearchResult[],
  maxTokensPerSource: number,
  includeRawContent = false,
): string {
  // Deduplicate by URL
  const uniqueSources = new Map<string, SearchResult>();
  searchResults.forEach((result) => {
    if (!uniqueSources.has(result.url)) {
      uniqueSources.set(result.url, result);
    }
  });

  // Format output
  let formattedText = "Sources:\n\n";
  Array.from(uniqueSources.values()).forEach((source) => {
    formattedText += `Source ${source.title}:\n===\n`;
    formattedText += `URL: ${source.url}\n===\n`;
    formattedText += `Most relevant content from source: ${source.content}\n===\n`;

    if (includeRawContent) {
      // Using rough estimate of 4 characters per token
      const charLimit = maxTokensPerSource * 4;
      let rawContent = source.raw_content ?? "";

      if (rawContent === null) {
        rawContent = "";
        console.warn(`Warning: No raw_content found for source ${source.url}`);
      }

      if (rawContent.length > charLimit) {
        rawContent = rawContent.slice(0, charLimit) + "... [truncated]";
      }

      formattedText += `Full source content limited to ${maxTokensPerSource} tokens: ${rawContent}\n\n`;
    }
  });

  return formattedText.trim();
}

export function formatSources(results: SearchResult[]) {
  return results.map((source) => `* ${source.title} : ${source.url}`).join("\n");
}

export function removeThinkTags(runningSummary: string): string {
  while (runningSummary.includes("<think>") && runningSummary.includes("</think>")) {
    const start: number = runningSummary.indexOf("<think>");
    const end: number = runningSummary.indexOf("</think>") + "</think>".length;
    runningSummary = runningSummary.slice(0, start) + runningSummary.slice(end);
  }
  return runningSummary.trim();
}

export enum RelevantOutputType {
  START = "start",
  FINISH = "finish",
  ERROR = "error",
}

export function getRelevantOutput(type: RelevantOutputType, step: Steps, state: State) {
  if (type === RelevantOutputType.ERROR) {
    return `❌ Something happen, there is an error.`;
  }

  switch (step) {
    case Steps.GENERATE_QUERY:
      return type === RelevantOutputType.START
        ? `Based on the research topic "${state.researchTopic}" I need to figure out a good search query 💭`
        : `What about this? "${state.searchQuery}"`;
    case Steps.WEB_RESEARCH:
      return type === RelevantOutputType.START
        ? `🔎 "${state.searchQuery}"`
        : `🗒️ I found this:\n${JSON.stringify(state.webResearchResults, null, " ")}`;
    case Steps.SUMMARIZE_SOURCES:
      return type === RelevantOutputType.START
        ? `I need to summarize it 😅...`
        : `📝 Summary: \n${state.runningSummary}`;
    case Steps.REFLECT_ON_SUMMARY:
      return type === RelevantOutputType.START
        ? `🧠 Let’s think it over a bit more...`
        : state.researchLoopCount <= MAX_WEB_RESEARCH_LOOPS
          ? `🤔 I need more information... It would be useful find something about "${state.searchQuery}".`
          : `📣 Ok, I've got enough data to make a conclusion....`;
    case Steps.FINALIZE_SUMMARY:
      return type === RelevantOutputType.START
        ? `...just last details. Give me a sec...  `
        : `🏆 That's it:\n${state.runningSummary}`;
  }
}
