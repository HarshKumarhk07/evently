import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import OTPInput from '../../components/auth/OTPInput.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { authApi } from '../../api/auth.api.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // request → verify
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('We’ve sent a verification code to your email');
      setStep('verify');
    } catch (err) {
      toast.error(err.message || 'Could not send code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit code');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, password });
      toast.success('Password reset — please log in');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'request' ? 'Reset your password' : 'Verify your email'}
      subtitle={
        step === 'request'
          ? 'Enter your email and we’ll send a verification code.'
          : `We sent a 6-digit code to ${email}.`
      }
      footer={
        <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
          Back to log in
        </Link>
      }
    >
      {step === 'request' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-5">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4 text-brand-400" /> Verification code
            </p>
            <OTPInput value={otp} onChange={setOtp} />
          </div>
          <Input
            label="New password"
            type="password"
            icon={Lock}
            placeholder="At least 6 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Reset password
          </Button>
          <button
            type="button"
            onClick={() => setStep('request')}
            className="w-full text-center text-xs text-slate-400 hover:text-brand-300"
          >
            Didn’t get a code? Try again
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
