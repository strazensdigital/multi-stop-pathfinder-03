import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

  const { email } = req.body as { email?: string };
  const success = `${process.env.APP_URL ?? 'https://'+req.headers.host}/app?upgraded=1`;
  const cancel = `${process.env.APP_URL ?? 'https://'+req.headers.host}/app?canceled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRICE_PRO!, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: success,
    cancel_url: cancel
  });

  return res.status(200).json({ url: session.url });
}
