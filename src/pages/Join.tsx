import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow, normalizeOnboardingPath } from '@/hooks/useFirstLoginFlow';
import { resolveFinalOnboardingPath } from '@/lib/onboardingRoute';
import type { FirstLoginFlowPreset } from '@/lib/firstLoginFlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import rprxLogo from '@/assets/rprx-logo.png';
import { VideoPlayer } from '@/components/media/VideoPlayer';



interface PendingCompany {
  id: string;
  name: string;
  invite_token: string;
  first_login_flow: FirstLoginFlowPreset | null;
  join_video_url: string | null;
}

/**
 * /join?token=<invite_token>
 *
 * Two flows:
 *   1. Already logged in  → join company immediately → /dashboard
 *   2. Not logged in       → show company name (locked) + signup form
 *                          → after signup, join company → destination per First-Login Flow
 */
export default function Join() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const advisorRef = (searchParams.get('ref') || searchParams.get('aff') || searchParams.get('affiliate') || '').trim();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { joinByToken } = useCompany();
  const { profile, isProfileComplete, isLoading: profileLoading } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading, isFetched: assessmentsFetched } = useAssessmentHistory();
  const { preset, globalPath, globalRaw, isLoading: presetLoading } = useFirstLoginFlow();


  const [pendingCompany, setPendingCompany] = useState<PendingCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pendingNavigate, setPendingNavigate] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [dataTimeoutHit, setDataTimeoutHit] = useState(false);


  // Sign-up form state (used when not authenticated)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Step 1: Look up company from token ──────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError('Missing invite token. Please use the full invite link.');
      setLoading(false);
      return;
    }

    async function lookup() {
      const { data, error: err } = await supabase
        .rpc('lookup_company_by_invite_token', { _token: token });

      const match = Array.isArray(data) ? data[0] : data;

      if (err || !match) {
        setError('This invite link is invalid or has expired.');
      } else {
        setPendingCompany({
          id: match.id,
          name: match.name,
          invite_token: token,
          first_login_flow: (match.first_login_flow ?? null) as FirstLoginFlowPreset | null,
          join_video_url: (match as any).join_video_url ?? null,
        });
        // Persist token so useProfile can pick it up after Google OAuth
        localStorage.setItem('pending_invite_token', token);
        if (advisorRef) localStorage.setItem('pending_affiliate_ref', advisorRef);
      }
      setLoading(false);
    }

    lookup();
  }, [token]);
  useEffect(() => {
    if (!user || !pendingCompany || loading) return;
    if (joinError) return; // don't loop after a failure — user must retry
    // Wait for supporting queries, but bail out after 15s so we never hang forever.
    const stillWaiting = presetLoading || profileLoading || assessmentsLoading || !assessmentsFetched;
    if (stillWaiting && !dataTimeoutHit) return;

    let cancelled = false;
    async function autoJoin() {
      try {
        if (!hasJoined) {
          await joinByToken({
            token,
            ref: advisorRef || null,
            landingPath: `${window.location.pathname}${window.location.search}`,
          });
          if (cancelled) return;
          setHasJoined(true);
          supabase.functions.invoke('ghl-sync', {
            body: { source: 'company-join', changedKeys: ['company_id', 'affiliate_attribution'] },
          }).catch((err) => console.warn('[join] GHL sync failed', err));
          toast.success(`You've joined ${pendingCompany!.name}!`);
        }
        const hasAssessments = (assessments || []).some(a => a.completed_at);
        const companyOverridePath = normalizeOnboardingPath(pendingCompany!.first_login_flow);
        const companyOverrideEnabled = pendingCompany!.first_login_flow != null;
        const { path: finalRedirectPath, reason } = resolveFinalOnboardingPath({
          onboardingCompleted: profile?.onboarding_completed,
          isProfileComplete,
          hasAssessments,
          companyOverrideEnabled,
          companyOverridePath,
          globalPath,
        });
        console.debug('[onboarding-route]', {
          source: 'join',
          user: user!.id,
          companyOverrideEnabled,
          companyOverridePath,
          globalRaw,
          globalNormalized: globalPath,
          reason,
          finalRedirectPath,
          dataTimeoutHit,
        });
        navigate(finalRedirectPath, { replace: true });
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message ?? 'Failed to join company.';
          console.error('[join] autoJoin failed:', err);
          setJoinError(msg);
        }
      }
    }

    autoJoin();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingCompany, loading, presetLoading, profileLoading, assessmentsLoading, assessmentsFetched, preset, globalPath, isProfileComplete, joinError, dataTimeoutHit, profile?.onboarding_completed, advisorRef]);

  // Hard timeout: if supporting queries never resolve, stop gating on them
  // after 15s so autoJoin can proceed (and fail loudly if the RPC errors).
  useEffect(() => {
    if (!user || !pendingCompany || loading) return;
    const stillWaiting = presetLoading || profileLoading || assessmentsLoading || !assessmentsFetched;
    if (!stillWaiting) return;
    const timer = setTimeout(() => {
      console.warn('[join] data-gate timeout — proceeding without full data');
      setDataTimeoutHit(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [user, pendingCompany, loading, presetLoading, profileLoading, assessmentsLoading, assessmentsFetched]);



  // ─── Step 2b: Sign-up form submit ─────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingCompany) return;

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signUpErr) throw signUpErr;

      // Token is in localStorage; useProfile.ts will pick it up on profile creation.
      // The autoJoin effect above will handle joining + redirecting once auth state
      // updates AND preset/profile/assessment queries have resolved.
      toast.success(`Account created! Welcome to ${pendingCompany.name}.`);
      setPendingNavigate(true);
    } catch (err: any) {
      setError(err.message ?? 'Sign-up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Google OAuth sign-up ────────────────────────────────────────────────
  async function handleGoogleSignUp() {
    if (!pendingCompany) return;
    if (!fullName.trim()) {
      setError('Please enter your full name before continuing with Google.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required. Please enter it before continuing with Google.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Stash so useProfile can persist them on first profile creation post-OAuth.
      localStorage.setItem('pending_invite_token', pendingCompany.invite_token);
      localStorage.setItem('pending_phone', phone.trim());
      localStorage.setItem('pending_full_name', fullName.trim());

      const { error: oauthErr } = await signInWithGoogle();
      if (oauthErr) throw oauthErr;
      // Popup OAuth: auth state will update in this tab; autoJoin effect handles redirect.
    } catch (err: any) {
      setError(err.message ?? 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }


  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────
  if (error && !pendingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Invalid Invite Link</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // ─── Logged-in or just-signed-up: show joining spinner or join error ────
  if (user || pendingNavigate) {
    if (joinError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">We couldn't finish joining {pendingCompany?.name ?? 'the company'}</h1>
            <p className="text-muted-foreground">{joinError}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setJoinError(null);
                  setHasJoined(false);
                }}
              >
                Try again
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground">Setting things up…</p>
        </div>
      </div>
    );
  }

  const videoUrl = pendingCompany?.join_video_url?.trim() || null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div
        className={
          videoUrl
            ? 'w-full max-w-6xl grid gap-8 md:grid-cols-2 md:items-center'
            : 'w-full max-w-md space-y-6'
        }
      >
        {videoUrl && (
          <div className="space-y-3">
            <VideoPlayer url={videoUrl} title={`Welcome from ${pendingCompany?.name ?? 'your company'}`} />
            <p className="text-center text-xs text-muted-foreground md:text-sm">
              A quick welcome from {pendingCompany?.name}
            </p>
          </div>
        )}

        <div className="w-full max-w-md mx-auto space-y-6">
        {/* Spinning logo */}
        <div className="flex justify-center" style={{ perspective: '1000px' }}>
          <img src={rprxLogo} alt="RPRx Logo" className="w-20 h-20 animate-spin-y" />
        </div>


        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">You've been invited</h1>
          <p className="text-muted-foreground text-sm">
            Create your free account to join <span className="font-semibold text-foreground">{pendingCompany?.name}</span> on RPRx 4 Life.
          </p>
        </div>

        {/* Sign-up form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1">
            <Label>Company</Label>
            <Input value={pendingCompany?.name ?? ''} disabled className="bg-muted cursor-not-allowed" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Jane Smith"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>


          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </p>
          )}

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account &amp; Join
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          onClick={handleGoogleSignUp}
          disabled={submitting}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <a href={`/auth?redirect=/join?token=${token}`} className="underline hover:text-foreground">
            Sign in
          </a>
        </p>
        </div>
      </div>
    </div>
  );
}

