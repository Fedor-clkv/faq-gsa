export interface AiHintPayload {
  session_id: string;
  step_id: number;
  user_data: Record<string, unknown>;
}

export interface AiBriefPayload {
  session_id: string;
}

async function* streamSSE(url: string, body: unknown): AsyncGenerator<string> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`AI request failed: ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          const parsed = JSON.parse(raw) as { delta: string };
          if (parsed.delta) yield parsed.delta;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

export async function* streamHint(payload: AiHintPayload): AsyncGenerator<string> {
  yield* streamSSE("/api/ai/hint", payload);
}

export async function* streamBrief(payload: AiBriefPayload): AsyncGenerator<string> {
  yield* streamSSE("/api/ai/brief", payload);
}
