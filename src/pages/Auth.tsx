import { useState, useEffect, useRef } from 'react';
import rprxLogo from '@/assets/rprx-logo.png';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPhone, isValidUSPhone } from '@/lib/phoneFormat';
import { getAuthPageDestination } from '@/lib/authRedirect';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = authSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .regex(/^[^\d]+$/, { message: 'Full name cannot contain numbers' }),
  phone: z
    .string()
    .refine(isValidUSPhone, { message: 'Please enter a valid US phone number' }),
});

type AuthView = 'login' | 'forgot-password';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, signInWithGoogle, resetPasswordForEmail } = useAuth();
  const justSignedUp = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<AuthView>('login');

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);

    const emailResult = z.string().trim().email({ message: 'Please enter a valid email address' }).safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox — and your spam/junk folder if it doesn\'t arrive within 2 minutes.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && user && !justSignedUp.current) {
      navigate(getAuthPageDestination('/'), { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (mode: 'login' | 'signup') => {
    setError(null);
    setSuccess(null);

    if (mode === 'login') {
      const result = authSchema.safeParse({ email, password });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }
    } else {
      const result = signupSchema.safeParse({ email, password, fullName, phone });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (error.message.toLowerCase().includes('banned') || error.message.toLowerCase().includes('user is banned')) {
            setError('This account is locked, contact the administrator for information.');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else {
            setError(error.message);
          }
        } else {
          // Check if auto-login occurred (immediate_login_after_signup)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            justSignedUp.current = true;
            navigate(getAuthPageDestination('/'), { replace: true });
            return;
          }

          setSuccess('Account created! Check your inbox to confirm your email. If you don\'t see it within 2 minutes, check your spam/junk folder or try resending.');
          setEmail('');
          setPassword('');
          setFullName('');
          setPhone('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setView('login');
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleForgotPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4" style={{ perspective: '1000px' }}>
            <img 
              src={rprxLogo} 
              alt="RPRx Logo" 
              className="h-24 w-24 object-contain animate-spin-y" 
              style={{ transformStyle: 'preserve-3d' }}
            />
          </div>
          <CardTitle className="text-2xl font-bold">RPRx 4 Life</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => handleSubmit('login')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => {
                  setView('forgot-password');
                  setError(null);
                  setSuccess(null);
                }}
              >
                Forgot password?
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="signup-fullname">Full Name</Label>
                <Input
                  id="signup-fullname"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone Number</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => handleSubmit('signup')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="absolute bottom-4 text-xs text-muted-foreground text-center px-4">
        By continuing you agree to our{' '}
        <a href="/terms" className="underline hover:text-foreground">Terms</a> and{' '}
        <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
      </p>
    </div>
  );
};

export default Auth;
