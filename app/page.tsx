import type { Metadata } from 'next';
import { PasswordPlayground } from '@/components/password-playground';

export const metadata: Metadata = {
  title: 'Password — MishaNaer',
  description: 'An animated verification code input, with the shared Richbox controls and Deslop colors.',
};

export default function PasswordPage() {
  return <PasswordPlayground />;
}
