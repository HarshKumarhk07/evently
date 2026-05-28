import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Briefcase, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import GoogleButton from '../../components/auth/GoogleButton.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CITIES } from '../../lib/constants.js';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: CITIES[0],
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      toast.success(`Welcome to Bookify, ${user.name.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute — and it’s free."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton
        label="Sign up with Google"
        onSuccess={() => navigate('/dashboard', { replace: true })}
      />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-600" />
        <span className="text-xs uppercase tracking-wider text-slate-500">or</span>
        <span className="h-px flex-1 bg-ink-600" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          icon={User}
          placeholder="Aisha Khan"
          value={form.name}
          error={errors.name}
          onChange={update('name')}
        />
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={update('email')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone"
            icon={Phone}
            placeholder="Optional"
            value={form.phone}
            onChange={update('phone')}
          />
          <Select
            label="City"
            value={form.city}
            onChange={update('city')}
            options={CITIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="At least 6 characters"
          value={form.password}
          error={errors.password}
          onChange={update('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          icon={Lock}
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={update('confirmPassword')}
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      {/* Business partner CTA — this is how prospective managers discover
          the partner program, replacing the previous navbar link. */}
      <Link
        to="/list-your-business"
        className="mt-6 flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 transition-colors hover:border-brand-400 hover:bg-brand-500/15"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
          <Briefcase className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">
            Sign up as a business associate
          </span>
          <span className="block text-xs text-brand-200/80">
            Run a restaurant, turf, event or play? List on Bookify.
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-brand-300" />
      </Link>
    </AuthLayout>
  );
}
