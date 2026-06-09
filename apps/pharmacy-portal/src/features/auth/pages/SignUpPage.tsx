import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StateCityPicker } from '@dawai-setu/domain-ui';
import { pharmacySignUp } from '../api/auth.api';

const schema = z
  .object({
    name: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Invalid phone'),
    state: z.string().min(1, 'Required'),
    city: z.string().min(1, 'Required'),
    address: z.string().min(1, 'Required'),
    pincode: z.string().length(6, 'Must be 6 digits'),
    licenseNo: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const state = watch('state');

  async function onSubmit(values: FormValues) {
    try {
      await pharmacySignUp(values);
      toast.success('Registration successful! Check your email for the OTP.');
      navigate('/verify-email', { state: { email: values.email } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">DawaiSetu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register your pharmacy</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-lg p-6 space-y-4">
          <Field label="Pharmacy name" error={errors.name?.message}>
            <input {...register('name')} placeholder="City Pharmacy" className={inputCls} />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="pharmacy@example.com" className={inputCls} />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <input {...register('phone')} placeholder="9876543210" className={inputCls} />
          </Field>

          <Field label="License number (optional)" error={errors.licenseNo?.message}>
            <input {...register('licenseNo')} placeholder="e.g. MH-2024-001" className={inputCls} />
          </Field>

          <StateCityPicker
            stateValue={state}
            cityValue={watch('city')}
            onStateChange={(v) => { setValue('state', v); setValue('city', ''); }}
            onCityChange={(v) => setValue('city', v)}
            stateError={errors.state?.message}
            cityError={errors.city?.message}
          />

          <Field label="Address" error={errors.address?.message}>
            <input {...register('address')} placeholder="123 Market Street" className={inputCls} />
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
            {isSubmitting ? 'Registering…' : 'Register pharmacy'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{' '}
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
