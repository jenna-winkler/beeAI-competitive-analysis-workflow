import { BaseMessage } from "bee-agent-framework/llms/primitives/message";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const searchQuerySchema = z.object({
  query: z.string().max(128),
  aspect: z.string(),
  rationale: z.string(),
});
export const searchQueryJSONSchema = zodToJsonSchema(searchQuerySchema);

export const StateSchema = z.object({
  researchTopic: z.string(), // Report topic
  searchQuery: z.string(), // Search query
  webResearchResults: z.array(z.string()), // Web search results
  sourcesGathered: z.array(z.string()), // Gathered sources
  researchLoopCount: z.number(), // Research loop count
  runningSummary: z.string().optional(), // Final report
  answer: z.instanceof(BaseMessage).optional(),
});
export type State = z.infer<typeof StateSchema>;
