import { create } from 'zustand';

interface useLoginModal {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
}

const useLoginModal = create<useLoginModal>()((set) => ({
	isOpen: false,
	setIsOpen: (value) => set({ isOpen: value }),
}));

export default useLoginModal;
