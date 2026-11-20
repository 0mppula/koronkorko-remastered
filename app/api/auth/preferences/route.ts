import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { userPreferencesSchema } from '@/schemas';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function PUT(req: Request) {
	const session = await getAuthSession();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const body: unknown = await req.json().catch(() => null);

		if (body === null) {
			return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
		}

		const preferences = userPreferencesSchema.parse(body);

		const db_user = await db.user.update({
			where: { id: session?.user.id },
			data: { preferences },
		});

		return NextResponse.json({ data: db_user });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
		}

		return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
