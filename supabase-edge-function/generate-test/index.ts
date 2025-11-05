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
Generate a complete Java Selenium test case with TestNG framework and return ONLY valid JSON.
Do NOT wrap the JSON in markdown code blocks or add any explanatory text. Return pure JSON only.`;

    const userMessage = `Description: ${description}

Provide strictly this JSON structure with no extra text, no markdown formatting, no code blocks:
{"steps": ["step 1", "step 2", "step 3"], "code": "<complete Java code>"}

IMPORTANT: Return ONLY the JSON object, nothing else. Do not use markdown code blocks or add any text before or after the JSON.

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
      // Try multiple parsing strategies in order of preference
      let jsonText: string | null = null;
      
      // Strategy 1: Try parsing the entire text as JSON (most common case)
      try {
        parsedResponse = JSON.parse(text);
        // If successful, skip to validation
      } catch {
        // Strategy 2: Try to extract from markdown code blocks (```json ... ``` or ``` ... ```)
        // Use a more robust regex that handles multiline JSON
        const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
          const markdownContent = markdownMatch[1].trim();
          // Try to find JSON object in the markdown content
          const jsonInMarkdown = markdownContent.match(/\{[\s\S]*\}/);
          if (jsonInMarkdown) {
            jsonText = jsonInMarkdown[0];
          } else {
            jsonText = markdownContent;
          }
        }
        
        // Strategy 3: Try to find JSON object by finding balanced braces
        if (!jsonText) {
          let jsonStart = text.indexOf('{');
          if (jsonStart !== -1) {
            let braceCount = 0;
            let jsonEnd = -1;
            
            for (let i = jsonStart; i < text.length; i++) {
              if (text[i] === '{') {
                braceCount++;
              } else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            
            if (jsonEnd !== -1) {
              jsonText = text.substring(jsonStart, jsonEnd + 1);
            }
          }
        }
        
        // Strategy 4: Fallback to simple regex match (original behavior)
        if (!jsonText) {
          const simpleMatch = text.match(/\{[\s\S]*\}/);
          if (simpleMatch) {
            jsonText = simpleMatch[0];
          }
        }
        
        // If we found JSON text, parse it
        if (jsonText) {
          parsedResponse = JSON.parse(jsonText);
        } else {
          throw new Error("Could not extract JSON from response");
        }
      }
    } catch (parseError) {
      // If parsing fails, return the raw text with a fallback structure
      console.error("Failed to parse Groq response:", parseError);
      console.error("Raw response text:", text);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          rawResponse: text,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
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

