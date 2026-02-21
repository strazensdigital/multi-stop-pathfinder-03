import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactRequest {
  name: string;
  email: string;
  category: string;
  message: string;
}

const categoryLabels: Record<string, string> = {
  bug: "🐛 Bug Report",
  billing: "💳 Billing",
  bulk: "📦 Bulk / Enterprise",
  api: "🔌 API Access",
  ultimate: "🏷️ White-label / Ultimate",
  feature: "💡 Feature Request",
  partnership: "🤝 Partnership",
  other: "❓ Other",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendKey);
    const { name, email, category, message }: ContactRequest = await req.json();

    if (!name || !email || !category || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryLabel = categoryLabels[category] || category;

    const { error } = await resend.emails.send({
      from: "ZippyRouter Contact <noreply@zippyrouter.com>",
      to: ["support@zippyrouter.com"],
      replyTo: email,
      subject: `[${categoryLabel}] New message from ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 12px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #666; width: 100px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Category</td><td style="padding: 8px 0;">${categoryLabel}</td></tr>
          </table>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 12px;">
            <p style="color: #666; margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
            <p style="color: #1a1a1a; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">Sent from ZippyRouter contact form</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-contact function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
