import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { managerApi } from '../api/manager.api.js';
import { tokenStore } from '../lib/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * `/verify-email?token=…` — clicked from the email. Hits the backend,
 * stores the session JWT, then routes to the manager dashboard (which
 * shows the "pending approval" screen until the admin clears them).
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const ran = useRef(false);
  const [state, setState] = useState({ status: 'verifying', message: '' });

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    if (!token) {
      setState({ status: 'error', message: 'No verification token in the URL.' });
      return;
    }

    managerApi
      .verifyEmail(token)
      .then(({ token: jwt, user }) => {
        tokenStore.set(jwt);
        setUser(user);
        setState({ status: 'ok', message: '' });
        /* Short delay so the success state is visible before redirect. */
        setTimeout(() => navigate('/manager', { replace: true }), 1200);
      })
      .catch((err) =>
        setState({
          status: 'error',
          message: err?.message || 'Verification failed',
        }),
      );
  }, [params, navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8 text-center"
      >
        {state.status === 'verifying' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              This should only take a second.
            </p>
          </>
        )}

        {state.status === 'ok' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Your application is now under admin review. We’ll email you the
              moment it’s approved.
            </p>
            <Button
              as={Link}
              to="/manager"
              className="mt-6"
              iconRight={ArrowRight}
            >
              Open dashboard
            </Button>
          </>
        )}

        {state.status === 'error' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-500/15 text-red-300">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-slate-400">{state.message}</p>
            <Button as={Link} to="/list-your-business" variant="secondary" className="mt-6">
              Start over
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
