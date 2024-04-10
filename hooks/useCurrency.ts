import { currencies } from '@/constants';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CurrencyStore {
	currency: (typeof currencies)[number];
	setCurrency: (currency: (typeof currencies)[number]) => void;
}

const useCurrencyStore = create<CurrencyStore>()(
	persist(
		(set) => ({
			currency: currencies[0],
			setCurrency: (currency) => set({ currency }),
		}),
		{
			name: 'currency',
			storage: createJSONStorage(() => localStorage),
		}
	)
);

export default useCurrencyStore;
