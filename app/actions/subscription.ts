'use server';

import db from '@/lib/db';
import { getAuthSession } from './auth';

export async function getUsersSubscriptionData() {
	const session = await getAuthSession();

	if (!session) {
		null;
	}

	const subscription = await db.subscription.findFirst({
		where: {
			userId: session?.user.id,
		},
	});

	return subscription;
}
