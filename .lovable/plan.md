
## Functional Contact Form with Email Routing to support@zippyrouter.com

This plan replaces the current simulated contact form with a real email-sending flow using Resend (already configured) via a new Supabase Edge Function.

---

### 1. New Edge Function: `send-contact-email`

**File: `supabase/functions/send-contact-email/index.ts`**

- Accepts POST requests with JSON body: `{ name, email, category, message }`
- Validates all required fields and enforces length limits (name: 100 chars, email: 255, message: 5000)
- Uses the existing `RESEND_API_KEY` secret to send a nicely formatted HTML email to **support@zippyrouter.com**
- The email includes:
  - Subject line: `[ZippyRouter Contact] {Category} from {Name}`
  - Sender's name, email (as reply-to), category, and full message
  - Clean HTML formatting for easy reading
- Sets the `from` address to `ZippyRouter <noreply@zippyrouter.com>` (requires verified domain on Resend -- see note below)
- Includes proper CORS headers for browser requests
- Returns success/error JSON response

**Config update: `supabase/config.toml`**
- Add `[functions.send-contact-email]` with `verify_jwt = false` (public contact form)

---

### 2. Updated Contact Modal

**File: `src/components/modals/ContactModal.tsx`**

- Replace the simulated `setTimeout` with a real call to the edge function via `supabase.functions.invoke('send-contact-email', ...)`
- Add client-side validation with Zod: name (required, max 100), email (required, valid format), category (required), message (required, max 5000)
- Show inline validation errors below each field
- Remove the file attachment input (not supported without storage upload flow -- keeps things clean)
- Improve the form layout with better spacing and a success state animation
- On success: show toast and close modal
- On error: show descriptive toast with the error message

---

### 3. Important Note on Email Domain

The `from` address in Resend must use a verified domain. You will need to make sure **zippyrouter.com** is verified in your Resend dashboard at https://resend.com/domains. If it is not yet verified:
- You can temporarily use `onboarding@resend.dev` as the from address (Resend's test domain)
- Or verify `zippyrouter.com` in Resend to send from `noreply@zippyrouter.com`

---

### Technical Summary

**Files to create:**
1. `supabase/functions/send-contact-email/index.ts` -- edge function for sending contact emails

**Files to modify:**
2. `supabase/config.toml` -- add function config entry
3. `src/components/modals/ContactModal.tsx` -- wire up to real edge function, add validation

**No new dependencies required.** Uses existing `RESEND_API_KEY` secret and Supabase client.
