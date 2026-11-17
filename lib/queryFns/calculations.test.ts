import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { renameCalculation } from '@/lib/queryFns/calculations';

vi.mock('axios', () => ({ default: { put: vi.fn() } }));
vi.mock('next-auth/react', () => ({ getSession: vi.fn() }));

describe('renameCalculation', () => {
	it('sends only the name, even if the stored form data is invalid', async () => {
		const put = vi.mocked(axios.put).mockResolvedValue({ data: {} });

		await renameCalculation({
			apiUrl: '/api/dollar-cost-average-calculations',
			updatedCalculation: {
				id: 'abc123',
				name: 'Renamed plan',
				formData: { depositFrequency: 0 },
			},
		});

		expect(put).toHaveBeenCalledWith('/api/dollar-cost-average-calculations/abc123', {
			name: 'Renamed plan',
		});
	});
});
