import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OtpInput } from '@dawai-setu/domain-ui';
import { sendOtp, forgetPassword } from '../api/auth.api';

const emailSchema = z.object({ email: z.string().email('Invalid email') });
type EmailValues = z.infer<typeof emailSchema>;

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function onSendOtp(values: EmailValues) {
    try {
      await sendOtp(values.email);
      setEmail(values.email);
      setStep('reset');
      toast.success('OTP sent to your email.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to send OTP.');
    }
  }

  async function onResetPassword(values: ResetValues) {
    if (otp.length !== 4) { toast.error('Enter the 4-digit OTP.'); return; }
    try {
      await forgetPassword(email, otp, values.newPassword, values.confirmPassword);
      toast.success('Password reset successfully. You can now sign in.');
      navigate('/sign-in', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Password reset failed.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">DawaiSetu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          {step === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your registered email and we'll send you a reset OTP.
              </p>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  {...emailForm.register('email')}
                  type="email"
                  placeholder="pharmacy@example.com"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {emailForm.formState.isSubmitting ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the OTP sent to <span className="font-medium text-foreground">{email}</span> and choose a new password.
              </p>

              <div className="space-y-1">
                <label className="text-sm font-medium">OTP</label>
                <div className="flex justify-center">
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">New password</label>
                <input
                  {...resetForm.register('newPassword')}
                  type="password"
                  placeholder="Min 8 characters"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input"
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Confirm password</label>
                <input
                  {...resetForm.register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input"
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {resetForm.formState.isSubmitting ? 'Resetting…' : 'Reset password'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link to="/sign-in" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
