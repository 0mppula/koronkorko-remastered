import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
	const session = await getAuthSession();
	const body = await req.json();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const db_user = await db.user.update({
			where: { id: session?.user.id },
			data: { preferences: body },
		});

		return NextResponse.json({ data: db_user });
	} catch (error) {
		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
