import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
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
    <View style={styles.container}>
      <Text style={styles.title}>Injustice</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <Input label="Username" value={username} onChangeText={setUsername} error={errors.username} />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

      <Button title={submitting ? 'Signing in...' : 'Sign in'} onPress={handleSubmit} disabled={submitting} />

      <Link href="/register" style={styles.link}>
        <Text style={styles.linkText}>Create an account</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  apiError: {
    color: '#ef4444',
    marginBottom: 12,
  },
  link: {
    marginTop: 16,
    alignSelf: 'center',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
