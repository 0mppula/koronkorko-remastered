import { DEFAULT_UNIT_PREFERENCES, UnitPreferences, withDefaultUnitPreferences } from '@/lib/units';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UnitsStore {
	units: UnitPreferences;
	setUnits: (units: UnitPreferences) => void;
}

const useUnitsStore = create<UnitsStore>()(
	persist(
		(set) => ({
			units: DEFAULT_UNIT_PREFERENCES,
			setUnits: (units) => set({ units }),
		}),
		{
			name: 'units',
			storage: createJSONStorage(() => localStorage),
			// Stored units may predate quantities added later (pressure, fuel).
			merge: (persisted, current) => ({
				...current,
				units: withDefaultUnitPreferences((persisted as Partial<UnitsStore> | null)?.units),
			}),
		}
	)
);

export default useUnitsStore;
