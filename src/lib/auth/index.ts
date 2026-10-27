/**
 * Public auth API — session helpers shared by the entry screens (and, for
 * `useEmailVerificationStatus`, the Perfil feature in a later wave — see
 * API_EMAIL_PENDENTE in this agent's final report).
 *
 * Three entry paths into a session (design.md "Autenticação: três caminhos"):
 *   - e-mail + senha: `signUpWithEmail` / `logInWithEmail`
 *   - Strava OAuth: `src/lib/strava` (separate module, not re-exported here)
 *   - link por e-mail: `sendLoginLink` + `useEmailLinkSignIn`
 */
export { signUpWithEmail, logInWithEmail } from './emailPassword';
export type { SignUpWithEmailInput, LogInWithEmailInput } from './emailPassword';

export { sendLoginLink, completeEmailLinkSignIn } from './emailLink';
export { useEmailLinkSignIn } from './useEmailLinkSignIn';
export type { EmailLinkSignInState } from './useEmailLinkSignIn';

export { useEmailVerificationStatus } from './emailVerification';
export type { EmailVerificationStatus } from './emailVerification';

export { setPasswordForCurrentUser, currentUserHasPassword } from './setPassword';

export { signOutCurrentUser } from './logout';

export type {
  SignUpResult,
  LogInResult,
  SendLoginLinkResult,
  EmailLinkCompletionResult,
  SetPasswordResult,
} from './types';
