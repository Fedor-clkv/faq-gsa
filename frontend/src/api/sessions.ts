import client from "./client";
import type { Session, StepData } from "@/types";

export async function createSession(): Promise<{ session_id: string; created_at: string }> {
  const { data } = await client.post("/sessions");
  return data;
}

export async function getSession(sessionId: string): Promise<Session> {
  const { data } = await client.get(`/sessions/${sessionId}`);
  return data;
}

export async function updateStep(
  sessionId: string,
  stepId: number,
  body: { fields: Record<string, unknown>; completed: boolean }
): Promise<{ ok: boolean; current_step: number }> {
  const { data } = await client.put(`/sessions/${sessionId}/step/${stepId}`, body);
  return data;
}

export async function getBrief(sessionId: string): Promise<{ content: string; generated_at: string }> {
  const { data } = await client.get(`/sessions/${sessionId}/brief`);
  return data;
}

export type { StepData };
