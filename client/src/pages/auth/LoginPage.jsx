import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(user.role === 'admin' ? '/admin' : redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your bookings and favorites."
      footer={
        <>
          New to Bookify?{' '}
          <Link to="/signup" className="font-semibold text-brand-300 hover:text-brand-200">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-slate-400 hover:text-brand-300"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <div className="mt-5 rounded-xl border border-ink-600 bg-ink-900/60 p-3 text-xs text-slate-500">
        <p className="font-medium text-slate-400">Demo accounts</p>
        <p className="mt-1">User — user@bookify.app / user123</p>
        <p>Admin — admin@bookify.app / admin123</p>
      </div>
    </AuthLayout>
  );
}
