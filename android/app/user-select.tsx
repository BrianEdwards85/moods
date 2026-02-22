import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'urql';
import { useStore } from '@/lib/store';
import { USERS_QUERY } from '@/lib/graphql/queries';
import {
  SEND_LOGIN_CODE_MUTATION,
  VERIFY_LOGIN_CODE_MUTATION,
} from '@/lib/graphql/mutations';
import { gravatarUrl } from '@/lib/utils';
import { colors } from '@/lib/theme';

export default function UserSelectScreen() {
  const router = useRouter();
  const setUsers = useStore((s) => s.setUsers);
  const setAuthToken = useStore((s) => s.setAuthToken);
  const [result, reexecute] = useQuery({ query: USERS_QUERY });

  const [, sendCode] = useMutation(SEND_LOGIN_CODE_MUTATION);
  const [, verifyCode] = useMutation(VERIFY_LOGIN_CODE_MUTATION);

  const [loginUser, setLoginUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = result.data?.users ?? [];

  if (users.length && !result.fetching) {
    setUsers(users);
  }

  const onSelect = async (user: { id: string; name: string; email: string }) => {
    setLoginUser(user);
    setCodeSent(false);
    setCode('');
    setError(null);
    setLoading(true);

    const res = await sendCode({ email: user.email });
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else {
      setCodeSent(true);
    }
  };

  const onVerify = async () => {
    if (!loginUser) return;
    setLoading(true);
    setError(null);

    const res = await verifyCode({ email: loginUser.email, code });
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else if (res.data?.verifyLoginCode) {
      const { token, user } = res.data.verifyLoginCode;
      await setAuthToken(token, user.id);
      router.replace('/(tabs)');
    }
  };

  const closeModal = () => {
    setLoginUser(null);
    setCodeSent(false);
    setCode('');
    setError(null);
  };

  if (result.fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (result.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load users</Text>
        <Text style={styles.errorDetail}>{result.error.message}</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => reexecute({ requestPolicy: 'network-only' })}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Who are you?</Text>
      <View style={styles.cards}>
        {users.map((u: { id: string; name: string; email: string }) => (
          <Pressable key={u.id} style={styles.card} onPress={() => onSelect(u)}>
            <Image source={{ uri: gravatarUrl(u.email, 96) }} style={styles.avatar} />
            <Text style={styles.name}>{u.name}</Text>
            <Text style={styles.email}>{u.email}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={!!loginUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {codeSent ? 'Enter login code' : 'Sending code...'}
            </Text>

            {codeSent && (
              <>
                <Text style={styles.modalSubtext}>
                  A 6-digit code has been sent to {loginUser?.email}.
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
              </>
            )}

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
              {codeSent && (
                <Pressable
                  style={[
                    styles.verifyBtn,
                    (loading || code.length !== 6) && styles.btnDisabled,
                  ]}
                  onPress={onVerify}
                  disabled={loading || code.length !== 6}
                >
                  <Text style={styles.retryText}>Verify</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  content: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 32,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.bgFloat,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: 160,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fg,
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: colors.fgDim,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.red,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    color: colors.fgDim,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2335',
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
  btnDisabled: {
    opacity: 0.5,
  },
});
