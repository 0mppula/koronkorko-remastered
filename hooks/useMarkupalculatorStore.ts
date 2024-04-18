import { MarkupCalculation } from '@prisma/client';
import { create } from 'zustand';

interface MarkupalculatorStore {
	activeCalculation: MarkupCalculation | null;
	setActiveCalculation: (value: MarkupCalculation | null) => void;
}

const useMarkupalculatorStore = create<MarkupalculatorStore>((set) => ({
	activeCalculation: null,
	setActiveCalculation: (value) => set({ activeCalculation: value }),
}));

export default useMarkupalculatorStore;
