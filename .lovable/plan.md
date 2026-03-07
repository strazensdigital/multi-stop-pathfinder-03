

## Plan: Fix Landing Page Pricing Flow, Stripe Key, and Annual Billing

### Problem Summary

1. **Landing page pricing button behavior**: When clicking the Pro tier buttons in the pricing modal opened from the landing page, if the user isn't logged in, it calls `onGetStarted` which navigates to `/app` instead of opening the auth dialog (like the hamburger menu does).
2. **Stripe test key**: You're currently using a test key -- you should switch to a live key.
3. **Annual product**: Already exists in Stripe (product `prod_TwmQLCCvKV7BL1` with price `price_1Sysro3EdvVx6r8ZHYjmazba` at $69/year). No new Stripe product needed.
4. **Cancellation handling**: When a user stops paying, the `check-subscription` edge function already handles this -- it checks Stripe for active subscriptions and updates the profile to "free" if none are found. So yes, cancellation/non-payment automatically downgrades the user.

---

### Changes

#### 1. Fix PricingModal on Landing Page

**File: `src/components/LandingPage.tsx`**

- Add auth state awareness by importing `useAuth` and `AuthDialog`
- Change the `onGetStarted` callback passed to `PricingModal` so it opens the auth dialog instead of navigating to `/app`
- Add an `AuthDialog` component to the landing page

This way, when an unauthenticated user clicks "Get Pro" in the pricing modal on the landing page, they see the login/signup dialog (same as the hamburger menu behavior) instead of being redirected.

#### 2. Update PricingModal Pro Features

**File: `src/components/modals/PricingModal.tsx`**

- Change "Unlimited stops" to "25 stops" in the Pro plan feature list to match the FAQ

#### 3. Stripe Live Key

This is a manual step for you:
- Go to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys) and copy the **live** secret key (starts with `sk_live_...`)
- Then we can update the `STRIPE_SECRET_KEY` secret in Supabase with the live key
- **Important**: Make sure your live Stripe account has the same products/prices, or create new ones. The price IDs will be different between test and live mode.

#### 4. No Database Changes Needed

- The `profiles` table already has `plan` and `plan_source` columns
- The `check-subscription` function already syncs plan status from Stripe on every call
- When a subscription is canceled or expires, Stripe marks it inactive, and `check-subscription` returns `plan: "free"` and updates the profile accordingly

---

### How Cancellation Works (Already Implemented)

```text
User stops paying
       |
       v
Stripe marks subscription inactive/canceled
       |
       v
Next time check-subscription runs (on page load / login)
       |
       v
No active subscription found -> profile.plan set to "free"
       |
       v
User loses Pro features
```

### Technical Details

The key fix is in `LandingPage.tsx` where the `PricingModal` receives `onGetStarted={onGetStarted}` which calls `navigate('/app')`. Instead, it should open an auth dialog locally, matching the hamburger menu pattern. After successful auth, the user can then proceed to checkout.

