import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const categoryLabels: Record<string, string> = {
  bug: "Bug Report",
  billing: "Billing",
  bulk: "Bulk Requests",
  api: "API Access",
  ultimate: "White-label / Ultimate",
  feature: "Feature Request",
  other: "Other",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, message } = await req.json();

    // Validate required fields
    if (!name || !email || !category || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be under 100 characters." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email must be under 255 characters." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message must be under 5000 characters." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const categoryLabel = categoryLabels[category] || category;

    const emailResponse = await resend.emails.send({
      from: "ZippyRouter <noreply@zippyrouter.com>",
      to: ["support@zippyrouter.com"],
      reply_to: email,
      subject: `[ZippyRouter Contact] ${categoryLabel} from ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #1a1a1a;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 100px;">Name</td>
                <td style="padding: 8px 12px; color: #1a1a1a;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: 600; color: #555;">Email</td>
                <td style="padding: 8px 12px; color: #1a1a1a;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: 600; color: #555;">Category</td>
                <td style="padding: 8px 12px; color: #1a1a1a;">${categoryLabel}</td>
              </tr>
            </table>
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">Message</h3>
            <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 16px; font-size: 12px; color: #999;">This email was sent from the ZippyRouter contact form. Reply directly to respond to ${name}.</p>
        </div>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
