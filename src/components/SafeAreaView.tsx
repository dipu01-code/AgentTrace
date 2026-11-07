import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

/**
 * SafeAreaView wrapper using react-native-safe-area-context.
 * React Native's built-in SafeAreaView is deprecated; this uses the
 * actively-maintained package instead.
 */
type SafeAreaViewProps = React.ComponentProps<typeof RNSSafeAreaView>;

export function SafeAreaView(props: SafeAreaViewProps) {
  return <RNSSafeAreaView {...props} />;
}

export default SafeAreaView;
