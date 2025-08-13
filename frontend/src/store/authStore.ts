/**
 * Store de autenticación usando Zustand
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: 'guest' | 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  exploration_count: number;
}

export interface LoginData {
  email_or_username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;
  isInitializing: boolean;
}

export interface AuthActions {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  forceLogout: () => void;
  setGuest: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

const API_BASE_URL = 'http://localhost:8001/api/auth';

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - Always start unauthenticated
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isGuest: false,
        isInitializing: true,

        // Actions
        login: async (data: LoginData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`${API_BASE_URL}/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || 'Login failed');
            }

            const result = await response.json();
            
            set({
              user: result.user,
              token: result.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isGuest: false,
            });

          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        },

        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`${API_BASE_URL}/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...data,
                role: 'user', // Always register as regular user
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || 'Registration failed');
            }

            // After successful registration, automatically login
            await get().login({
              email_or_username: data.email,
              password: data.password,
            });

          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        },

        logout: () => {
          // Clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isGuest: false,
          });
          
          toast.success('Sesión cerrada exitosamente');
          
          // Redirect to login page
          window.location.href = '/login';
        },

        forceLogout: () => {
          // Clear auth state and localStorage completely
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isGuest: false,
          });
          
          // Clear localStorage manually
          localStorage.removeItem('auth-storage');
          
          toast.success('Estado de autenticación limpiado');
          
          // Redirect to login page
          window.location.href = '/login';
        },

        setGuest: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isGuest: true,
          });
        },

        clearError: () => {
          set({ error: null });
        },

        // Refresh user data
        refreshUser: async () => {
          const { token, logout } = get();
          
          if (!token) {
            return;
          }

          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              logout();
              return;
            }

            const userData = await response.json();
            set({ user: userData, isAuthenticated: true }, false, 'refreshUser');
          } catch (error) {
            console.error('Error refreshing user:', error);
            logout();
          }
        },

        // Initialize auth state - check if persisted token is still valid
        initializeAuth: async () => {
          set({ isInitializing: true });
          
          const { token } = get();
          
          if (token) {
            // If we have a token, validate it
            await get().refreshUser();
          } else {
            // Ensure we start clean
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isGuest: false,
              error: null
            });
          }
          
          set({ isInitializing: false });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          // NO persisitir isAuthenticated e isGuest para forzar login en cada sesión
          // isAuthenticated: state.isAuthenticated,
          // isGuest: state.isGuest,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Hook for authentication header
export const useAuthHeader = () => {
  const token = useAuthStore((state) => state.token);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user, isAuthenticated, isGuest } = useAuthStore();
  
  return {
    canSave: isAuthenticated && !isGuest,
    canAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isAuthenticated,
    isGuest,
  };
};
