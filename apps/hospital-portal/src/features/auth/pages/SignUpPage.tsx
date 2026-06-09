import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StateCityPicker } from '@dawai-setu/domain-ui';
import { hospitalSignUp } from '../api/auth.api';

const schema = z
  .object({
    role: z.enum(['DOCTOR', 'PHARMACIST']),
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Invalid phone'),
    state: z.string().min(1, 'Required'),
    city: z.string().min(1, 'Required'),
    address: z.string().min(1, 'Required'),
    pincode: z.string().length(6, 'Must be 6 digits'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'DOCTOR' },
  });

  const role = watch('role');
  const state = watch('state');

  function addSpecialization() {
    const trimmed = specInput.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations((prev) => [...prev, trimmed]);
    }
    setSpecInput('');
  }

  function removeSpecialization(spec: string) {
    setSpecializations((prev) => prev.filter((s) => s !== spec));
  }

  async function onSubmit(values: FormValues) {
    if (values.role === 'DOCTOR' && specializations.length === 0) {
      toast.error('Add at least one specialization');
      return;
    }
    try {
      await hospitalSignUp({
        ...values,
        specializations: values.role === 'DOCTOR' ? specializations : undefined,
      });
      toast.success('Account created! Check your email for the OTP.');
      navigate('/verify-email', { state: { email: values.email } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Sign-up failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">DawaiSetu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your hospital account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-lg p-6 space-y-4">
          {/* Role selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium">I am a</label>
            <div className="flex gap-3">
              {(['DOCTOR', 'PHARMACIST'] as const).map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={r} {...register('role')} />
                  <span className="text-sm">{r === 'DOCTOR' ? 'Doctor' : 'Pharmacist'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              <input {...register('firstName')} placeholder="Jane" className={inputCls} />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <input {...register('lastName')} placeholder="Doe" className={inputCls} />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="you@hospital.com" className={inputCls} />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <input {...register('phone')} placeholder="9876543210" className={inputCls} />
          </Field>

          {/* Specializations — DOCTOR only */}
          {role === 'DOCTOR' && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Specializations</label>
              <div className="flex gap-2">
                <input
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addSpecialization(); }
                  }}
                  placeholder="e.g. Cardiology"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  Add
                </button>
              </div>
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {specializations.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded px-2 py-0.5"
                    >
                      {s}
                      <button type="button" onClick={() => removeSpecialization(s)} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <StateCityPicker
            stateValue={state}
            cityValue={watch('city')}
            onStateChange={(v) => { setValue('state', v); setValue('city', ''); }}
            onCityChange={(v) => setValue('city', v)}
            stateError={errors.state?.message}
            cityError={errors.city?.message}
          />

          <Field label="Address" error={errors.address?.message}>
            <input {...register('address')} placeholder="123 Main Street" className={inputCls} />
          </Field>

          <Field label="Pincode" error={errors.pincode?.message}>
            <input {...register('pincode')} placeholder="400001" className={inputCls} />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Min 8 characters" className={inputCls} />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={inputCls} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls =
  'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
