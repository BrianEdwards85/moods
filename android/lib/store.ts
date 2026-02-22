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
  users: User[];
  moodModalOpen: boolean;

  setUsers: (users: User[]) => void;
  selectUser: (id: string) => Promise<void>;
  restoreUser: () => Promise<string | null>;
  setAuthToken: (token: string, userId: string) => Promise<void>;
  restoreAuth: () => Promise<string | null>;
  clearAuth: () => Promise<void>;
  openMoodModal: () => void;
  closeMoodModal: () => void;
}

const USER_STORAGE_KEY = 'moods_current_user';
const TOKEN_STORAGE_KEY = 'moods_auth_token';

export const useStore = create<StoreState>((set) => ({
  currentUserId: null,
  authToken: null,
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

  openMoodModal: () => set({ moodModalOpen: true }),
  closeMoodModal: () => set({ moodModalOpen: false }),
}));
