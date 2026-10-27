// `gate.ts` imports `@react-native-async-storage/async-storage` for the
// last-known-value cache (task 3.1); the project's global jest setup
// (src/test/setup.ts, not owned by this agent) doesn't mock it, so the
// package's own official mock is used here.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import EntryStack from '../../../navigation/EntryStack';
import { useMemberAccess } from '../gate';

/**
 * Task 3.10 — proves tela 03 ("Torne-se membro") is REMOVED from the entry
 * route graph when membership is disabled, not just hidden (spec.md
 * "Nenhuma tela órfã com a flag desligada"). `EntryStack.tsx` doesn't own a
 * `NavigationContainer` itself, so it can be wrapped here with our own ref
 * and inspected via the public `getState().routeNames` API — no need to
 * reimplement or edit EntryStack.tsx (task 3.3 is to verify, not rebuild,
 * the foundation's wiring).
 */

jest.mock('../gate', () => ({
  ...jest.requireActual('../gate'),
  useMemberAccess: jest.fn(),
}));

const mockedUseMemberAccess = useMemberAccess as jest.MockedFunction<typeof useMemberAccess>;

function mockAccess(membershipEnabled: boolean): void {
  mockedUseMemberAccess.mockReturnValue({
    membershipEnabled,
    hasMemberAccess: !membershipEnabled,
    isLoading: false,
  });
}

describe('EntryStack — tela 03 "Torne-se membro"', () => {
  it('is absent from the entry route graph when membership is disabled', async () => {
    mockAccess(false);
    const ref = createNavigationContainerRef();
    await render(
      <NavigationContainer ref={ref}>
        <EntryStack />
      </NavigationContainer>,
    );
    await waitFor(() => expect(ref.current?.isReady()).toBe(true));

    expect(ref.current?.getRootState()?.routeNames).not.toContain('BecomeMember');
  });

  it('is present in the entry route graph when membership is enabled', async () => {
    mockAccess(true);
    const ref = createNavigationContainerRef();
    await render(
      <NavigationContainer ref={ref}>
        <EntryStack />
      </NavigationContainer>,
    );
    await waitFor(() => expect(ref.current?.isReady()).toBe(true));

    expect(ref.current?.getRootState()?.routeNames).toContain('BecomeMember');
  });
});
