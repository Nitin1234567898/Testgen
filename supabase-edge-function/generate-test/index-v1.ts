import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the Gemini API key from Supabase environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set in Supabase secrets" }),
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

    // Create a comprehensive prompt for generating Selenium test cases
    const prompt = `You are an expert Java Selenium test automation engineer. Generate a complete Java Selenium test case with TestNG framework based on the following description:

${description}

Please provide:
1. A list of test steps (as an array of strings)
2. Complete Java code implementation using Selenium WebDriver with TestNG framework

Requirements:
- Use TestNG annotations (@BeforeMethod, @Test, @AfterMethod)
- Use WebDriverWait for explicit waits
- Include proper error handling
- Use modern Selenium practices (Duration instead of deprecated methods)
- Include meaningful assertions
- Add comments for clarity

Format your response as a JSON object with this exact structure:
{
  "steps": ["step 1", "step 2", "step 3", ...],
  "code": "complete Java code here"
}

Only return the JSON object, no additional text or markdown formatting.`;

    // Call Gemini API v1 directly (for newer models like gemini-1.5-flash, gemini-1.5-pro)
    // Change the model name here: gemini-1.5-flash, gemini-1.5-pro, etc.
    const modelName = "gemini-1.5-flash"; // or "gemini-1.5-pro"
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const apiResponse = await response.json();
    
    // Extract text from Gemini API response
    const text = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    // Parse the JSON response from Gemini
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
      console.error("Failed to parse Gemini response:", parseError);
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

