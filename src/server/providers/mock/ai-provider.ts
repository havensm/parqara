import OpenAI from "openai";

import type {
  RecommendationExplanationArgs,
  RecommendationExplanationProvider,
  ReplanExplanationArgs,
} from "@/server/providers/contracts";

function fallbackStepExplanation(args: RecommendationExplanationArgs) {
  const factors = args.topFactors.slice(0, 2).join(" and ");
  return `${args.reason} ${factors ? `It rose to the top because of ${factors}.` : "It remained the strongest option."}`;
}

function fallbackReplanExplanation(args: ReplanExplanationArgs) {
  return `${args.cause}. The new plan now prioritizes ${args.changes.slice(0, 2).join(" and ")} while preserving your core constraints.`;
}

class DeterministicExplanationProvider implements RecommendationExplanationProvider {
  async explainItineraryStep(args: RecommendationExplanationArgs) {
    return fallbackStepExplanation(args);
  }

  async explainReplan(args: ReplanExplanationArgs) {
    return fallbackReplanExplanation(args);
  }
}

class OpenAIExplanationProvider implements RecommendationExplanationProvider {
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly model = process.env.OPENAI_MODEL || "gpt-5-mini";

  async explainItineraryStep(args: RecommendationExplanationArgs) {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "Write concise, helpful itinerary explanations for a theme park planning app. Keep it under 45 words and avoid hype.",
          },
          {
            role: "user",
            content: JSON.stringify(args),
          },
        ],
      });

      return response.output_text.trim() || fallbackStepExplanation(args);
    } catch {
      return fallbackStepExplanation(args);
    }
  }

  async explainReplan(args: ReplanExplanationArgs) {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "Write concise replan summaries for a theme park planning app. Keep it under 55 words and explain the operational change clearly.",
          },
          {
            role: "user",
            content: JSON.stringify(args),
          },
        ],
      });

      return response.output_text.trim() || fallbackReplanExplanation(args);
    } catch {
      return fallbackReplanExplanation(args);
    }
  }
}

export function createExplanationProvider(): RecommendationExplanationProvider {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIExplanationProvider();
  }

  return new DeterministicExplanationProvider();
}
