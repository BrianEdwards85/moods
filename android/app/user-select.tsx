import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 300,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.fgDim,
    marginBottom: 32,
  },
  emailInput: {
    width: '100%',
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    fontSize: 16,
    padding: 14,
    marginBottom: 16,
  },
  sendBtn: {
    width: '100%',
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2335',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bgFloat,
    borderRadius: 12,
    padding: 24,
    width: 300,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 12,
  },
  modalSubtext: {
    fontSize: 14,
    color: colors.fgDim,
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: colors.bgDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    padding: 12,
    letterSpacing: 8,
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 13,
    color: colors.red,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 15,
    color: colors.fgDim,
  },
  verifyBtn: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  verifyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2335',
  },
});
