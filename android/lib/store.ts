import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
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
  selectUser: (id: string) => Promise<void>;
  restoreUser: () => Promise<string | null>;
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

  selectUser: async (id) => {
    await AsyncStorage.setItem(USER_STORAGE_KEY, id);
    set({ currentUserId: id });
  },

  restoreUser: async () => {
    const id = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (id) set({ currentUserId: id });
    return id;
  },

  setAuthToken: async (token, userId) => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, userId);
    set({ authToken: token, currentUserId: userId });
  },

  restoreAuth: async () => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const userId = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (token && userId) {
      set({ authToken: token, currentUserId: userId });
    }
    return token;
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
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
