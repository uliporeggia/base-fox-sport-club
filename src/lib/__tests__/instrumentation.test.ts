/**
 * Tests for the instrumentation module (task 2.4): a valid event reaches the
 * Firebase SDK untouched, a param that looks like an email/name/monetary
 * amount is dropped — by key name AND by value shape, at any depth — and
 * `setAssociate` only ever identifies the user by `associate_id`, never by
 * email. Mocks for `@react-native-firebase/analytics` and
 * `@sentry/react-native` come from `src/test/setup.ts`.
 */
import { logEvent, logScreenView as firebaseLogScreenView, setUserId } from '@react-native-firebase/analytics';
import * as Sentry from '@sentry/react-native';
import { clearAssociate, logScreenView, setAssociate, track } from '../instrumentation';

const mockLogEvent = logEvent as jest.Mock;
const mockSetUserId = setUserId as jest.Mock;
const mockFirebaseLogScreenView = firebaseLogScreenView as jest.Mock;
const mockSetUser = Sentry.setUser as jest.Mock;
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;

/**
 * `track()` is intentionally typed so an invented event or an extra/wrong
 * param key is a *compile* error — which means the runtime sanitizer that
 * backs that type guarantee can only be exercised here by deliberately
 * widening the signature, the same way a bug or a stale type definition
 * could let an unsanitized payload slip past the type checker in practice.
 */
const unsafeTrack = track as unknown as (event: string, params?: Record<string, unknown>) => void;

describe('instrumentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a valid event with its params through to the Firebase SDK', () => {
    track('rsvp_confirmed', { event_id: 'evt-1', modality: 'futevolei', has_vip: true });

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    const [, eventName, params] = mockLogEvent.mock.calls[0];
    expect(eventName).toBe('rsvp_confirmed');
    expect(params).toEqual({ event_id: 'evt-1', modality: 'futevolei', has_vip: true });
  });

  it('sends reserved sign_up/login events through with their method param', () => {
    track('sign_up', { method: 'strava' });
    track('login', { method: 'email' });

    expect(mockLogEvent).toHaveBeenCalledTimes(2);
    expect(mockLogEvent.mock.calls[0][1]).toBe('sign_up');
    expect(mockLogEvent.mock.calls[0][2]).toEqual({ method: 'strava' });
    expect(mockLogEvent.mock.calls[1][1]).toBe('login');
    expect(mockLogEvent.mock.calls[1][2]).toEqual({ method: 'email' });
  });

  it('drops a param by key name alone (email) regardless of its value', () => {
    unsafeTrack('vip_teaser_tapped', { event_id: 'evt-1', email: 'not-even-shaped-like-one' });

    const [, , params] = mockLogEvent.mock.calls[0];
    expect(params).toEqual({ event_id: 'evt-1' });
    expect(params).not.toHaveProperty('email');
  });

  it('drops a param by key name alone (name) regardless of its value', () => {
    unsafeTrack('vip_teaser_tapped', { event_id: 'evt-1', name: 'Joao' });

    const [, , params] = mockLogEvent.mock.calls[0];
    expect(params).toEqual({ event_id: 'evt-1' });
    expect(params).not.toHaveProperty('name');
  });

  it('drops a param whose value looks like an email, even under an allowed key', () => {
    unsafeTrack('vip_teaser_tapped', { event_id: 'evt-1', contact: 'associado@basefox.club' });

    const [, , params] = mockLogEvent.mock.calls[0];
    expect(params).toEqual({ event_id: 'evt-1' });
    expect(params).not.toHaveProperty('contact');
  });

  it('drops a param whose value looks like a monetary amount, even under an allowed key', () => {
    // Arbitrary values chosen only to match the monetary-shape regex (currency
    // marker / two-decimal amount) — never a real or implied membership price
    // (contract rule 2: no monetary value anywhere, not even in a test fixture).
    unsafeTrack('vip_teaser_tapped', { event_id: 'evt-1', note: '$ 7' });
    unsafeTrack('vip_teaser_tapped', { event_id: 'evt-2', note: '0.00' });

    expect(mockLogEvent.mock.calls[0][2]).toEqual({ event_id: 'evt-1' });
    expect(mockLogEvent.mock.calls[1][2]).toEqual({ event_id: 'evt-2' });
  });

  it('drops disallowed params at any depth, inside nested objects and arrays', () => {
    unsafeTrack('vip_teaser_tapped', {
      event_id: 'evt-1',
      meta: {
        ok: 'kept',
        email: 'nested@example.com',
        tags: ['fine', 'foo@bar.com', { nome: 'deep nome' }],
      },
    });

    const [, , params] = mockLogEvent.mock.calls[0];
    expect(params).toEqual({
      event_id: 'evt-1',
      meta: {
        ok: 'kept',
        tags: [
          'fine',
          {}, // "nome" dropped, leaving an empty object
        ],
      },
    });
  });

  it('never throws when a disallowed param is dropped, in dev or prod', () => {
    expect(() => unsafeTrack('vip_teaser_tapped', { event_id: 'evt-1', email: 'x@y.com' })).not.toThrow();
  });

  it('logs a sanitized screen view and a matching Sentry navigation breadcrumb', () => {
    logScreenView('EventDetail', { event_id: 'evt-1' });

    expect(mockFirebaseLogScreenView).toHaveBeenCalledTimes(1);
    expect(mockFirebaseLogScreenView.mock.calls[0][1]).toEqual({
      screen_name: 'EventDetail',
      event_id: 'evt-1',
    });
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'navigation', message: 'EventDetail' }),
    );
  });

  describe('setAssociate / clearAssociate', () => {
    it('identifies the Firebase + Sentry user by associate_id only', () => {
      setAssociate('associate-123');

      expect(mockSetUserId).toHaveBeenCalledWith(expect.anything(), 'associate-123');
      expect(mockSetUser).toHaveBeenCalledWith({ id: 'associate-123' });
    });

    it('never receives or forwards an email in place of associate_id', () => {
      const unsafeSetAssociate = setAssociate as unknown as (value: string) => void;
      unsafeSetAssociate('associate-123');

      const [, idArg] = mockSetUserId.mock.calls[0];
      expect(idArg).not.toMatch(/@/);
      const sentryUser = mockSetUser.mock.calls[0][0];
      expect(sentryUser).not.toHaveProperty('email');
    });

    it('clears identity on logout via clearAssociate (and setAssociate(null))', () => {
      clearAssociate();

      expect(mockSetUserId).toHaveBeenCalledWith(expect.anything(), null);
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });
  });
});
