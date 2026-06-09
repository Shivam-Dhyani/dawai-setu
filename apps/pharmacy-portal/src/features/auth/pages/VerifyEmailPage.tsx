import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { OtpInput } from '@dawai-setu/domain-ui';
import { verifyEmail, sendOtp } from '../api/auth.api';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (otp.length !== 4) return;
    setLoading(true);
    try {
      await verifyEmail(email, otp);
      toast.success('Email verified! You can now sign in.');
      navigate('/sign-in', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Verification failed. Please check the OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) { toast.error('Email not found. Please register again.'); return; }
    setResending(true);
    try {
      await sendOtp(email);
      toast.success('OTP resent to your email.');
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No email found. Please register first.</p>
          <button onClick={() => navigate('/sign-up')} className="text-primary hover:underline text-sm">
            Back to registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">DawaiSetu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verify your email</p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-5 text-center">
          <p className="text-sm text-muted-foreground">
            We sent a 4-digit OTP to <span className="font-medium text-foreground">{email}</span>
          </p>

          <div className="flex justify-center">
            <OtpInput value={otp} onChange={setOtp} />
          </div>

          <button
            onClick={handleVerify}
            disabled={otp.length !== 4 || loading}
            className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify email'}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {resending ? 'Resending…' : "Didn't get the code? Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
