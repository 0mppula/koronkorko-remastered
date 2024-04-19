import { markupCalculatorSchema } from '@/schemas';
import { MarkupCalculation } from '@prisma/client';
import axios from 'axios';
import { z } from 'zod';

const API_URL = '/api/markup-calculations';

export interface ISaveCalculationParam {
	name: string;
	data: z.infer<typeof markupCalculatorSchema>;
}

export interface IUpdateCalculationParam {
	name?: string;
	data?: z.infer<typeof markupCalculatorSchema>;
}

export const saveCalculation = async (variables: ISaveCalculationParam) => {
	const response = await axios.post(`${API_URL}`, {
		name: variables.name,
		formData: variables.data,
	});

	const data = await response.data;

	return data;
};

export const getCalculations = async () => {
	const response = await axios.get(`${API_URL}`);

	const data = await response.data;

	return data;
};

export const deleteCalculation = async (id: string) => {
	const response = await axios.delete(`${API_URL}/${id}`);

	const data = await response.data;

	return data;
};

export const updateCalculation = async (updatedCalculation: MarkupCalculation) => {
	const response = await axios.put(`${API_URL}/${updatedCalculation.id}`, updatedCalculation);

	const data = await response.data;

	return data;
};
