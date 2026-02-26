import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  name: string;
  email: string;
  icon: string;
  settings?: Record<string, unknown>;
}

export interface Tag {
  name: string;
  metadata?: { color?: string; face?: string };
  archivedAt?: string | null;
}

export interface MoodEntry {
  id: string;
  mood: number;
  delta: number | null;
  notes?: string;
  createdAt: string;
  archivedAt?: string | null;
  user?: { id: string; name?: string };
  tags: Tag[];
}

interface StoreState {
  currentUserId: string | null;
  authToken: string | null;
  loginEmail: string | null;
  users: User[];
  moodModalOpen: boolean;

  setUsers: (users: User[]) => void;
  setAuthToken: (token: string, userId: string) => Promise<void>;
  restoreAuth: () => Promise<string | null>;
  clearAuth: () => Promise<void>;
  setLoginEmail: (email: string) => Promise<void>;
  restoreLoginEmail: () => Promise<string | null>;
  openMoodModal: () => void;
  closeMoodModal: () => void;
}

const USER_STORAGE_KEY = 'moods_current_user';
const TOKEN_STORAGE_KEY = 'moods_auth_token';
const EMAIL_STORAGE_KEY = 'moods_email';

export const useStore = create<StoreState>((set) => ({
  currentUserId: null,
  authToken: null,
  loginEmail: null,
  users: [],
  moodModalOpen: false,

  setUsers: (users) => set({ users }),

  setAuthToken: async (token, userId) => {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, userId);
    set({ authToken: token, currentUserId: userId });
  },

  restoreAuth: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    const userId = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (token && userId) {
      set({ authToken: token, currentUserId: userId });
    }
    return token;
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    set({ authToken: null, currentUserId: null });
  },

  setLoginEmail: async (email) => {
    await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email);
    set({ loginEmail: email });
  },

  restoreLoginEmail: async () => {
    const email = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
    if (email) set({ loginEmail: email });
    return email;
  },

  openMoodModal: () => set({ moodModalOpen: true }),
  closeMoodModal: () => set({ moodModalOpen: false }),
}));
