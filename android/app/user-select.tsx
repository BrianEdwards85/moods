import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'urql';
import { useStore } from '@/lib/store';
import {
  SEND_LOGIN_CODE_MUTATION,
  VERIFY_LOGIN_CODE_MUTATION,
} from '@/lib/graphql/mutations';
import { colors } from '@/lib/theme';
import { styles } from './user-select.styles';

export default function UserSelectScreen() {
  const router = useRouter();
  const setAuthToken = useStore((s) => s.setAuthToken);
  const loginEmail = useStore((s) => s.loginEmail);
  const setLoginEmail = useStore((s) => s.setLoginEmail);
  const restoreLoginEmail = useStore((s) => s.restoreLoginEmail);

  const [, sendCode] = useMutation(SEND_LOGIN_CODE_MUTATION);
  const [, verifyCode] = useMutation(VERIFY_LOGIN_CODE_MUTATION);

  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreLoginEmail().then((saved) => {
      if (saved) setEmail(saved);
    });
  }, []);

  const onSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setCodeSent(false);
    setCode('');
    setError(null);
    setLoading(true);

    const res = await sendCode({ email: trimmed });
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else {
      setCodeSent(true);
    }
  };

  const onVerify = async () => {
    setLoading(true);
    setError(null);

    const res = await verifyCode({ email: email.trim(), code });
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else if (res.data?.verifyLoginCode) {
      const { token, user } = res.data.verifyLoginCode;
      await setLoginEmail(email.trim());
      await setAuthToken(token, user.id);
      router.replace('/(tabs)');
    }
  };

  const closeModal = () => {
    setCodeSent(false);
    setCode('');
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Moods</Text>
        <Text style={styles.subtitle}>Sign in with your email</Text>

        <TextInput
          style={styles.emailInput}
          placeholder="you@example.com"
          placeholderTextColor={colors.fgDim}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={!loginEmail}
        />

        <Pressable
          style={[styles.sendBtn, (!email.trim() || loading) && styles.btnDisabled]}
          onPress={onSendCode}
          disabled={!email.trim() || loading}
        >
          {loading && !codeSent ? (
            <ActivityIndicator size="small" color="#1f2335" />
          ) : (
            <Text style={styles.sendBtnText}>Send Code</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={codeSent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter login code</Text>
            <Text style={styles.modalSubtext}>
              A 6-digit code has been sent to {email.trim()}.
            </Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.fgDim}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {error && <Text style={styles.errorMsg}>{error}</Text>}

            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.blue}
                style={{ marginVertical: 12 }}
              />
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.verifyBtn,
                  (loading || code.length !== 6) && styles.btnDisabled,
                ]}
                onPress={onVerify}
                disabled={loading || code.length !== 6}
              >
                <Text style={styles.verifyBtnText}>Verify</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}