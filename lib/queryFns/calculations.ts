import { API_URLS } from '@/constants/api';
import { FREE_PLAN_CALCULATION_LIMIT } from '@/constants/data';
import { IHasFormData, IHasId } from '@/types/calculations';
import axios from 'axios';
import { getSession } from 'next-auth/react';

export interface ISaveCalculationParam<TFormData> {
	apiUrl: (typeof API_URLS)[number];
	name: string;
	formData: TFormData;
}

export interface IDeleteCalculationParam {
	apiUrl: (typeof API_URLS)[number];
	id: string;
}

export interface IRenameCalculationParam<TCalculation extends IHasId> {
	apiUrl: (typeof API_URLS)[number];
	updatedCalculation: TCalculation;
}

export interface IUpdateCalculationParam<TFormData, TCalculation extends IHasFormData<TFormData>> {
	apiUrl: (typeof API_URLS)[number];
	updatedCalculation: TCalculation;
}

export const checkCalculationLimit = async (
	apiUrl: (typeof API_URLS)[number],
	limit = FREE_PLAN_CALCULATION_LIMIT
) => {
	const session = await getSession();

	if (session?.user.plan === 'free') {
		const calcCount = ((await getCalculations(apiUrl)) || []).length;

		if (calcCount >= limit) {
			throw new Error(
				'You have reached the maximum number of calculations allowed for your plan.'
			);
		}
	}
};

export const saveCalculation = async <TFormData>({
	apiUrl,
	name,
	formData,
}: ISaveCalculationParam<TFormData>) => {
	await checkCalculationLimit(apiUrl);

	const response = await axios.post(`${apiUrl}`, { name, formData });

	const data = await response.data;

	return data;
};

export const getCalculations = async (apiUrl: (typeof API_URLS)[number]) => {
	const response = await axios.get(`${apiUrl}`);

	const data = await response.data;

	return data;
};

export const deleteCalculation = async ({ apiUrl, id }: IDeleteCalculationParam) => {
	const response = await axios.delete(`${apiUrl}/${id}`);

	const data = await response.data;

	return data;
};

export const renameCalculation = async <TCalculation extends IHasId>({
	apiUrl,
	updatedCalculation,
}: IRenameCalculationParam<TCalculation>) => {
	const response = await axios.put(`${apiUrl}/${updatedCalculation.id}`, updatedCalculation);

	const data = await response.data;

	return data;
};

export const updateCalculation = async <TFormData, TCalculation extends IHasFormData<TFormData>>({
	apiUrl,
	updatedCalculation,
}: IUpdateCalculationParam<TFormData, TCalculation>) => {
	const response = await axios.put(`${apiUrl}/${updatedCalculation.id}`, {
		formData: updatedCalculation.formData,
	});

	const data = await response.data;

	return data;
};
