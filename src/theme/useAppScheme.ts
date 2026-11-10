import { useColorScheme } from 'react-native';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { ColorScheme, setActiveScheme } from './colors';

/** Subscribe a component to theme changes and return the active scheme. */
export function useAppScheme(): ColorScheme {
  const system = useColorScheme();
  const pref = useWorkflowStore((s) => s.themePreference);
  const scheme: ColorScheme = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  setActiveScheme(scheme);
  return scheme;
}
