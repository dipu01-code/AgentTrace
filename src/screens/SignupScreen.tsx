import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useAppScheme } from '../theme/useAppScheme';
import { MD3_COLORS, themed } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import SafeAreaView from '../components/SafeAreaView';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SignupScreen() {
  useAppScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useWorkflowStore();
  const navigation = useNavigation<NavProp>();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.register(email, password, name || undefined);
      setAuth(result.access_token, {
        id: result.user_id,
        email: result.email,
        name: result.name,
        created_at: result.created_at,
      });
      // Navigator re-renders via Zustand isAuthenticated state change
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={MD3_COLORS.onSurface} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join AgentTrace</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          testID="signup-name"
          placeholderTextColor={MD3_COLORS.textSubtle}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          testID="signup-email"
          placeholderTextColor={MD3_COLORS.textSubtle}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          testID="signup-password"
          placeholderTextColor={MD3_COLORS.textSubtle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSignup} testID="signup-submit">
          <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create account'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>Or</Text>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: MD3_COLORS.background },
  centerContainer: {
    flex: 1,
    backgroundColor: MD3_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: MD3_COLORS.surfaceContainerLow,
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontSize: 26, fontWeight: '800', color: MD3_COLORS.onSurface, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, color: MD3_COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
  input: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
    fontSize: 15,
    color: MD3_COLORS.onSurface,
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: MD3_COLORS.dangerContainer,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 10,
    marginBottom: 12,
    borderRadius: 0,
  },
  errorText: { fontSize: 13, color: '#dc2626' },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerText: { fontSize: 12, color: MD3_COLORS.textSubtle, marginHorizontal: 8 },
  linkButton: { alignItems: 'center', marginBottom: 12 },
  linkText: { fontSize: 15, color: '#3b82f6', fontWeight: '600' },
}));
