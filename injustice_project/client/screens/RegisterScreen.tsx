import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing } from '../shared/theme';
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
    <AuthLayout
      title="Join Injustice"
      subtitle="One account for web and mobile. Sign up here and your profile syncs everywhere."
    >
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            placeholder="Alex"
          />
        </View>
        <View style={styles.half}>
          <Input
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            placeholder="Kim"
          />
        </View>
      </View>

      <Input label="Username" value={username} onChangeText={setUsername} error={errors.username} placeholder="alex_k" />
      <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} placeholder="you@email.com" />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
        placeholder="At least 8 characters"
      />

      {apiError ? (
        <View style={styles.errorBox}>
          <Text style={styles.apiError}>{apiError}</Text>
        </View>
      ) : null}

      <Button title="Create account" onPress={handleSubmit} disabled={submitting} loading={submitting} />

      <Link href="/login" asChild>
        <Pressable style={styles.footerLink}>
          <Text style={styles.footerText}>Already have an account? Sign in</Text>
        </Pressable>
      </Link>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
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
