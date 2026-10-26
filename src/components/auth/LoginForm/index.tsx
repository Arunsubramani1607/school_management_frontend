// src/components/auth/LoginForm/index.tsx

'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { LoginFormFields } from './LoginFormFields';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';
import { LoginData } from '@/types';
// Import toast functions
import {
  toastError,
  toastSuccess,
  toastWarning
} from '@/lib/toast';

import { useRouter } from 'next/navigation';

const publicDemoCredentials =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' &&
  process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL &&
  process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD
    ? {
        email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL,
        password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD,
      }
    : null;

interface LoginFormProps {
  onSubmit?: (data: LoginData) => void;
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'otp' | 'password'>('request');
  const [resetUsername, setResetUsername] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleSuccessfulLogin = (data: any) => {

    if (!data.token) {
      toastError('No token received');
      return;
    }

    toastSuccess(`Welcome back, ${data.user_type}!`);


    const enrichedData = {
      ...data,
      username: data.username || username,
      staff_role: data.staff_role || undefined,
    };

    // Cookie-based login
    login(enrichedData, rememberMe);

    setTimeout(() => {
      if (data.user_type === 'super_admin') {
        router.push('/admin');
        return;
      }
      if (data.user_type === 'staff') {
        router.push('/staff');
        return;
      }
      router.push(`/${data.user_type}`);
    }, 1500);
  };


  const resetForgotPasswordFlow = () => {
    setResetStep('request');
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetMessage('');
    setResetLoading(false);
  };

  const getApiErrorMessage = (error: any, fallback: string) => (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.detail ||
    error.message ||
    fallback
  );

  const handleForgotPassword = () => {
    resetForgotPasswordFlow();
    setResetUsername(username.trim());
    setForgotPasswordOpen(true);
  };

  const handleCloseForgotPassword = () => {
    if (resetLoading) return;
    setForgotPasswordOpen(false);
    resetForgotPasswordFlow();
  };

  const handleRequestPasswordResetOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = resetUsername.trim();
    if (!trimmedUsername) {
      toastWarning('Please enter your username or phone number');
      return;
    }

    setResetLoading(true);
    setResetMessage('');

    try {
      const response = await api.passwordReset.request({
        username: trimmedUsername,
        method: 'email',
      });

      const debugOtp = response.data?.debug_otp;
      const message = debugOtp
        ? `${response.data?.message || 'OTP generated.'} Development OTP: ${debugOtp}`
        : response.data?.message || 'OTP sent successfully.';
      setResetUsername(trimmedUsername);
      setResetMessage(message);
      setResetStep('otp');
      toastSuccess(message);
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, 'Failed to send password reset OTP.');
      toastError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyPasswordResetOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resetOtp.trim()) {
      toastWarning('Please enter the OTP');
      return;
    }

    setResetLoading(true);
    setResetMessage('');

    try {
      const response = await api.passwordReset.verifyOtp({
        username: resetUsername.trim(),
        otp: resetOtp.trim(),
      });

      const message = response.data?.message || 'OTP verified successfully.';
      setResetMessage(message);
      setResetStep('password');
      toastSuccess(message);
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, 'Failed to verify OTP.');
      toastError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resetNewPassword.trim()) {
      toastWarning('Please enter a new password');
      return;
    }

    if (resetNewPassword.length < 6) {
      toastWarning('Password must be at least 6 characters');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      toastWarning('Passwords do not match');
      return;
    }

    setResetLoading(true);
    setResetMessage('');

    try {
      const response = await api.passwordReset.confirm({
        username: resetUsername.trim(),
        otp: resetOtp.trim(),
        new_password: resetNewPassword,
        confirm_password: resetConfirmPassword,
      });

      const message = response.data?.message || 'Password changed successfully.';
      toastSuccess(message);
      setForgotPasswordOpen(false);
      resetForgotPasswordFlow();
      setPassword('');
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, 'Failed to update password.');
      toastError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isLoading) return;

    setIsLoading(true);
    setApiResponse(null);

    // Initial login validation
    const newErrors: any = {};

    if (!username.trim()) {
      newErrors.username = 'Please enter your username';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!password.trim()) {
      newErrors.password = 'Please enter your password';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Validation errors:', newErrors);
      setIsLoading(false);

      return;
    }

    try {
      const response = await api.auth.login({ username, password });
      const data = response.data;

      setApiResponse(data);

      const isFinalizedLogin =
        !!data.token &&
        !!data.session_key &&
        !!data.user_type;

      if (isFinalizedLogin) {
        toastSuccess('Login successful!');
        handleSuccessfulLogin(data);
      } else {
        const errorMessage = data.error || data.message || 'Login failed';
        toastError(errorMessage);
        console.error('❌ Login failed:', errorMessage);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';

      toastError(errorMessage);
      console.error('❌ Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="login"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <LoginFormFields
            username={username}
            password={password}
            rememberMe={rememberMe}
            errors={errors}
            isLoading={isLoading}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onRememberMeChange={setRememberMe}
            onForgotPassword={handleForgotPassword}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
          />
          {publicDemoCredentials && (
            <aside className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <div className="font-semibold">Try the public demo</div>
              <div className="mt-2">Email: {publicDemoCredentials.email}</div>
              <div>Password: {publicDemoCredentials.password}</div>
              <button
                type="button"
                className="mt-3 rounded-lg bg-blue-700 px-3 py-2 font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                disabled={isLoading}
                onClick={() => {
                  setUsername(publicDemoCredentials.email);
                  setPassword(publicDemoCredentials.password);
                }}
              >
                Fill demo login
              </button>
            </aside>
          )}
        </form>

        <ForgotPasswordDialog
          isOpen={forgotPasswordOpen}
          step={resetStep}
          username={resetUsername}
          otp={resetOtp}
          newPassword={resetNewPassword}
          confirmPassword={resetConfirmPassword}
          isLoading={resetLoading}
          message={resetMessage}
          onClose={handleCloseForgotPassword}
          onUsernameChange={setResetUsername}
          onOtpChange={setResetOtp}
          onNewPasswordChange={setResetNewPassword}
          onConfirmPasswordChange={setResetConfirmPassword}
          onRequestOtp={handleRequestPasswordResetOtp}
          onVerifyOtp={handleVerifyPasswordResetOtp}
          onConfirmPassword={handleConfirmPasswordReset}
          onBackToRequest={() => {
            setResetStep('request');
            setResetOtp('');
            setResetMessage('');
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};
