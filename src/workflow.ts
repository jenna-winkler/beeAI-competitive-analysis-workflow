import { Workflow } from "bee-agent-framework/experimental/workflows/workflow";
import { JsonDriver } from "bee-agent-framework/llms/drivers/json";
import { BaseMessage, Role } from "bee-agent-framework/llms/primitives/message";
import "dotenv/config.js";
import { getChatLLM } from "./helpers/llm.js";
import { MAX_WEB_RESEARCH_LOOPS } from "./main.js";
import {
  getHumanMessageContent,
  queryWriterInstructionsTemplate,
  reflectionOutputSchema,
  reflectionPromptTemplate,
  summarizerInstructions,
} from "./prompts.js";
import { searchQuerySchema, State, StateSchema } from "./state.js";
import {
  deduplicateAndFormatSources,
  formatSources,
  removeThinkTags,
  tavilySearch,
} from "./utils.js";

/**
 * Generate a query for web search
 * @param state
 * @returns
 */
async function generateQuery(state: State) {
  const queryWriterInstructionsPrompt = queryWriterInstructionsTemplate.render({
    researchTopic: state.researchTopic,
  });

  const llm = getChatLLM();
  const llmJsonMode = new JsonDriver(llm);
  const result = await llmJsonMode.generate(searchQuerySchema, [
    BaseMessage.of({
      role: Role.SYSTEM,
      text: queryWriterInstructionsPrompt,
    }),
    BaseMessage.of({
      role: Role.USER,
      text: `Generate a query for web search:`,
    }),
  ]);

  return { update: { searchQuery: result.parsed.query } };
}

/**
 * Gather information from the web
 * @param state
 * @returns
 */
async function webResearch(state: State) {
  // const searchResults = await duckDuckGoSearchTool.run({ query: state.searchQuery });
  const searchResults = await tavilySearch(state.searchQuery);
  const searchResultsString = deduplicateAndFormatSources(searchResults, 1000, true);

  return {
    update: {
      sourcesGathered: [...state.sourcesGathered.slice(), formatSources(searchResults)],
      researchLoopCount: state.researchLoopCount + 1,
      webResearchResults: [...state.webResearchResults.slice(), searchResultsString],
    },
  };
}

/**
 * Summarize the gathered sources
 * @param state
 * @returns
 */
async function summarizeSources(state: State) {
  // Existing summary
  const existingSummary = state.runningSummary;

  // Most recent web research
  const mostRecentWebResearch = state.webResearchResults.at(-1);

  const humanMessageContent = getHumanMessageContent({
    existingSummary,
    mostRecentWebResearch,
    researchTopic: state.researchTopic,
  });

  const llm = getChatLLM();
  const result = await llm.generate([
    BaseMessage.of({
      role: Role.SYSTEM,
      text: summarizerInstructions,
    }),
    BaseMessage.of({
      role: Role.USER,
      text: humanMessageContent,
    }),
  ]);

  const summary = removeThinkTags(result.getTextContent());

  return {
    update: {
      runningSummary: summary,
    },
  };
}

/**
 * Reflect on the summary and generate a follow-up query
 * @param state
 * @returns
 */
async function reflectOnSummary(state: State) {
  const llm = getChatLLM();
  const llmJsonMode = new JsonDriver(llm);
  const result = await llmJsonMode.generate(reflectionOutputSchema, [
    BaseMessage.of({
      role: Role.SYSTEM,
      text: reflectionPromptTemplate.render({ researchTopic: state.researchTopic }),
    }),
    BaseMessage.of({
      role: Role.USER,
      text: `Identify a knowledge gap and generate a follow-up web search query based on our existing knowledge: ${state.runningSummary}"`,
    }),
  ]);

  // Update search query with follow-up query
  return {
    update: {
      searchQuery: result.parsed.followUpQuery ?? `Tell me more about ${state.researchTopic}`,
    },
    next: state.researchLoopCount <= MAX_WEB_RESEARCH_LOOPS ? Steps.WEB_RESEARCH : Workflow.NEXT,
  };
}

/**
 * Finalize the summary
 * @param state
 * @returns
 */
async function finalizeSummary(state: State) {
  const allSources = state.sourcesGathered.join("\n");
  const updatedSummary = `## Summary\n${state.runningSummary}\n\n### Sources:\n${allSources}`;
  return {
    update: { answer: BaseMessage.of({ role: Role.ASSISTANT, text: updatedSummary }) },
    next: Workflow.END,
  };
}

export enum Steps {
  GENERATE_QUERY = "GENERATE_QUERY",
  WEB_RESEARCH = "WEB_RESEARCH",
  SUMMARIZE_SOURCES = "SUMMARIZE_SOURCES",
  REFLECT_ON_SUMMARY = "REFLECT_ON_SUMMARY",
  FINALIZE_SUMMARY = "FINALIZE_SUMMARY",
}

export const workflow = new Workflow({ schema: StateSchema })
  .addStep(Steps.GENERATE_QUERY, generateQuery)
  .addStep(Steps.WEB_RESEARCH, webResearch)
  .addStep(Steps.SUMMARIZE_SOURCES, summarizeSources)
  .addStep(Steps.REFLECT_ON_SUMMARY, reflectOnSummary)
  .addStep(Steps.FINALIZE_SUMMARY, finalizeSummary)
  .setStart(Steps.GENERATE_QUERY);
