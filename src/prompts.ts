import { z } from "zod";
import { PromptTemplate } from "bee-agent-framework/template";

export const competitorsSchema = z.object({
  competitors: z.array(z.string()),
  overview: z.string(),
});

export const competitorsPromptTemplate = new PromptTemplate({
  schema: z.object({
    industry: z.string(),
    specifiedCompetitors: z.array(z.string()).optional(),
  }),
  template: `Identify key players in the {{industry}} domain.

{{#specifiedCompetitors}}
Focus on these specific competitors: {{specifiedCompetitors}}
{{/specifiedCompetitors}}

Provide a list of top competitors and a brief industry overview.

Return JSON with:
{
  "competitors": ["list of competitors"],
  "overview": "High-level industry description"
}`,
});

export const findingsSchema = z.object({
  key_insights: z.array(z.string()),
  unique_capabilities: z.array(z.string()).optional(),
});

export const categorizationPromptTemplate = new PromptTemplate({
  schema: z.object({
    competitor: z.string(),
    searchResults: z.string(),
  }),
  template: `Analyze {{competitor}} based on these search results:
{{searchResults}}

Key Analysis Points:
- Core capabilities
- Unique technological approaches
- Market positioning
- Potential impact

Provide concise, actionable insights about the competitor.

Return JSON with:
{
  "key_insights": ["Critical findings"],
  "unique_capabilities": ["Standout features"]
}`,
});

export const summarizerInstructions = `Create a clear, concise competitive analysis that:
- Highlights key insights
- Provides objective observations
- Focuses on substantive information`;
