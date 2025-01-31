import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { getEnv } from "bee-agent-framework/internals/env";
import { State } from "./state.js";
import { Steps } from "./workflow.js";
import "dotenv/config";
export interface SearchResult {
  url: string;
  title: string;
  content: string;
  raw_content?: string | null;
}

export async function tavilySearch(query: string, maxResults = 3): Promise<SearchResult[]> {
  const apiKey = getEnv("TAVILY_API_KEY");
  const tool = new TavilySearchResults({ apiKey: apiKey ?? "", maxResults });
  const response = await tool.invoke(query);
  const parsed = JSON.parse(response);
  return parsed;
}

export function deduplicateAndFormatSources(
  searchResults: SearchResult[],
  maxTokensPerSource: number,
  includeRawContent = false,
): string {
  const uniqueSources = new Map<string, SearchResult>();
  searchResults.forEach((result) => {
    if (!uniqueSources.has(result.url)) {
      uniqueSources.set(result.url, result);
    }
  });

  let formattedText = "Sources:\n\n";
  Array.from(uniqueSources.values()).forEach((source) => {
    formattedText += `Source ${source.title}:\n===\n`;
    formattedText += `URL: ${source.url}\n===\n`;
    formattedText += `Most relevant content from source: ${source.content}\n===\n`;

    if (includeRawContent) {
      const charLimit = maxTokensPerSource * 4;
      let rawContent = source.raw_content ?? "";
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

export enum RelevantOutputType {
  START = "start",
  FINISH = "finish",
  ERROR = "error",
}

export function getRelevantOutput(type: RelevantOutputType, step: Steps, state: State) {
  if (type === RelevantOutputType.ERROR) {
    return "❌ An error occurred during execution.";
  }

  switch (step) {
    case Steps.GENERATE_COMPETITORS:
      return type === RelevantOutputType.START
        ? `Analyzing ${state.industry} industry...`
        : `Found competitors: ${state.competitors.join(", ")}`;
    case Steps.SELECT_COMPETITOR:
      return type === RelevantOutputType.START
        ? "Selecting next competitor..."
        : `Analyzing: ${state.currentCompetitor}`;
    case Steps.WEB_RESEARCH:
      return type === RelevantOutputType.START
        ? `🔎 Researching: "${state.searchQuery}"`
        : "Research complete";
    case Steps.CATEGORIZE_FINDINGS:
      return type === RelevantOutputType.START
        ? "Categorizing findings..."
        : "Categorization complete";
    case Steps.FINALIZE_SUMMARY:
      return type === RelevantOutputType.START
        ? "Generating final analysis..."
        : "Analysis complete";
    default:
      return "";
  }
}
