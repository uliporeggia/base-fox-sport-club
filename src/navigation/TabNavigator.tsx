import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import EventsStack from './EventsStack';
import VipStack from './VipStack';
import BenefitsStack from './BenefitsStack';
import ProfileStack from './ProfileStack';
import { BFTabBar } from './BFTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** 5-tab app shell — see design/BFTabBar.dc.html for the elevated center tab. */
export default function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BFTabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="EventsTab" component={EventsStack} />
      <Tab.Screen name="VipTab" component={VipStack} />
      <Tab.Screen name="BenefitsTab" component={BenefitsStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}
