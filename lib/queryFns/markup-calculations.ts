import { IHasFormData, IHasId } from '@/types/calculations';
import axios from 'axios';

export const ANNUALIZED_RETURN_CALCULATIONS_API_URL =
	'/api/annualized-return-calculations' as const;
export const BREAK_EVEN_POINT_CALCULATIONS_API_URL = '/api/break-even-point-calculations' as const;
export const COMPOUND_INTEREST_CALCULATIONS_API_URL =
	'/api/compound-interest-calculations' as const;
export const INVESTMENT_TIME_CALCULATIONS_API_URL = '/api/investment-time-calculations' as const;
export const MARKUP_CALCULATIONS_API_URL = '/api/markup-calculations' as const;
export const PRESENT_VALUE_CALCULATIONS_API_URL = '/api/present-value-calculations' as const;

export const API_URLS = [
	ANNUALIZED_RETURN_CALCULATIONS_API_URL,
	BREAK_EVEN_POINT_CALCULATIONS_API_URL,
	COMPOUND_INTEREST_CALCULATIONS_API_URL,
	INVESTMENT_TIME_CALCULATIONS_API_URL,
	MARKUP_CALCULATIONS_API_URL,
	PRESENT_VALUE_CALCULATIONS_API_URL,
] as const;

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

export const saveCalculation = async <TFormData>({
	apiUrl,
	name,
	formData,
}: ISaveCalculationParam<TFormData>) => {
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
