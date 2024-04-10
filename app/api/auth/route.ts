import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
	const session = await getAuthSession();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const db_user = await db.user.findFirst({
			where: { id: session?.user.id },
		});

		return NextResponse.json({ data: db_user });
	} catch (error) {
		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
