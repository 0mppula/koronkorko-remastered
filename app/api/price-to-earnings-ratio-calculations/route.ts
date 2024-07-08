import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { calculationNameStringSchema, priceToEarningsRatioFormDataSchema } from '@/schemas';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function POST(req: Request) {
	const session = await getAuthSession();
	const body = await req.json();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const { earningsPerShare, sharePrice } = priceToEarningsRatioFormDataSchema.parse(
			body.formData
		);
		const name = calculationNameStringSchema.parse(body.name);

		const calculation = await db.priceToEarningsRatioCalculation.create({
			data: {
				name,
				formData: {
					earningsPerShare,
					sharePrice,
				},
				userId: session?.user.id,
			},
		});

		return NextResponse.json(calculation);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.issues }, { status: 400 });
		}

		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}

export async function GET() {
	const session = await getAuthSession();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const calculations = await db.priceToEarningsRatioCalculation.findMany({
			where: {
				userId: session?.user.id,
			},
		});

		return NextResponse.json(calculations);
	} catch (error) {
		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
