// ============================================================================
// GT Tires — Supabase Edge Function: ai-evaluate-tire
// ============================================================================
// Приймає {text} → викликає OpenAI → повертає СТРУКТУРОВАНИЙ JSON оцінки шини.
// Ключ OpenAI зберігається ТІЛЬКИ тут (серверний секрет), НІКОЛИ у фронті.
//
// ── РОЗГОРТАННЯ (один раз) ──────────────────────────────────────────────────
// 1. Встанови Supabase CLI:  npm i -g supabase
// 2. Логін:                  supabase login
// 3. Привʼяжи проєкт:        supabase link --project-ref <PROJECT_REF>
// 4. Створи функцію:         supabase functions new ai-evaluate-tire
//    і встав цей код у supabase/functions/ai-evaluate-tire/index.ts
// 5. Додай секрет (ключ OpenAI на сервері, НЕ у фронт):
//    supabase secrets set OPENAI_API_KEY=sk-....
// 6. Розгорни:               supabase functions deploy ai-evaluate-tire --no-verify-jwt
//    (--no-verify-jwt — якщо хочеш без перевірки токена; інакше фронт шле anon-ключ,
//     що вже робить застосунок автоматично через заголовок Authorization)
// 7. У застосунку: Шини AI → 🤖 AI оцінка → ⚙️ Endpoint → встав URL:
//    https://<PROJECT_REF>.supabase.co/functions/v1/ai-evaluate-tire
// ============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const SCHEMA = {
  brand: "", size: "", year: 0, tread_mm: 0, repairs: "",
  condition_score: 0, risk: "", max_buy_price: 0,
  recommended_sell_price_min: 0, recommended_sell_price_max: 0,
  decision: "", comment: "",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return json({ error: "POST only" }, 405);

  let text = "";
  try { text = (await req.json()).text || ""; } catch { /* ignore */ }
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
    "comment — короткий висновок українською. Якщо чогось не видно з тексту — постав 0 або \"\", не вигадуй.";

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
    // нормалізуємо до схеми (гарантуємо всі поля)
    const out: Record<string, unknown> = { ...SCHEMA };
    for (const k of Object.keys(SCHEMA)) if (k in parsed) out[k] = parsed[k];
    return json(out, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
