import { useAuth } from '../hooks/useAuth';

export default function PaywallModal({ reason, onClose }: { reason:'address_lock'|'stops10', onClose:()=>void }) {
  const { email } = useAuth();
  const upgrade = async () => {
    const resp = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ email })
    });
    const { url } = await resp.json();
    window.location.href = url;
  };
  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl p-4 space-y-3">
        <h3 className="text-lg font-semibold">Unlock Address Lock & Unlimited Stops</h3>
        <p>Pin the 1st, last, or any stop and go beyond 9 stops. <b>Pro is $12/mo for 3 months</b>, then $19. Cancel anytime.</p>
        <button onClick={upgrade} className="w-full bg-black text-white rounded p-2">Upgrade</button>
        <button onClick={onClose} className="w-full border rounded p-2">Not now</button>
      </div>
    </div>
  );
}
