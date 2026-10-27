import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../screens/OnboardingScreen';
import type { EntryStackParamList } from '../../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<EntryStackParamList, 'Onboarding'>;

function makeNavigation(): Props['navigation'] {
  return {
    replace: jest.fn(),
    navigate: jest.fn(),
  } as unknown as Props['navigation'];
}

describe('OnboardingScreen — task 4.2, onboarding não reexibido', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows step 1 content on a first-ever visit', async () => {
    const navigation = makeNavigation();
    const { findByText } = await render(
      <OnboardingScreen navigation={navigation} route={{ key: 'Onboarding', name: 'Onboarding' } as Props['route']} />,
    );

    expect(await findByText('O clube que vai até você')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('redirects straight to SignUp without showing any step when onboarding was already seen', async () => {
    await AsyncStorage.setItem('entry.onboarding_seen', 'true');
    const navigation = makeNavigation();

    const { queryByText } = await render(
      <OnboardingScreen navigation={navigation} route={{ key: 'Onboarding', name: 'Onboarding' } as Props['route']} />,
    );

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('SignUp'));
    expect(queryByText('O clube que vai até você')).toBeNull();
  });
});
