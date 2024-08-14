import { create } from 'zustand';

interface usePremiumModal {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
}

const usePremiumModal = create<usePremiumModal>()((set) => ({
	isOpen: false,
	setIsOpen: (value) => set({ isOpen: value }),
}));

export default usePremiumModal;
