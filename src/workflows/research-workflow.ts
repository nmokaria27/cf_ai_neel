import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import type { Env } from "../env";
import {
  DECOMPOSITION_PROMPT,
  RESEARCH_PROMPT,
  SYNTHESIS_PROMPT,
} from "../lib/prompts";

export type ResearchParams = {
  sessionId: string;
  query: string;
  workflowId: string;
};

type SubFindings = Array<{ question: string; answer: string }>;

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as Parameters<Ai["run"]>[0];

export class ResearchWorkflow extends WorkflowEntrypoint<Env, ResearchParams> {
  async run(event: WorkflowEvent<ResearchParams>, step: WorkflowStep) {
    const { sessionId, query, workflowId } = event.payload;

    // Step 1: Decompose query into focused sub-questions
    const subQuestions = await step.do("parse-query", async () => {
      const response = (await this.env.AI.run(MODEL, {
        messages: [
          { role: "system", content: DECOMPOSITION_PROMPT },
          { role: "user", content: query },
        ],
        max_tokens: 512,
        temperature: 0.3,
      } as AiTextGenerationInput)) as { response?: string };

      const raw = response?.response?.trim() ?? "[]";
      // Strip markdown code fences if model wraps the JSON
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as string[];
        }
      } catch {
        // Fallback to treating the original query as the single question
      }
      return [query];
    });

    // Step 2: Research each sub-question independently
    const findings: SubFindings = await step.do(
      "research-subquestions",
      { retries: { limit: 3, delay: "5 seconds", backoff: "linear" } },
      async () => {
        const results: SubFindings = [];
        for (const question of subQuestions) {
          const response = (await this.env.AI.run(MODEL, {
            messages: [
              { role: "system", content: RESEARCH_PROMPT },
              { role: "user", content: question },
            ],
            max_tokens: 1024,
            temperature: 0.4,
          } as AiTextGenerationInput)) as { response?: string };

          results.push({
            question,
            answer: response?.response?.trim() ?? "(no answer)",
          });
        }
        return results;
      }
    );

    // Step 3: Synthesize a final report from all findings
    const report: string = await step.do(
      "synthesize-report",
      { retries: { limit: 2, delay: "5 seconds", backoff: "linear" } },
      async () => {
        const findingsText = findings
          .map((f) => `## ${f.question}\n\n${f.answer}`)
          .join("\n\n---\n\n");

        const input = `Original query: "${query}"\n\nResearch findings:\n\n${findingsText}`;

        const response = (await this.env.AI.run(MODEL, {
          messages: [
            { role: "system", content: SYNTHESIS_PROMPT },
            { role: "user", content: input },
          ],
          max_tokens: 2048,
          temperature: 0.5,
        } as AiTextGenerationInput)) as { response?: string };

        return response?.response?.trim() ?? "Unable to generate report.";
      }
    );

    // Step 4: Persist the completed report to D1
    await step.do("persist-results", async () => {
      await this.env.DB.prepare(
        `UPDATE research_results
         SET result = ?, status = 'complete', completed_at = datetime('now')
         WHERE workflow_id = ?`
      )
        .bind(report, workflowId)
        .run();
      return { workflowId, status: "complete" };
    });

    return { report, workflowId, sessionId };
  }
}
