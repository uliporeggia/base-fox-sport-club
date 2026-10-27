// `gate.ts` imports `@react-native-async-storage/async-storage` for the
// last-known-value cache (task 3.1); the project's global jest setup
// (src/test/setup.ts, not owned by this agent) doesn't mock it, so the
// package's own official mock is used here.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import React from 'react';
import { render } from '@testing-library/react-native';
import type { NavigationProp } from '@react-navigation/native';
import RootNavigator from '../../../navigation/RootNavigator';
import { useMemberAccess } from '../gate';
import type { RootStackParamList } from '../../../navigation/types';

/**
 * Task 3.10 — proves telas 12 ("Assinatura contextual") e 13 ("Assinatura
 * confirmada") are REMOVED from the root route graph when membership is
 * disabled, not just hidden (spec.md "Nenhuma tela órfã com a flag
 * desligada"). RootNavigator.tsx owns its own `NavigationContainer` + ref
 * internally, so there is no public prop to inject an external ref into it.
 * Instead, the "Entry" screen slot is replaced (mocked) with a probe that
 * reads the ROOT navigator's own state straight from the `navigation` prop
 * React Navigation hands to every registered screen — the same object
 * RootNavigator itself registers "Paywall"/"SubscriptionConfirmed" on, so
 * its `routeNames` is exactly the root route graph under test. This proves
 * the wiring without reimplementing RootNavigator.tsx (task 3.3 is to
 * verify, not rebuild, the foundation's work).
 */

jest.mock('../gate', () => ({
  ...jest.requireActual('../gate'),
  useMemberAccess: jest.fn(),
}));

jest.mock('../../../navigation/EntryStack', () => {
  const ReactActual = jest.requireActual('react');
  const { Text: TextActual } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: function EntryStackProbe({ navigation }: { navigation: NavigationProp<RootStackParamList> }) {
      const routeNames = navigation.getState()?.routeNames ?? [];
      return ReactActual.createElement(TextActual, { testID: 'root-route-names' }, routeNames.join(','));
    },
  };
});

const mockedUseMemberAccess = useMemberAccess as jest.MockedFunction<typeof useMemberAccess>;

function mockAccess(membershipEnabled: boolean): void {
  mockedUseMemberAccess.mockReturnValue({
    membershipEnabled,
    hasMemberAccess: !membershipEnabled,
    isLoading: false,
  });
}

describe('RootNavigator — telas 12 "Assinatura contextual" e 13 "Assinatura confirmada"', () => {
  it('omits Paywall and SubscriptionConfirmed from the root route graph when membership is disabled', async () => {
    mockAccess(false);
    const { findByTestId } = await render(<RootNavigator />);
    const probe = await findByTestId('root-route-names');
    const routeNames = (probe.props.children as string).split(',');

    expect(routeNames).not.toContain('Paywall');
    expect(routeNames).not.toContain('SubscriptionConfirmed');
  });

  it('includes Paywall and SubscriptionConfirmed in the root route graph when membership is enabled', async () => {
    mockAccess(true);
    const { findByTestId } = await render(<RootNavigator />);
    const probe = await findByTestId('root-route-names');
    const routeNames = (probe.props.children as string).split(',');

    expect(routeNames).toEqual(expect.arrayContaining(['Paywall', 'SubscriptionConfirmed']));
  });
});
