import { apiClient } from '../../../lib/api-client';

export interface PharmacyUser {
  id: string;
  name: string;
  email: string;
}

interface SignInResponse {
  token: string;
  pharmacy: PharmacyUser;
}

interface PharmacySignUpPayload {
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  licenseNo?: string;
  password: string;
  confirmPassword: string;
}

export async function pharmacySignIn(email: string, password: string): Promise<SignInResponse> {
  const { data } = await apiClient.post<{ accessToken: string; pharmacy: PharmacyUser }>(
    '/auth/pharmacy/sign-in',
    { email, password },
  );
  return { token: data.accessToken, pharmacy: data.pharmacy };
}

export async function pharmacySignUp(payload: PharmacySignUpPayload): Promise<void> {
  await apiClient.post('/auth/pharmacy/sign-up', payload);
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { email, code });
}

export async function sendOtp(email: string): Promise<void> {
  await apiClient.post('/auth/send-otp', { email });
}

export async function forgetPassword(
  email: string,
  code: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<void> {
  await apiClient.post('/auth/forget-password', { email, code, newPassword, confirmNewPassword });
}
