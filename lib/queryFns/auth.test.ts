import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateUserPreferences } from '@/lib/queryFns/auth';

vi.mock('axios', () => ({ default: { put: vi.fn() } }));

const units = {
	speed: 'kmh',
	altitude: 'm',
	temperature: 'f',
	pressure: 'inhg',
	fuel: 'usgal',
	distance: 'km',
} as const;

describe('updateUserPreferences', () => {
	beforeEach(() => {
		vi.mocked(axios.put).mockReset();
	});

	it('sends theme, currency and units', async () => {
		const put = vi.mocked(axios.put).mockResolvedValue({ data: { data: { id: 'u1' } } });

		const result = await updateUserPreferences({
			sessionStatus: 'authenticated',
			theme: 'dark',
			currency: 'eur',
			units,
		});

		expect(put).toHaveBeenCalledWith(
			'/api/auth/preferences',
			{ theme: 'dark', currency: 'eur', units },
			expect.anything()
		);
		expect(result).toEqual({ id: 'u1' });
	});

	it.each(['unauthenticated', 'loading'] as const)(
		'returns null without a request when %s',
		async (sessionStatus) => {
			const result = await updateUserPreferences({
				sessionStatus,
				theme: 'dark',
				currency: 'eur',
				units,
			});

			expect(result).toBeNull();
			expect(axios.put).not.toHaveBeenCalled();
		}
	);
});
