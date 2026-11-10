import { ScrollView, Text, View } from 'react-native';
import { AgentButton, Chip } from '../components/ui';
import { api, API_BASE_URL } from '../services/api';
import { ThemePreference, useWorkflowStore } from '../store/useWorkflowStore';
import { ui } from '../theme/common';
import { useAppScheme } from '../theme/useAppScheme';

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  useAppScheme();
  const { authUser, themePreference, setThemePreference, clearAuth } = useWorkflowStore();

  const logout = async () => {
    await api.logout().catch(() => undefined); // stateless JWT; local sign-out is what matters
    clearAuth();
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.sectionTitle}>Appearance</Text>
      <View style={[ui.card, ui.row]}>
        {THEMES.map((t) => (
          <Chip key={t.id} label={t.label} selected={themePreference === t.id} onPress={() => setThemePreference(t.id)} />
        ))}
      </View>

      <Text style={ui.sectionTitle}>Account</Text>
      <View style={ui.card}>
        <Text style={ui.value}>{authUser?.name || authUser?.email}</Text>
        {authUser?.name ? <Text style={ui.muted}>{authUser.email}</Text> : null}
        <AgentButton title="Sign out" variant="outlined" onPress={logout} style={{ marginTop: 8 }} />
      </View>

      <Text style={ui.sectionTitle}>Server</Text>
      <View style={ui.card}>
        <Text style={ui.mono}>{API_BASE_URL}</Text>
        <Text style={ui.muted}>Stuck-run alerts check this server every minute while the app is open.</Text>
      </View>
    </ScrollView>
  );
}
