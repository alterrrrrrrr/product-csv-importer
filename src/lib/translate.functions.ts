import { createServerFn } from "@tanstack/react-start";

/** Automatyczne tłumaczenie tekstów PL → EN przez Lovable AI. */
export const translateToEnglish = createServerFn({ method: "POST" })
  .inputValidator((data: { items: { key: string; text: string }[] }) => {
    const items = (data?.items ?? [])
      .map((i) => ({ key: String(i?.key ?? "").slice(0, 120), text: String(i?.text ?? "").slice(0, 500) }))
      .filter((i) => i.key && i.text.trim())
      .slice(0, 300);
    if (!items.length) throw new Error("Nothing to translate");
    return { items };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing AI key");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You translate Polish UI strings of a reps/agent shopping site into natural English. Keep emojis, punctuation and placeholders. Reply ONLY with a JSON object mapping each given key to its English translation.",
          },
          { role: "user", content: JSON.stringify(data.items) },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit — spróbuj ponownie za chwilę.");
      throw new Error("Translation service unavailable");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      throw new Error("Translation parse error");
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === "string") out[k] = v;
    return { translations: out };
  });
