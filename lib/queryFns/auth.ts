import { toast } from '@/components/ui/use-toast';
import { User } from '@prisma/client';
import axios from 'axios';

const API_URL = '/api/auth';

export const getUser = async (
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated'
): Promise<User | null> => {
	if (sessionStatus !== 'authenticated') {
		return null;
	}

	try {
		const response = await axios.get(API_URL);
		const data = await response.data;

		return data.data;
	} catch (error) {
		toast({
			variant: 'destructive',
			description: 'Something went wrong while fetching your info. Please try again later.',
		});

		return null;
	}
};

export const updateUserPreferences = async (variables: {
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
	theme: string;
	currency: string;
}) => {
	if (variables.sessionStatus !== 'authenticated') {
		return null;
	}

	try {
		const response = await axios.put(`${API_URL}/preferences`, {
			theme: variables.theme,
			currency: variables.currency,
		});
		const data = await response.data;

		return data.data;
	} catch (error) {}
};
