import { onSnapshot } from '@react-native-firebase/firestore';
import { subscribeAppConfig } from '../configRepository';

/**
 * Covers the membership-flag leak fixed in `subscribeAppConfig`: a listener
 * error is indistinguishable from "the config document doesn't exist", so
 * it must NOT be treated the same way `!snapshot.exists()` is. With
 * `membershipEnabled` on, emitting the default (`membershipEnabled: false`)
 * on a transient listener error would grant member access to every
 * free-plan associate for the rest of the session (gate.ts's
 * `computeMemberAccess` only ever sees what `onChange` reports).
 */

const mockedOnSnapshot = onSnapshot as jest.Mock;

beforeEach(() => {
  mockedOnSnapshot.mockReset();
});

describe('configRepository.subscribeAppConfig', () => {
  it('does not invoke onChange when the listener errors out', () => {
    mockedOnSnapshot.mockImplementation((_docRef, _onNext, onError: (error: unknown) => void) => {
      onError(new Error('transient network error'));
      return jest.fn();
    });

    const onChange = jest.fn();
    subscribeAppConfig(onChange);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the greenfield default when the document genuinely does not exist', () => {
    mockedOnSnapshot.mockImplementation((_docRef, onNext: (snapshot: unknown) => void) => {
      onNext({ exists: () => false });
      return jest.fn();
    });

    const onChange = jest.fn();
    subscribeAppConfig(onChange);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      membershipEnabled: false,
      strava: { client_id: '' },
    });
  });

  it('still forwards real document updates, including a later error leaving the last value in place', () => {
    let errorCallback: ((error: unknown) => void) | undefined;
    mockedOnSnapshot.mockImplementation(
      (_docRef, onNext: (snapshot: unknown) => void, onError: (error: unknown) => void) => {
        errorCallback = onError;
        onNext({
          exists: () => true,
          data: () => ({ membershipEnabled: true, strava: { client_id: 'abc123' } }),
        });
        return jest.fn();
      },
    );

    const onChange = jest.fn();
    subscribeAppConfig(onChange);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({
      membershipEnabled: true,
      strava: { client_id: 'abc123' },
    });

    // A subsequent listener error must not walk that back to the default.
    errorCallback?.(new Error('transient network error'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
