import { Workflow } from "bee-agent-framework/experimental/workflows/workflow";
import { JsonDriver } from "bee-agent-framework/llms/drivers/json";
import { BaseMessage, Role } from "bee-agent-framework/llms/primitives/message";
import { getChatLLM } from "./helpers/llm.js";
import {
  competitorsPromptTemplate,
  competitorsSchema,
  categorizationPromptTemplate,
  findingsSchema,
} from "./prompts.js";
import { State, StateSchema } from "./state.js";
import { deduplicateAndFormatSources, formatSources, tavilySearch } from "./utils.js";

export enum Steps {
  GENERATE_COMPETITORS = "GENERATE_COMPETITORS",
  SELECT_COMPETITOR = "SELECT_COMPETITOR",
  WEB_RESEARCH = "WEB_RESEARCH",
  CATEGORIZE_FINDINGS = "CATEGORIZE_FINDINGS",
  FINALIZE_SUMMARY = "FINALIZE_SUMMARY",
}

async function generateCompetitors(state: State) {
  if (state.specifiedCompetitors?.length) {
    return {
      update: {
        competitors: state.specifiedCompetitors,
        runningSummary: `Competitive analysis of ${state.specifiedCompetitors.join(", ")}`,
        competitorFindings: state.specifiedCompetitors.reduce(
          (acc, competitor) => {
            acc[competitor] = [];
            return acc;
          },
          {} as Record<string, string[]>,
        ),
      },
    };
  }

  const llm = getChatLLM();
  const llmJsonMode = new JsonDriver(llm);
  const result = await llmJsonMode.generate(competitorsSchema, [
    BaseMessage.of({
      role: Role.SYSTEM,
      text: competitorsPromptTemplate.render({
        industry: state.industry,
        specifiedCompetitors: undefined,
      }),
    }),
  ]);

  return {
    update: {
      competitors: result.parsed.competitors,
      runningSummary: result.parsed.overview,
      competitorFindings: result.parsed.competitors.reduce(
        (acc, competitor) => {
          acc[competitor] = [];
          return acc;
        },
        {} as Record<string, string[]>,
      ),
    },
  };
}

async function selectCompetitor(state: State) {
  const unprocessedCompetitors = state.competitors.filter(
    (comp) => !state.competitorFindings[comp] || state.competitorFindings[comp].length === 0,
  );

  if (unprocessedCompetitors.length === 0) {
    return { next: Steps.FINALIZE_SUMMARY };
  }

  const currentCompetitor = unprocessedCompetitors[0];
  const searchTerms = `${currentCompetitor} comprehensive overview key capabilities`;

  return {
    update: {
      currentCompetitor,
      searchQuery: searchTerms,
    },
    next: Steps.WEB_RESEARCH,
  };
}

async function webResearch(state: State) {
  const searchResults = await tavilySearch(state.searchQuery);
  const searchResultsString = deduplicateAndFormatSources(searchResults, 1000, true);

  return {
    update: {
      sourcesGathered: [...state.sourcesGathered, formatSources(searchResults)],
      researchLoopCount: state.researchLoopCount + 1,
      webResearchResults: [...state.webResearchResults, searchResultsString],
    },
  };
}

async function categorizeFindings(state: State) {
  const llm = getChatLLM();
  const llmJsonMode = new JsonDriver(llm);
  const result = await llmJsonMode.generate(findingsSchema, [
    BaseMessage.of({
      role: Role.SYSTEM,
      text: categorizationPromptTemplate.render({
        competitor: state.currentCompetitor!,
        searchResults: state.webResearchResults.at(-1)!,
      }),
    }),
  ]);

  return {
    update: {
      competitorFindings: {
        ...state.competitorFindings,
        [state.currentCompetitor!]: [
          ...(result.parsed.key_insights || []),
          ...(result.parsed.unique_capabilities || []),
        ],
      },
    },
    next: Steps.SELECT_COMPETITOR,
  };
}

async function finalizeSummary(state: State) {
  const competitorSections = Object.entries(state.competitorFindings)
    .map(
      ([competitor, findings]) => `## ${competitor}
${findings.map((insight) => `* ${insight}`).join("\n")}`,
    )
    .join("\n\n");

  const finalSummary = `# Competitive Analysis: ${state.industry}

${state.runningSummary || "Comprehensive Competitive Landscape Overview"}

${competitorSections}

### Sources
${state.sourcesGathered.join("\n")}`;

  return {
    update: { answer: BaseMessage.of({ role: Role.ASSISTANT, text: finalSummary }) },
    next: Workflow.END,
  };
}

export const workflow = new Workflow({ schema: StateSchema })
  .addStep(Steps.GENERATE_COMPETITORS, generateCompetitors)
  .addStep(Steps.SELECT_COMPETITOR, selectCompetitor)
  .addStep(Steps.WEB_RESEARCH, webResearch)
  .addStep(Steps.CATEGORIZE_FINDINGS, categorizeFindings)
  .addStep(Steps.FINALIZE_SUMMARY, finalizeSummary)
  .setStart(Steps.GENERATE_COMPETITORS);
