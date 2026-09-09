import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getAuthPageDestination } from '@/lib/authRedirect';

const AuthCallback = () => {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    const claimPending = async () => {
      try {
        const { data } = await (supabase.rpc as any)('claim_pending_ghl_subscription');
        if (data?.claimed) {
          console.log('Claimed pending GHL subscription', data);
        }
      } catch (e) {
        console.warn('claim_pending_ghl_subscription failed', e);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (handled.current) return;
        if (event === 'SIGNED_IN' && session) {
          handled.current = true;
          // Always try to claim any pending GHL purchase tied to this email
          claimPending().finally(() => {
            // Signal parent window (popup flow)
            localStorage.setItem('oauth-complete', Date.now().toString());
            if (window.opener) {
              window.opener.postMessage(
                { type: 'oauth-complete' },
                window.location.origin
              );
              window.close();
            } else {
              navigate(getAuthPageDestination('/'), { replace: true });
            }
          });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
};

export default AuthCallback;
