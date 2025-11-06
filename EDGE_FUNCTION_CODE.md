import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // ✅ 1. Check API Key
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return jsonError("GROQ_API_KEY is not set in Supabase secrets", 500);
    }
    // ✅ 2. Parse input
    const { description } = await req.json();
    if (!description?.trim()) {
      return jsonError("Description is required", 400);
    }
    // ✅ 3. Build prompt
    const systemMessage = `
You are an expert Java Selenium test automation engineer.
Return output STRICTLY as a valid JSON object — nothing else.
Format:
{"steps": ["step 1", "step 2"], "code": "<escaped Java code as single line>"}
All quotes and backslashes inside "code" must be escaped properly.
Do NOT use markdown, code blocks, or any explanation text.`;
    const userMessage = `Description: ${description}

Constraints:
- Use TestNG annotations (@BeforeMethod, @Test, @AfterMethod)
- Use WebDriverWait (explicit waits)
- Use modern Selenium (Duration)
- Use assertTrue/assertEquals
- Escape all quotes inside the JSON properly.`;
    // ✅ 4. Call Groq API
    const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });
    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`Groq API error ${apiResponse.status}: ${errText}`);
    }
    // ✅ 5. Extract AI response text
    const data = await apiResponse.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from Groq API");
    // ✅ 6. Clean and sanitize text before parsing
    let cleaned = text.trim().replace(/^[^\{]*/, "") // remove junk before {
    .replace(/[^\}]*$/, "") // remove junk after }
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // remove control chars
    // ✅ 7. Attempt parsing
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      // 💡 Attempt to auto-fix common JSON issues
      try {
        cleaned = cleaned.replace(/\n/g, "\\n") // escape newlines
        .replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\\/g, "\\\\") // escape backslashes
        .replace(/\"([^"]*?)\"(?=\s*[:,}])/g, (m)=>m.replace(/\"/g, '\\"')); // escape unescaped quotes
        parsed = JSON.parse(cleaned);
      } catch (err2) {
        console.error("Failed to parse JSON:", err2, "\nRaw:", text);
        return jsonError("Failed to parse AI response", 500, {
          rawResponse: text
        });
      }
    }
    // ✅ 8. Validate structure
    if (!parsed.steps || !parsed.code) {
      return jsonError("Invalid response structure", 500, {
        rawResponse: parsed
      });
    }
    // ✅ 9. Sanitize code string again before sending
    parsed.code = parsed.code.replace(/\r/g, "").replace(/\t/g, "  ").replace(/\\n/g, "\n");
    // ✅ 10. Return clean JSON
    return new Response(JSON.stringify(parsed), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return jsonError(err.message || "Unexpected server error", 500);
  }
});
function jsonError(message, status = 500, extra = {}) {
  return new Response(JSON.stringify({
    error: message,
    ...extra
  }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
