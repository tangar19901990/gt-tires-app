// GT Tires — Supabase Edge Function: ai-evaluate-tire (OpenAI)
// РОЗГОРНУТО у проєкт gt-tires (lxeswqlkereptdtwytbp), version 1, ACTIVE.
// Ключ OpenAI зберігається ТІЛЬКИ як Supabase Secret (OPENAI_API_KEY), НЕ у фронті.
//
// Залишилось ОДНЕ (робиш ти, значення ключа я не бачу і не зберігаю):
//   Dashboard → Project Settings → Edge Functions → Secrets → Add new secret
//     Name:  OPENAI_API_KEY
//     Value: <твій ключ sk-...>
//   (або CLI:  supabase secrets set OPENAI_API_KEY=sk-...  --project-ref lxeswqlkereptdtwytbp)
//
// Endpoint (вже вшитий у сайт):
//   https://lxeswqlkereptdtwytbp.supabase.co/functions/v1/ai-evaluate-tire

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const SCHEMA = {
  brand: "", model: "", size: "", year: 0, tread_mm: 0, repairs: "",
  condition_score: 0, risk: "", max_buy_price: 0,
  recommended_sell_price_min: 0, recommended_sell_price_max: 0,
  decision: "", comment: "",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let text = "";
  try { text = ((await req.json()) as { text?: string }).text || ""; } catch { /* ignore */ }
  if (!text.trim()) return json({ error: "no text" }, 400);

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return json({ error: "OPENAI_API_KEY not set on server" }, 500);

  const system =
    "Ти — експерт з оцінки вживаних вантажних/легкових шин в Україні (ціни у гривнях). " +
    "З опису витягни дані й оціни шину. Поверни ВИКЛЮЧНО валідний JSON без markdown, без пояснень, " +
    "рівно з такими полями: " + JSON.stringify(SCHEMA) + ". " +
    "Правила: year — рік (число); tread_mm — глибина протектора в мм; condition_score — 0..100; " +
    "risk — короткий рядок ('низький'/'середній'/'високий' + причина); " +
    "decision — одне з: 'Купувати' / 'Торгуватися' / 'Не купувати'; " +
    "max_buy_price — рекомендована максимальна ціна закупівлі (грн, ціле); " +
    "recommended_sell_price_min/max — діапазон продажу (грн, цілі); " +
    "model — модель шини якщо є; comment — короткий висновок українською. " +
    "Якщо чогось не видно з тексту — постав 0 або \"\", не вигадуй.";

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });
    if (!r.ok) return json({ error: "openai " + r.status, detail: await r.text() }, 502);
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const out: Record<string, unknown> = { ...SCHEMA };
    for (const k of Object.keys(SCHEMA)) if (k in parsed) out[k] = parsed[k];
    return json(out, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
