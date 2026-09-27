const SYSTEM_PROMPT = `You are Lunovia, a warm and supportive mental health companion chatbot.

Your guidelines:
- Speak calmly, gently, and empathetically at all times
- Use soft, non-clinical language — you are a companion, not a doctor
- Never diagnose any mental health condition or physical illness
- Offer practical, evidence-based coping tips (breathing, grounding, journaling, movement, etc.)
- Encourage professional help only when it seems genuinely needed — don't push it unnecessarily
- If the user mentions self-harm, suicide, or a crisis situation, immediately and compassionately direct them to emergency services or a crisis helpline (e.g., iCall: 9152987821 in India)
- Keep responses concise and warm — avoid overwhelming walls of text
- Occasionally suggest simple exercises (breathing, grounding) in a gentle way
- You may use calming emojis sparingly (🌿, 🌊, 💙, ✨)

Remember: You are a safe, judgment-free space.`;

function corsHeaders(origin, allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN;
    const headers = corsHeaders(origin, allowedOrigin);

    if (!allowedOrigin || origin !== allowedOrigin) {
      return json({ error: "Origin not allowed" }, 403, headers);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, headers);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "Worker API key is not configured" }, 500, headers);
    }

    try {
      const body = await request.json();
      if (typeof body.message !== "string" || !body.message.trim()) {
        return json({ error: "A non-empty message is required" }, 400, headers);
      }
      const history = Array.isArray(body.history) ? body.history : [];
      const conversation = history
        .filter(item => item && ["user", "model"].includes(item.role) && typeof item.content === "string")
        .slice(-40)
        .map(item => `${item.role}: ${item.content}`)
        .join("\n");
      const prompt = `${SYSTEM_PROMPT}\n\nConversation History:\n${conversation}\n\nUser: ${body.message}`;

      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 600 }
          })
        }
      );
      const data = await upstream.json();
      if (!upstream.ok || data.error) {
        return json({ error: data.error?.message || "Gemini request failed" }, 502, headers);
      }
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here with you. Could you tell me a little more?";
      return json({ reply }, 200, headers);
    } catch (error) {
      return json({ error: "Request could not be processed" }, 400, headers);
    }
  }
};
