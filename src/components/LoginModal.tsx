import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email);
    setSent(true);
  };
  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
      <form onSubmit={submit} className="bg-white w-full max-w-sm rounded-xl p-4 space-y-3">
        <h3 className="text-lg font-semibold">Sign in to continue</h3>
        {sent ? (
          <p>Check your email for the magic link.</p>
        ) : (
          <>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="w-full border rounded p-2" />
            <button className="w-full bg-black text-white rounded p-2">Send magic link</button>
          </>
        )}
        <button type="button" onClick={onClose} className="w-full border rounded p-2">Close</button>
      </form>
    </div>
  );
}
