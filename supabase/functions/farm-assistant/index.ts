import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, healthRecords, animalInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessages = messages || [];

    if (type === "health-analysis") {
      // Health analysis mode
      systemPrompt = `You are an expert veterinary AI assistant specializing in livestock health analysis. 
You analyze health records and symptoms to identify potential issues and provide actionable recommendations.

Guidelines:
- Always emphasize that your analysis is advisory and a licensed veterinarian should be consulted for diagnosis
- Be specific about symptoms that require immediate attention
- Suggest preventive measures when appropriate
- Consider common livestock diseases and conditions
- Provide clear, actionable next steps

When analyzing health records, look for:
- Patterns in symptoms over time
- Signs of common diseases (respiratory, digestive, parasitic, etc.)
- Nutritional deficiencies
- Environmental factors
- Vaccination gaps`;

      const healthContext = healthRecords?.length > 0 
        ? `\n\nHealth Records for analysis:\n${JSON.stringify(healthRecords, null, 2)}`
        : "";
      
      const animalContext = animalInfo 
        ? `\n\nAnimal Information:\n${JSON.stringify(animalInfo, null, 2)}`
        : "";

      userMessages = [
        { 
          role: "user", 
          content: `Please analyze the following health records and provide insights:${animalContext}${healthContext}\n\nProvide a comprehensive health analysis including:
1. Current health status assessment
2. Any concerning patterns or symptoms
3. Potential conditions to watch for
4. Recommended actions and preventive measures` 
        }
      ];
    } else {
      // Chat assistant mode
      systemPrompt = `You are FarmSync AI, a knowledgeable and friendly farm assistant specializing in livestock management.

Your expertise includes:
- Cattle, sheep, goat, and pig health and nutrition
- Breeding best practices and genetics
- Disease prevention and biosecurity
- Pasture management and feeding strategies
- Farm record keeping and traceability
- General farming best practices

Guidelines:
- Be helpful, practical, and concise
- For medical questions, always recommend consulting a veterinarian for diagnosis
- Provide actionable advice based on farming best practices
- Use simple language that farmers can understand
- When uncertain, acknowledge limitations and suggest consulting experts`;
    }

    console.log(`Processing ${type || 'chat'} request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Farm assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
