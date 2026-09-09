import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getAuthCallbackUrl, getAuthPageDestination } from '@/lib/authRedirect';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
        window.location.replace('/reset-password');
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signUp: async (email, password, fullName, phone) => {
      const redirectUrl = `${window.location.origin}/auth?next=${encodeURIComponent(getAuthPageDestination('/'))}`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: fullName, phone } },
      });
      return { error };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(),
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) return { error };
      if (data?.url) {
        const popup = window.open(data.url, 'google-oauth', 'width=500,height=600');
        if (!popup) {
          return { error: { message: 'Please allow popups for this site to sign in with Google, then try again.' } as any };
        }
        return new Promise<{ error: any }>((resolve) => {
          let resolved = false;
          const cleanup = () => {
            if (resolved) return;
            resolved = true;
            window.removeEventListener('message', messageHandler);
            window.removeEventListener('storage', storageHandler);
            clearTimeout(timeout);
          };
          const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== 'oauth-complete') return;
            cleanup();
            popup?.close();
            resolve({ error: null });
            window.location.reload();
          };
          window.addEventListener('message', messageHandler);
          const storageHandler = (event: StorageEvent) => {
            if (event.key !== 'oauth-complete') return;
            cleanup();
            popup?.close();
            localStorage.removeItem('oauth-complete');
            resolve({ error: null });
            window.location.reload();
          };
          window.addEventListener('storage', storageHandler);
          const timeout = setTimeout(() => {
            cleanup();
            resolve({ error: { message: 'Sign in timed out. Please try again.' } as any });
          }, 120000);
        });
      }
      return { error: null };
    },
    resetPasswordForEmail: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    },
    updatePassword: async (newPassword) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    },
  }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  // Fallback for any caller mounted outside the provider — should not happen
  // in normal app flow, but keeps render safe.
  return {
    user: null,
    session: null,
    loading: true,
    signIn: async () => ({ error: new Error('AuthProvider missing') }),
    signUp: async () => ({ error: new Error('AuthProvider missing') }),
    signOut: async () => ({ error: new Error('AuthProvider missing') }),
    signInWithGoogle: async () => ({ error: new Error('AuthProvider missing') }),
    resetPasswordForEmail: async () => ({ error: new Error('AuthProvider missing') }),
    updatePassword: async () => ({ error: new Error('AuthProvider missing') }),
  };
}
