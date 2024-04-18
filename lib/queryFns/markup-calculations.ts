import { markupCalculatorSchema } from '@/schemas';
import axios from 'axios';
import { z } from 'zod';

const API_URL = '/api/markup-calculations';

export interface ISaveCalculationParam {
	name: string;
	data: z.infer<typeof markupCalculatorSchema>;
}

export const saveCalculation = async (variables: ISaveCalculationParam) => {
	const response = await axios.post(`${API_URL}`, {
		name: variables.name,
		formData: variables.data,
	});

	const data = await response.data;

	return data;
};
