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
  users: User[];
  moodModalOpen: boolean;

  setUsers: (users: User[]) => void;
  selectUser: (id: string) => Promise<void>;
  restoreUser: () => Promise<string | null>;
  openMoodModal: () => void;
  closeMoodModal: () => void;
}

const STORAGE_KEY = 'moods_current_user';

export const useStore = create<StoreState>((set) => ({
  currentUserId: null,
  users: [],
  moodModalOpen: false,

  setUsers: (users) => set({ users }),

  selectUser: async (id) => {
    await AsyncStorage.setItem(STORAGE_KEY, id);
    set({ currentUserId: id });
  },

  restoreUser: async () => {
    const id = await AsyncStorage.getItem(STORAGE_KEY);
    if (id) set({ currentUserId: id });
    return id;
  },

  openMoodModal: () => set({ moodModalOpen: true }),
  closeMoodModal: () => set({ moodModalOpen: false }),
}));
