import { create } from 'zustand';

interface LoadingStore {
	isGlobalLoading: boolean;
	setIsGlobalLoading: (value: boolean) => void;
}

const useLoadingStore = create<LoadingStore>()((set) => ({
	isGlobalLoading: false,
	setIsGlobalLoading: (value) => set({ isGlobalLoading: value }),
}));

export default useLoadingStore;
