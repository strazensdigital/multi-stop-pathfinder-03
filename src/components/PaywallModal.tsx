// src/components/PaywallModal.tsx
import { useAuth } from '../hooks/useAuth';

type Reason = 'address_lock' | 'stops10' | 'guest_limit' | 'free_limit';

export default function PaywallModal({ reason, onClose }: { reason: Reason, onClose:()=>void }) {
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

  const title =
    reason === 'address_lock' ? 'Unlock Address Lock'
  : reason === 'stops10'     ? 'Add More Stops'
  : reason === 'guest_limit' ? 'Create a free account'
  : /* free_limit */           'You’re hitting today’s free limit';

  const body =
    reason === 'address_lock'
      ? 'Pin the final destination and control your route order. Available on Pro.'
    : reason === 'stops10'
      ? 'Go beyond 9 stops with Strazen Route Pro.'
    : reason === 'guest_limit'
      ? 'You’ve used Strazen a few times. Create a free account to keep going and save your progress.'
    : 'You’ve reached today’s limit on the Free plan. Upgrade to Pro to continue immediately.';

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl p-4 space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p>{body}</p>

        {reason === 'guest_limit' ? (
          <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-login')); }} className="w-full bg-black text-white rounded p-2">
            Log in / Sign up
          </button>
        ) : reason === 'free_limit' || reason === 'stops10' || reason === 'address_lock' ? (
          <button onClick={upgrade} className="w-full bg-black text-white rounded p-2">Upgrade to Pro</button>
        ) : null}

        <button onClick={onClose} className="w-full border rounded p-2">Not now</button>
      </div>
    </div>
  );
}
