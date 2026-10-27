/**
 * Smoke test for the foundation wave's test seam itself (jest.config.js +
 * src/test/setup.ts). Nobody downstream can fix this file if the mocks are
 * wrong — this is what proves, once, that they aren't: the Firestore mock
 * resolves through a real repository call, and a full screen renders
 * through the RN/babel/transform chain without throwing.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { getAppConfig } from '../data/configRepository';
import HomeScreen from '../screens/HomeScreen';

describe('foundation test seam', () => {
  it('resolves configRepository.getAppConfig() to the greenfield default', async () => {
    const config = await getAppConfig();
    expect(config).toEqual({
      membershipEnabled: false,
      strava: { client_id: '' },
    });
  });

  it('renders HomeScreen (and its 4 feature stubs) without throwing', () => {
    // NotificationsBell (one of the 4 feature components) calls
    // useNavigation(), which throws outside of a NavigationContainer — wrap
    // the render the same way RootNavigator does in the real app, instead
    // of mocking @react-navigation/native, so this still exercises the real
    // NotificationsBell render tree end to end.
    expect(() =>
      render(
        <NavigationContainer>
          <HomeScreen />
        </NavigationContainer>,
      ),
    ).not.toThrow();
  });
});
