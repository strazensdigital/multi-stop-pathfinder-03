// api/portal.ts
import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
  const { email } = req.body as { email?: string };
  // Find customer by email
  const customers = await stripe.customers.list({ email: email || undefined, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return res.status(400).json({ error: 'Customer not found' });
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${process.env.APP_URL ?? 'https://'+req.headers.host}/`,
  });
  return res.json({ url: session.url });
}
