import type { VercelRequest, VercelResponse } from '@vercel/node';
import dns from 'dns';

const resolver = dns.promises;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed' });
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ ok: false, reason: 'Invalid email' });

    const parts = email.split('@');
    if (parts.length !== 2) return res.status(400).json({ ok: false, reason: 'Invalid email' });

    const domain = parts[1].toLowerCase();
    try {
      const mx = await resolver.resolveMx(domain);
      if (!mx || mx.length === 0) return res.status(200).json({ ok: false, reason: 'No MX records' });
      return res.status(200).json({ ok: true });
    } catch {
      // If MX fails, try A as a weak fallback
      try {
        await resolver.resolve4(domain);
        return res.status(200).json({ ok: true, weak: true });
      } catch {
        return res.status(200).json({ ok: false, reason: 'Domain not resolvable' });
      }
    }
  } catch (e: any) {
    return res.status(500).json({ ok: false, reason: e?.message || 'Server error' });
  }
}
