import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { validateRegister } from '../shared/validation';

export function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const validation = validateRegister({ username, email, password, first_name: firstName, last_name: lastName });
    setErrors(validation.errors);
    setApiError('');
    if (!validation.valid) return;

    setSubmitting(true);
    try {
      await register({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      router.replace('/(app)');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Sign up on web or mobile — same Django account</Text>

      <Input label="Username" value={username} onChangeText={setUsername} error={errors.username} />
      <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />
      <Input
        label="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <Input
        label="Last name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />

      {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

      <Button
        title={submitting ? 'Creating account...' : 'Sign up'}
        onPress={handleSubmit}
        disabled={submitting}
      />

      <Link href="/login" style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
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
