import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { completeEmailLinkSignIn } from './emailLink';
import type { EmailLinkCompletionResult } from './types';

export interface EmailLinkSignInState {
  /** `null` until a sign-in link deep link has actually been opened. */
  result: EmailLinkCompletionResult | null;
  /** Retries completion with an e-mail supplied by the visitor, for the `needs_email` case (link opened on a different device). */
  retryWithEmail: (email: string) => Promise<void>;
  /** Clears `result` so the UI can dismiss the banner/message. */
  reset: () => void;
}

/**
 * Task 4.5a — watches for the login-by-link deep link (`expo-linking`) and
 * completes the sign-in automatically when it opens the app. Intended for
 * `LoginScreen` (4.5): render `result` to show feedback and call
 * `retryWithEmail` if `result.status === 'needs_email'`.
 */
export function useEmailLinkSignIn(): EmailLinkSignInState {
  const url = Linking.useLinkingURL();
  const [result, setResult] = useState<EmailLinkCompletionResult | null>(null);
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || url === handledUrlRef.current) return;
    handledUrlRef.current = url;
    completeEmailLinkSignIn(url).then(setResult);
  }, [url]);

  const retryWithEmail = async (email: string) => {
    if (!handledUrlRef.current) return;
    const outcome = await completeEmailLinkSignIn(handledUrlRef.current, email);
    setResult(outcome);
  };

  const reset = () => setResult(null);

  return { result, retryWithEmail, reset };
}
