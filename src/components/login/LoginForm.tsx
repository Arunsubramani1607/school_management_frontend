'use client';

import { useState, useEffect } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSubmit?: (data: { 
    username: string; 
    password: string;
    rememberMe: boolean 
  }) => void;
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); 
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ 
    username?: string; 
    password?: string;
  }>({});
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = (field: 'username' | 'password') => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Function to handle successful login
  const handleSuccessfulLogin = (data: any) => {
    console.log('Login successful, data:', data);

    const authData = {
      ...data,
      username,
      user_type: data.user_type || 'student',
      name: data.name || username,
      id: data.user_id || data.id || username,
    };

    // Use AuthContext login
    login(authData, rememberMe);

    // Call the onSubmit callback if provided
    if (onSubmit) {
      onSubmit({ username, password, rememberMe });
    }

    // Redirect based on user type and backend response
    if (data.redirect_to) {
      // Use backend-specified redirect path
      window.location.href = data.redirect_to;
    } else {
      // Fallback redirect based on user type
      const redirectPaths: Record<string, string> = {
        'admin': '/admin',
        'teacher': '/teacher',
        'student': '/student',
        'staff': '/staff'
      };

      const userType = authData.user_type || 'student';
      const redirectPath = redirectPaths[userType] || '/dashboard';

      console.log('Fallback redirect to:', redirectPath);
      window.location.href = redirectPath;
    }
  };

  // =============================
  // SUBMIT HANDLER
  // =============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Initial login validation
    const newErrors: any = {};

    if (!username.trim()) {
      newErrors.username = 'Please enter your username';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!password.trim()) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setIsLoading(false);
      return;
    }

    // Login API call
    try {
      const res = await fetch(
        'https://school-management-backend-gsza.onrender.com/api/accounts/login/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }
      );

      const data = await res.json();

      if (res.ok) {
        handleSuccessfulLogin(data);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing token on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      const token = Cookies.get('token');
      const tokenExpiry = Cookies.get('token_expiry');
      
      if (token && tokenExpiry) {
        const now = new Date();
        const expiryDate = new Date(tokenExpiry);
        
        if (now < expiryDate) {
          // Token is still valid
          const userType = Cookies.get('auth_user_type');
          const userData = Cookies.get('auth_user');
          
          if (userData && userType) {
            try {
              const user = JSON.parse(userData);
              // Redirect based on user type
              const redirectPaths: Record<string, string> = {
                'admin': '/admin',
                'teacher': '/teacher',
                'student': '/student',
                'staff': '/staff'
              };
              const redirectPath = redirectPaths[userType] || '/dashboard';
              console.log('Valid session found, redirecting to:', redirectPath);
              window.location.href = redirectPath;
            } catch (e) {
              console.error('Error parsing user data:', e);
              Cookies.remove('auth_user');
              Cookies.remove('auth_user_type');
              Cookies.remove('token');
              Cookies.remove('session_key');
              Cookies.remove('token_expiry');
            }
          }
        } else {
          // Token expired, clear auth cookies
          Cookies.remove('auth_user');
          Cookies.remove('auth_user_type');
          Cookies.remove('token');
          Cookies.remove('session_key');
          Cookies.remove('token_expiry');
        }
      }
    };

    checkExistingSession();
  }, []);

  // =============================
  // INITIAL LOGIN FORM
  // =============================
  return (
    <div className="space-y-5">
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <FaUser className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              clearError('username');
            }}
            className={`pl-10 w-full px-4 py-3.5 border ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
            placeholder="Enter your username or email"
            disabled={isLoading}
          />
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <FaLock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            className={`pl-10 pr-10 w-full px-4 py-3.5 border ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>
        
        <button
          type="button"
          onClick={() => {
            // Forgot password functionality
            if (!username.trim()) {
              alert('Please enter your username first');
              return;
            }
            // Implement forgot password flow
            alert(`Password reset link will be sent to ${username}`);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full ${
          isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold py-3.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isLoading ? (
          <>
            <span>Signing in...</span>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <FaArrowRight
              className={`transition-transform ${
                isHovered ? 'translate-x-2' : ''
              }`}
            />
          </>
        )}
      </button>
    </form>
    </div>
  );
};
