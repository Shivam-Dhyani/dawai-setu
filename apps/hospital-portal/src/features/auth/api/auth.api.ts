import { apiClient } from '../../../lib/api-client';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  roleName: 'DOCTOR' | 'PHARMACIST';
}

interface SignInResponse {
  token: string;
  user: AuthUser;
}

interface HospitalSignUpPayload {
  role: 'DOCTOR' | 'PHARMACIST';
  firstName: string;
  lastName: string;
  email: string;
  specializations?: string[];
  state: string;
  city: string;
  address: string;
  pincode: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export async function hospitalSignIn(email: string, password: string): Promise<SignInResponse> {
  const { data } = await apiClient.post<{ accessToken: string; user: AuthUser }>(
    '/auth/hospital/sign-in',
    { email, password },
  );
  // Normalize accessToken → token so the auth store interface stays clean
  return { token: data.accessToken, user: data.user };
}

export async function hospitalSignUp(payload: HospitalSignUpPayload): Promise<void> {
  await apiClient.post('/auth/hospital/sign-up', payload);
}

// Backend VerifyOtpDto uses `code` field
export async function verifyEmail(email: string, code: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { email, code });
}

export async function sendOtp(email: string): Promise<void> {
  await apiClient.post('/auth/send-otp', { email });
}

// Backend ForgetPasswordDto uses `code` and `confirmNewPassword`
export async function forgetPassword(
  email: string,
  code: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<void> {
  await apiClient.post('/auth/forget-password', { email, code, newPassword, confirmNewPassword });
}
