import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  description: string;
}

interface AvailableModel {
  name: string;
  version: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the Groq API key from Supabase environment variables
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not set in Supabase secrets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { description }: RequestBody = await req.json();

    if (!description || !description.trim()) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build messages for Groq Chat Completions
    const systemMessage = `You are an expert Java Selenium test automation engineer.
Generate a complete Java Selenium test case with TestNG framework and return ONLY JSON.`;

    const userMessage = `Description: ${description}

Provide strictly this JSON structure with no extra text:
{"steps": ["step 1", "step 2", "step 3"], "code": "<complete Java code>"}

Constraints:
- Use TestNG annotations (@BeforeMethod, @Test, @AfterMethod)
- Use WebDriverWait (explicit waits)
- Modern Selenium (Duration)
- Strong assertions and comments.`;

    // Call Groq OpenAI-compatible API
    const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Groq API error: ${apiResponse.status} - ${errorText}`);
    }

    const responseData = await apiResponse.json();
    const text = responseData?.choices?.[0]?.message?.content ?? "";
    
    if (!text) {
      throw new Error("No response from Groq API");
    }

    // Parse the JSON response from Groq
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(text);
      }
    } catch (parseError) {
      // If parsing fails, return the raw text with a fallback structure
      console.error("Failed to parse Groq response:", parseError);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          rawResponse: text,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate the response structure
    if (!parsedResponse.steps || !parsedResponse.code) {
      return new Response(
        JSON.stringify({
          error: "Invalid response format from AI",
          rawResponse: parsedResponse,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the formatted response
    return new Response(
      JSON.stringify({
        steps: parsedResponse.steps,
        code: parsedResponse.code,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

