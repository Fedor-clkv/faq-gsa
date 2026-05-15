import client from "./client";
import type { WizardStep } from "@/types";

export async function getSteps(): Promise<WizardStep[]> {
  const { data } = await client.get("/wizard/steps");
  return data;
}

export async function getStep(stepId: number): Promise<WizardStep> {
  const { data } = await client.get(`/wizard/steps/${stepId}`);
  return data;
}
