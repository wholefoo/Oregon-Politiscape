import OpenAI from "openai";

export function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Please connect the OpenAI integration in the admin panel.");
  }
  return new OpenAI({ apiKey });
}
