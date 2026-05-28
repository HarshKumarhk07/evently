import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Phone, Building2, IdCard, FileText,
  Upload, X, ImagePlus, ShieldCheck, Briefcase, Crosshair, Loader2,
  MailCheck, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button.jsx';
import { Input, Textarea, Select } from '../components/ui/Input.jsx';
import OTPInput from '../components/auth/OTPInput.jsx';
import api, { tokenStore } from '../lib/axios.js';
import { managerApi } from '../api/manager.api.js';
import { useAuth } from '../context/AuthContext.jsx';

const BUSINESS_TYPES = ['Restaurant', 'Turf', 'Event', 'Play', 'Activity'];

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* Inline file-picker — accepts images + PDF. */
function FileField({ label, accept = 'image/*,application/pdf', value, onChange, multiple = false, hint }) {
  const ref = useRef(null);
  const files = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const picked = Array.from(e.target.files || []);
          if (!picked.length) return;
          onChange(multiple ? [...files, ...picked].slice(0, 6) : picked[0]);
          e.target.value = '';
        }}
      />

      {files.length === 0 ? (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-600 bg-ink-900/40 px-4 py-5 text-sm text-slate-400 transition-colors hover:border-brand-500/50 hover:text-slate-200"
        >
          <Upload className="h-4 w-4" />
          Click to upload {multiple ? 'files' : 'a file'}
        </button>
      ) : (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-ink-600 bg-ink-900/50 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 text-white">
                <FileText className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  · {(f.size / 1024).toFixed(0)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(multiple ? files.filter((_, idx) => idx !== i) : null)
                }
                aria-label="Remove file"
                className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {multiple && files.length < 6 && (
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:text-brand-200"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Add another
            </button>
          )}
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const initialForm = {
  /* Owner */
  name: '', email: '', password: '', phone: '',
  /* Business */
  businessName: '', businessType: BUSINESS_TYPES[0], businessAddress: '',
  /* Compliance */
  gstNumber: '', panNumber: '', aadhaarNumber: '',
  /* Banking */
  bankAccountName: '', bankAccountNumber: '', bankIfsc: '',
};

export default function ListYourBusinessPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({
    profileImage: null,
    businessLicense: null,
    idProof: null,
    businessImages: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  /* Two-phase flow:
       `success` = null → form view
       `success` = { email, emailDelivered, emailDeliveryError? } → OTP step */
  const [success, setSuccess] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const fillFromCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await api.get('/geocode/reverse', {
            params: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          const address = result?.data?.address || {};
          const parts = [
            result?.data?.name,
            address.road,
            address.neighbourhood,
            address.suburb,
            address.city || address.town || address.village,
            address.state,
            address.country,
          ].filter(Boolean);
          const nextAddress = parts.join(', ') || result?.data?.display_name || '';
          setForm((prev) => ({
            ...prev,
            businessAddress: nextAddress || prev.businessAddress,
          }));
          setErrors((prev) => {
            const next = { ...prev };
            delete next.businessAddress;
            return next;
          });
          toast.success('Address filled from your current location');
        } catch (err) {
          toast.error(err?.message || 'Could not detect your location');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Could not detect your location');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Full name required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.phone.trim().length < 6) e.phone = 'Valid phone required';
    if (form.businessName.trim().length < 2) e.businessName = 'Business name required';
    if (form.businessAddress.trim().length < 4) e.businessAddress = 'Address required';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.panNumber))
      e.panNumber = 'PAN must look like ABCDE1234F';
    if (!/^\d{12}$/.test(form.aadhaarNumber)) e.aadhaarNumber = 'Aadhaar must be 12 digits';
    if (!files.businessLicense) e.businessLicense = 'Upload business licence';
    if (!files.idProof) e.idProof = 'Upload a government ID proof';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files.profileImage) fd.append('profileImage', files.profileImage);
      if (files.businessLicense) fd.append('businessLicense', files.businessLicense);
      if (files.idProof) fd.append('idProof', files.idProof);
      files.businessImages.forEach((img) => fd.append('businessImages', img));

      const result = await managerApi.register(fd);
      setSuccess({
        email: result.email || form.email,
        emailDelivered: result.emailDelivered,
        emailDeliveryError: result.emailDeliveryError,
      });
      if (result.emailDelivered) {
        toast.success('We’ve sent a verification code to your email');
      } else {
        toast.error(
          result.emailDeliveryError ||
            'We could not send the verification email — please use Resend',
        );
      }
    } catch (err) {
        // If server returned field-level validation errors, show them inline.
        if (err?.details && Array.isArray(err.details)) {
          const next = {};
          err.details.forEach((d) => {
            if (d.field) next[d.field] = d.message;
          });
          setErrors((prev) => ({ ...prev, ...next }));
          toast.error('Please fix the highlighted fields');
        } else {
          toast.error(err?.message || 'Registration failed');
        }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <OtpVerificationStep
        email={success.email}
        emailDelivered={success.emailDelivered}
        emailDeliveryError={success.emailDeliveryError}
        onVerified={({ token, user }) => {
          tokenStore.set(token);
          setUser(user);
          toast.success('Email verified — your application is now under review');
          navigate('/manager', { replace: true });
        }}
      />
    );
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="section relative py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-200">
              <Briefcase className="h-3.5 w-3.5" /> For partners
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              List your business on <span className="text-gradient">Bookify</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm text-slate-400 sm:text-base">
              Reach thousands of customers actively booking dining, plays and events.
              Submit your details below — we typically review applications within
              one business day.
            </p>
          </motion.div>
        </div>
      </section>

      <form onSubmit={submit} className="section -mt-2 space-y-5">
        <Section
          icon={User}
          title="Your account"
          subtitle="This becomes your manager login."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" icon={User} value={form.name} error={errors.name} onChange={set('name')} />
            <Input label="Phone" icon={Phone} value={form.phone} error={errors.phone} onChange={set('phone')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" icon={Mail} value={form.email} error={errors.email} onChange={set('email')} />
            <Input label="Password" type="password" icon={Lock} value={form.password} error={errors.password} onChange={set('password')} />
          </div>
        </Section>

        <Section
          icon={Building2}
          title="Your business"
          subtitle="What you'll be selling on Bookify."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Business name"
              icon={Building2}
              value={form.businessName}
              error={errors.businessName}
              onChange={set('businessName')}
            />
            <Select
              label="Business type"
              value={form.businessType}
              onChange={set('businessType')}
              options={BUSINESS_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <Textarea
            label="Business address"
            rows={2}
            value={form.businessAddress}
            error={errors.businessAddress}
            onChange={set('businessAddress')}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-600 bg-ink-900/30 px-4 py-3">
            <p className="text-xs text-slate-500">
              Use your browser location to fill the address automatically.
            </p>
            <button
              type="button"
              onClick={fillFromCurrentLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-200 transition-colors hover:border-brand-400 hover:bg-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
              {locating ? 'Detecting…' : 'Use current location'}
            </button>
          </div>
        </Section>

        <Section
          icon={IdCard}
          title="Compliance & identity"
          subtitle="We use this for verification only. Stored securely."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="PAN number"
              placeholder="ABCDE1234F"
              value={form.panNumber}
              error={errors.panNumber}
              onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
            />
            <Input
              label="Aadhaar number"
              placeholder="12 digits"
              value={form.aadhaarNumber}
              error={errors.aadhaarNumber}
              onChange={set('aadhaarNumber')}
              inputMode="numeric"
              maxLength={12}
            />
            <Input
              label="GST number (optional)"
              value={form.gstNumber}
              onChange={set('gstNumber')}
            />
          </div>
        </Section>

        <Section
          icon={ShieldCheck}
          title="Documents & images"
          subtitle="Profile picture is shown on your dashboard. JPG, PNG or PDF, up to 8 MB."
        >
          <FileField
            label="Profile image (optional)"
            accept="image/*"
            value={files.profileImage}
            onChange={(f) => setFiles({ ...files, profileImage: f })}
            hint="A clear face photo for your manager profile."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              label="Business licence"
              value={files.businessLicense}
              onChange={(f) => setFiles({ ...files, businessLicense: f })}
              hint={errors.businessLicense || 'Trade license, FSSAI cert, etc.'}
            />
            <FileField
              label="Government ID proof"
              value={files.idProof}
              onChange={(f) => setFiles({ ...files, idProof: f })}
              hint={errors.idProof || 'Aadhaar / Passport / Driver’s licence'}
            />
          </div>
          <FileField
            label="Business images (optional, up to 6)"
            accept="image/*"
            multiple
            value={files.businessImages}
            onChange={(arr) => setFiles({ ...files, businessImages: arr })}
            hint="Help us preview your venue — used in your listing later."
          />
        </Section>

        <Section
          icon={IdCard}
          title="Bank details (optional)"
          subtitle="For future payouts. You can complete this later."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Account holder name" value={form.bankAccountName} onChange={set('bankAccountName')} />
            <Input label="Account number" value={form.bankAccountNumber} onChange={set('bankAccountNumber')} />
            <Input
              label="IFSC"
              value={form.bankIfsc}
              onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })}
            />
          </div>
        </Section>

        <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            By submitting you agree to Bookify’s partner terms and acknowledge that
            your business details will be reviewed by our team before activation.
          </p>
          <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
            Submit application
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────
   Step 2 — OTP verification.
   Shown immediately after the application is submitted. The user enters
   the 6-digit code we emailed them; on success we set their session and
   the parent navigates them to /manager.
   ─────────────────────────────────────────────────────────────────────── */

const RESEND_COOLDOWN_S = 60;

function OtpVerificationStep({ email, emailDelivered, emailDeliveryError, onVerified }) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  /* The first send already used a slot — start the cooldown immediately. */
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [deliveryWarning, setDeliveryWarning] = useState(
    emailDelivered === false ? emailDeliveryError : null,
  );

  /* Tick down the cooldown each second. */
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const verify = async () => {
    if (code.length !== 6) return toast.error('Enter the 6-digit code from your email');
    setVerifying(true);
    try {
      const result = await managerApi.verifyOtp(email, code);
      onVerified(result);
    } catch (err) {
      toast.error(err?.message || 'Verification failed');
      /* Wrong/expired codes clear the input so the user can retype cleanly. */
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const result = await managerApi.resendOtp(email);
      if (result?.emailDelivered) {
        toast.success('A fresh code has been sent to your inbox');
        setDeliveryWarning(null);
      } else {
        toast.error(
          result?.emailDeliveryError ||
            'We could not send the code — please try again in a moment',
        );
        setDeliveryWarning(result?.emailDeliveryError || 'Email delivery failed');
      }
      setCooldown(RESEND_COOLDOWN_S);
      setCode('');
    } catch (err) {
      toast.error(err?.message || 'Could not resend the code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="section flex min-h-[70vh] flex-col items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-center font-display text-2xl font-bold text-white">
          Verify your email
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          We’ve sent a 6-digit verification code to{' '}
          <strong className="text-white">{email}</strong>.
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">
          Don’t see it? Check your spam folder, or request a new one below.
        </p>

        {deliveryWarning && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {deliveryWarning}
          </p>
        )}

        <div className="mt-6">
          <OTPInput value={code} onChange={setCode} />
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-5"
          loading={verifying}
          onClick={verify}
        >
          Verify &amp; continue
        </Button>

        <div className="mt-4 text-center text-xs text-slate-500">
          Didn’t get the code?{' '}
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || resending}
            className="inline-flex items-center gap-1 font-semibold text-brand-300 transition-colors hover:text-brand-200 disabled:text-slate-500"
          >
            {resending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
