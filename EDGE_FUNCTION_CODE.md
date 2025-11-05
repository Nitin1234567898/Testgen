# Supabase Edge Function - Copy-Paste Ready Code

This is the complete TypeScript code you can copy-paste directly into your Supabase Edge Function.

## Function Name: `generate-test`

## Complete Code (Copy this entire code block):

```typescript
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

    // Dynamically discover available models using ListModels API
    // This is a permanent fix that adapts to API changes
    let availableModel = null;
    const apiVersions = ["v1beta", "v1"];
    
    for (const version of apiVersions) {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/${version}/models?key=${geminiApiKey}`;
        const listResponse = await fetch(listUrl);
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const models = listData.models || [];
          
          // Find first model that supports generateContent
          for (const model of models) {
            const supportedMethods = model.supportedGenerationMethods || [];
            if (supportedMethods.includes("generateContent")) {
              availableModel = {
                name: model.name.replace(`models/`, ""),
                version: version
              };
              break;
            }
          }
          
          if (availableModel) break;
        }
      } catch (err) {
        continue;
      }
    }

    // Fallback to common models if listModels fails
    if (!availableModel) {
      const fallbackModels = [
        { name: "gemini-pro", version: "v1beta" },
        { name: "gemini-1.0-pro", version: "v1beta" }
      ];
      
      for (const model of fallbackModels) {
        try {
          const testUrl = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${geminiApiKey}`;
          const testResponse = await fetch(testUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "test" }] }] })
          });
          
          if (testResponse.ok || testResponse.status === 400) {
            availableModel = model;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!availableModel) {
      throw new Error("Could not find any available Gemini models.");
    }

    // Call Gemini API with discovered model
    const apiUrl = `https://generativelanguage.googleapis.com/${availableModel.version}/models/${availableModel.name}:generateContent?key=${geminiApiKey}`;
    
    const apiResponse = await fetch(apiUrl, {
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

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Gemini API error: ${apiResponse.status} - ${errorText}`);
    }

    const responseData = await apiResponse.json();
    
    // Extract text from Gemini API response
    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    
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
```

## Quick Setup Steps:

1. **Go to Supabase Dashboard** → Edge Functions → Create Function
2. **Name it**: `generate-test`
3. **Copy the code above** and paste it into the editor
4. **Add Secret**: Go to Project Settings → Edge Functions → Secrets
   - Add `GEMINI_API_KEY` with your Gemini API key
5. **Deploy** the function
6. **Configure frontend**: Add environment variables to your `.env` file:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

That's it! Your frontend is already configured to call this function.

