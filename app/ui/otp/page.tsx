import type { Metadata } from 'next';
import { OTPPlayground } from '@/components/otp-playground';

export const metadata: Metadata = {
  title: 'OTP — MishaNaer',
  description: 'An animated verification code input, with the shared Richbox controls and Deslop colors.',
};

export default function OTPPage() {
  return <OTPPlayground />;
}
