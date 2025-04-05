import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the user profile shape (adjust based on your API response)
interface UserProfile {
    id?: number;
    username?: string;
    email?: string;
    role: string; // "admin", "student", "teacher"
    [key: string]: unknown;
}

interface UserState {
    user: UserProfile | null;
    setUser: (user: UserProfile) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null, // Initially no user
            setUser: (user: UserProfile) => set({ user }),
            clearUser: () => set({ user: null }),
        }),
        {
            name: "user-storage",
            partialize: (state) => ({ user: state.user }), // Persist only user object
        }
    )
);
