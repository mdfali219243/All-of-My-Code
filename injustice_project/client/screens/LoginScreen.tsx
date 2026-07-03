import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing } from '../shared/theme';
import { validateLogin } from '../shared/validation';

export function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const validation = validateLogin({ username, password });
    setErrors(validation.errors);
    setApiError('');
    if (!validation.valid) return;

    setSubmitting(true);
    try {
      await login({ username, password });
      router.replace('/(app)');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up debates, posts, and messages right where you left off.">
      <Input
        label="Username"
        value={username}
        onChangeText={setUsername}
        error={errors.username}
        placeholder="your_username"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
        placeholder="••••••••"
      />

      {apiError ? (
        <View style={styles.errorBox}>
          <Text style={styles.apiError}>{apiError}</Text>
        </View>
      ) : null}

      <Button
        title="Sign in"
        onPress={handleSubmit}
        disabled={submitting}
        loading={submitting}
      />

      <Link href="/register" asChild>
        <Pressable style={styles.footerLink}>
          <Text style={styles.footerText}>Create an account</Text>
        </Pressable>
      </Link>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  apiError: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  footerLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.brandLight,
    fontWeight: '600',
    fontSize: 15,
  },
});
