import { z } from "zod";
import { PromptTemplate } from "bee-agent-framework/template";
import { zodToJsonSchema } from "zod-to-json-schema";
import { searchQueryJSONSchema } from "./state.js";

export const queryWriterInstructionsTemplate = new PromptTemplate({
  schema: z.object({
    researchTopic: z.string(),
  }),
  template: `Your goal is to generate targeted web search query.

The query will gather information related to a specific topic.

Topic:
{{researchTopic}}

Return your query as a JSON object:
${JSON.stringify(searchQueryJSONSchema)}`,
});

export const summarizerInstructions = `Your goal is to generate a high-quality summary of the web search results.

When EXTENDING an existing summary:
1. Seamlessly integrate new information without repeating what's already covered
2. Maintain consistency with the existing content's style and depth
3. Only add new, non-redundant information
4. Ensure smooth transitions between existing and new content

When creating a NEW summary:
1. Highlight the most relevant information from each source
2. Provide a concise overview of the key points related to the report topic
3. Emphasize significant findings or insights
4. Ensure a coherent flow of information

CRITICAL REQUIREMENTS:
- Start IMMEDIATELY with the summary content - no introductions or meta-commentary
- DO NOT include ANY of the following:
  * Phrases about your thought process ("Let me start by...", "I should...", "I'll...")
  * Explanations of what you're going to do
  * Statements about understanding or analyzing the sources
  * Mentions of summary extension or integration
- Focus ONLY on factual, objective information
- Maintain a consistent technical depth
- Avoid redundancy and repetition
- DO NOT use phrases like "based on the new results" or "according to additional sources"
- DO NOT add a References or Works Cited section
- DO NOT use any XML-style tags like <think> or <answer>
- Begin directly with the summary text without any tags, prefixes, or meta-commentary`;

export const getHumanMessageContent = ({
  existingSummary,
  mostRecentWebResearch,
  researchTopic,
}: {
  existingSummary?: string;
  mostRecentWebResearch?: string;
  researchTopic: string;
}) =>
  existingSummary
    ? `Extend the existing summary: ${existingSummary}\n\n` +
      `Include new search results: ${mostRecentWebResearch} ` +
      `That addresses the following topic: ${researchTopic}`
    : `Generate a summary of these search results: ${mostRecentWebResearch} ` +
      `That addresses the following topic: ${researchTopic}`;

export const reflectionOutputSchema = z.object({
  knowledgeGap: z.string(),
  followUpQuery: z.string(),
});
const reflectionOutputJSONSchema = zodToJsonSchema(reflectionOutputSchema);

export const reflectionPromptTemplate = new PromptTemplate({
  schema: z.object({
    researchTopic: z.string(),
  }),
  template: `You are an expert research assistant analyzing a summary about {{researchTopic}}.

Your tasks:
1. Identify knowledge gaps or areas that need deeper exploration
2. Generate a follow-up question that would help expand your understanding
3. Focus on technical details, implementation specifics, or emerging trends that weren't fully covered

Ensure the follow-up question is self-contained and includes necessary context for web search.

Format your response as a JSON object with two fields:
- knowledgeGap: Describe what information is missing or needs clarification
- followUpQuery: Write a specific question to address this gap

Example output:
${JSON.stringify(reflectionOutputJSONSchema)}

Provide your analysis in JSON format:`,
});
