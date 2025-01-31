import { getEnv } from "bee-agent-framework/internals/env";
import { createConsoleReader } from "./helpers/reader.js";
import { getRelevantOutput, RelevantOutputType } from "./utils.js";
import { Steps, workflow } from "./workflow.js";

export const MAX_WEB_RESEARCH_LOOPS = Number(getEnv("MAX_WEB_RESEARCH_LOOPS") ?? 3);

// How does the PPO RL algorithm work?

const reader = createConsoleReader();
for await (const { prompt } of reader) {
  const response = await workflow
    .run({
      searchQuery: "",
      researchTopic: prompt,
      webResearchResults: [],
      sourcesGathered: [],
      researchLoopCount: 0,
    })
    .observe((emitter) => {
      emitter.on("start", (data) => {
        reader.write(
          `Workflow[${data.step}] 🤖 :`,
          getRelevantOutput(RelevantOutputType.START, data.step as Steps, data.run.state),
        );
      });
      emitter.on("success", (data) => {
        reader.write(
          `Workflow[${data.step}] 🤖:`,
          getRelevantOutput(RelevantOutputType.FINISH, data.step as Steps, data.run.state),
        );
      });
      emitter.on("error", (data) => {
        reader.write(
          `Workflow[${data.step}] 🤖 :`,
          getRelevantOutput(RelevantOutputType.ERROR, data.step as Steps, data.run.state),
        );
      });
    });

  reader.write("🤖 Final Answer", response.state.answer!.text);
}
