import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, bookmarks } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build bookmark context for the prompt
    const bookmarkList = (bookmarks || [])
      .map((b: { nickname: string; address: string }) => `"${b.nickname}" → ${b.address}`)
      .join("\n");

    const systemPrompt = `You are an address extraction assistant for a route planning app.

Given unstructured text (emails, messages, notes), extract all delivery/visit addresses or location references.

${bookmarkList ? `The user has these saved bookmarks:\n${bookmarkList}\n\nIMPORTANT: If any text in the message matches or closely resembles a bookmark nickname (e.g. "office", "warehouse A", "mom's house"), use the bookmark's full address instead.` : ""}

Rules:
- Extract ONLY addresses/locations, not names or phone numbers
- Return full addresses when available
- If a location is vague (e.g. "the office"), try to match it to a bookmark
- Return addresses in the order they appear in the text
- If no addresses are found, return an empty array
- The first address should be the starting point if one is clearly indicated (e.g. "leaving from...", "starting at...")`;

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
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_addresses",
              description: "Return the extracted addresses from the text.",
              parameters: {
                type: "object",
                properties: {
                  addresses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        address: { type: "string", description: "Full street address or location" },
                        label: { type: "string", description: "Short label like bookmark nickname or street name" },
                        is_start: { type: "boolean", description: "Whether this is indicated as the starting point" },
                      },
                      required: ["address", "label", "is_start"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["addresses"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_addresses" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ addresses: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-addresses error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
