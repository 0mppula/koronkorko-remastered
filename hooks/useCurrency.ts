import { currencies } from '@/constants/data';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CurrencyStore {
	currency: (typeof currencies)[number]['value'];
	setCurrency: (currency: (typeof currencies)[number]['value']) => void;
}

const useCurrencyStore = create<CurrencyStore>()(
	persist(
		(set) => ({
			currency: currencies[0].value,
			setCurrency: (currency) => set({ currency }),
		}),
		{
			name: 'currency',
			storage: createJSONStorage(() => localStorage),
		}
	)
);

export default useCurrencyStore;
