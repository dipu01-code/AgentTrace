import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = { id: string; email: string; name?: string; created_at: string };
export type ThemePreference = 'system' | 'light' | 'dark';

type WorkflowStore = {
  hydrated: boolean;
  authToken: string | null;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  themePreference: ThemePreference;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  setThemePreference: (pref: ThemePreference) => void;
};

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set) => ({
      hydrated: false,
      authToken: null,
      authUser: null,
      isAuthenticated: false,
      themePreference: 'system',
      setAuth: (authToken, authUser) => set({ authToken, authUser, isAuthenticated: true }),
      clearAuth: () => set({ authToken: null, authUser: null, isAuthenticated: false }),
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    {
      name: 'agenttrace-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ authToken, authUser, isAuthenticated, themePreference }) => ({
        authToken,
        authUser,
        isAuthenticated,
        themePreference,
      }),
      onRehydrateStorage: () => () => useWorkflowStore.setState({ hydrated: true }),
    }
  )
);
