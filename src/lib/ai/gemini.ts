import {
  GoogleGenAI,
  type Content,
  type FunctionResponse,
  type Part,
} from "@google/genai";
import { toolDeclarations } from "./tools";
import { executeTool } from "./tool-executor";
import { buildSystemPrompt } from "./prompts";
import { getDefaultClinic } from "@/lib/db/clinics";
import { getPatient } from "@/lib/db/patients";
import { getAppointments } from "@/lib/db/appointments";
import { getProvider } from "@/lib/db/providers";
import { getService } from "@/lib/db/services";
import type { ChatMessage } from "@/types";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function chat(
  messages: ChatMessage[],
  knownPatientId?: string
): Promise<{ reply: string; toolCalls: Array<{ name: string; args: Record<string, string>; result: unknown }> }> {
  const clinic = await getDefaultClinic();
  const patientContext = knownPatientId
    ? await buildKnownPatientContext(knownPatientId)
    : undefined;
  const systemPrompt = buildSystemPrompt(clinic, patientContext);

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

  // Build Gemini message history
  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const allToolCalls: Array<{ name: string; args: Record<string, string>; result: unknown }> = [];

  // Use generateContent with function calling loop
  const currentContents: Content[] = [...geminiContents];
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
    if (candidate.content) {
      currentContents.push(candidate.content);
    }

    const functionResponses: Part[] = [];
    for (const part of functionCalls) {
      const fc = part.functionCall!;
      let result: unknown;
      try {
        result = await executeTool(fc.name!, (fc.args as Record<string, string>) || {});
      } catch (err) {
        console.error(`Tool ${fc.name} failed:`, err);
        result = { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` };
      }
      allToolCalls.push({
        name: fc.name!,
        args: (fc.args as Record<string, string>) || {},
        result,
      });
      // Gemini requires functionResponse.response to be a plain object (not an array)
      const responseObj = (typeof result === "object" && result !== null && !Array.isArray(result))
        ? result as Record<string, unknown>
        : { result };
      const functionResponse: FunctionResponse = {
        name: fc.name!,
        response: responseObj,
      };
      functionResponses.push({
        functionResponse: {
          ...functionResponse,
        },
      });
    }

    currentContents.push({ role: "user" as const, parts: functionResponses });
  }

  return { reply: "I'm still processing your request. Please try again in a moment.", toolCalls: allToolCalls };
}

async function buildKnownPatientContext(
  patientId: string
): Promise<string | undefined> {
  const patient = await getPatient(patientId);
  if (!patient) return undefined;

  const appointments = await getAppointments(patient.clinicId, {
    patientId: patient.id,
  });
  const sortedAppointments = [...appointments].sort((a, b) =>
    b.startTime.localeCompare(a.startTime)
  );
  const latestAppointment =
    sortedAppointments.find((appointment) => appointment.status !== "cancelled") ??
    sortedAppointments[0];

  const provider = latestAppointment
    ? await getProvider(latestAppointment.providerId)
    : undefined;
  const service = latestAppointment
    ? await getService(latestAppointment.serviceId)
    : undefined;

  return [
    "This patient has already been identified in the current conversation.",
    `patientId: ${patient.id}`,
    `name: ${patient.firstName} ${patient.lastName}`,
    `email: ${patient.email}`,
    `phone: ${patient.phone}`,
    `dateOfBirth: ${patient.dateOfBirth || "unknown"}`,
    latestAppointment
      ? `mostRecentAppointment: ${latestAppointment.startTime} with ${provider?.name || latestAppointment.providerId} for ${service?.name || latestAppointment.serviceId}`
      : "mostRecentAppointment: none on record",
    provider
      ? `preferredProviderSuggestion: ${provider.name} (${provider.id})`
      : "preferredProviderSuggestion: none",
    "Do not ask for the patient's stored basic info again unless they need to update it.",
  ].join("\n");
}
