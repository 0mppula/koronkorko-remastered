import { create } from 'zustand';

interface AuthLoadingStore {
	isLoadingUserPreferences: boolean;
	setIsLoadingUserPreferences: (value: boolean) => void;
}

const useAuthLoadingStore = create<AuthLoadingStore>()((set) => ({
	isLoadingUserPreferences: false,
	setIsLoadingUserPreferences: (value) => set({ isLoadingUserPreferences: value }),
}));

export default useAuthLoadingStore;
