import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { calculationNameSchema, markupCalculatorSchema } from '@/schemas';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function GET(req: Request) {
	const session = await getAuthSession();
	const body = await req.json();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const { cost, salesPrice } = markupCalculatorSchema.parse(body.formData);
		const name = calculationNameSchema.parse(body.name);

		// TODO VALIDATE NAME
		const calculation = db.markupCalculation.create({
			data: {
				name,
				formData: {
					cost,
					salesPrice,
				},
				userId: session?.user.id,
			},
		});

		return NextResponse.json({ data: calculation });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.issues }, { status: 400 });
		}

		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
