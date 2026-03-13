import { GoogleGenAI } from "@google/genai";
import { toolDeclarations } from "./tools";
import { executeTool } from "./tool-executor";
import { buildSystemPrompt } from "./prompts";
import { getDefaultClinic } from "@/lib/db/clinics";
import type { ChatMessage } from "@/types";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function chat(
  messages: ChatMessage[]
): Promise<{ reply: string; toolCalls: Array<{ name: string; args: Record<string, string>; result: unknown }> }> {
  const clinic = await getDefaultClinic();
  const systemPrompt = buildSystemPrompt(clinic);

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  // Build Gemini message history
  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const allToolCalls: Array<{ name: string; args: Record<string, string>; result: unknown }> = [];

  // Use generateContent with function calling loop
  let currentContents = [...geminiContents];
  let maxIterations = 10; // Safety limit for tool call loops

  while (maxIterations > 0) {
    maxIterations--;

    const response = await genai.models.generateContent({
      model,
      contents: currentContents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      return { reply: "I'm sorry, I couldn't process that. Please try again.", toolCalls: allToolCalls };
    }

    const parts = candidate.content?.parts || [];

    // Check if there are function calls
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      // No function calls - extract text response
      const textParts = parts.filter((p) => p.text);
      const reply = textParts.map((p) => p.text).join("") || "I'm here to help! What can I do for you?";
      return { reply, toolCalls: allToolCalls };
    }

    // Execute function calls and continue the loop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelParts: any[] = parts.map((p) => {
      if (p.functionCall) {
        return { functionCall: { name: p.functionCall.name!, args: p.functionCall.args } };
      }
      return { text: p.text || "" };
    });
    currentContents.push({ role: "model" as const, parts: modelParts });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionResponses: any[] = [];
    for (const part of functionCalls) {
      const fc = part.functionCall!;
      const result = await executeTool(fc.name!, (fc.args as Record<string, string>) || {});
      allToolCalls.push({
        name: fc.name!,
        args: (fc.args as Record<string, string>) || {},
        result,
      });
      functionResponses.push({
        functionResponse: {
          name: fc.name!,
          response: result as Record<string, unknown>,
        },
      });
    }

    currentContents.push({ role: "user" as const, parts: functionResponses });
  }

  return { reply: "I'm still processing your request. Please try again in a moment.", toolCalls: allToolCalls };
}
