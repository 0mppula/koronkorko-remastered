import { User } from '@prisma/client';
import axios from 'axios';

const API_URL = '/api/auth';

export const getUser = async (
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated'
): Promise<User | null> => {
	if (sessionStatus !== 'authenticated') {
		return null;
	}

	const response = await axios.get(API_URL, {
		headers: {
			'Cache-Control': 'no-cache',
			Pragma: 'no-cache',
			Expires: '0',
		},
	});
	const data = await response.data;

	return data.data;
};

export const updateUserPreferences = async (variables: {
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
	theme: string;
	currency: string;
}) => {
	if (variables.sessionStatus !== 'authenticated') {
		return null;
	}

	const response = await axios.put(
		`${API_URL}/preferences`,
		{
			theme: variables.theme,
			currency: variables.currency,
		},
		{
			headers: {
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
				Expires: '0',
			},
		}
	);
	const data = await response.data;

	return data.data;
};
