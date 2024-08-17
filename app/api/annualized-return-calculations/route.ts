import { getAuthSession } from '@/app/actions/auth';
import { FREE_PLAN_CALCULATION_LIMIT } from '@/constants/data';
import db from '@/lib/db';
import { annualizedReturnFormDataSchema, calculationNameStringSchema } from '@/schemas';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function POST(req: Request) {
	const session = await getAuthSession();
	const body = await req.json();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		if (session?.user.plan === 'free') {
			const calcCount = await db.annualizedReturnCalculation.count({
				where: {
					userId: session?.user.id,
				},
			});

			if (calcCount >= FREE_PLAN_CALCULATION_LIMIT) {
				return NextResponse.json(
					{
						error: 'You have reached the maximum number of calculations allowed for your plan.',
					},
					{ status: 400 }
				);
			}
		}

		const { duration, durationMultiplier, endingBalance, startingBalance } =
			annualizedReturnFormDataSchema.parse(body.formData);
		const name = calculationNameStringSchema.parse(body.name);

		const calculation = await db.annualizedReturnCalculation.create({
			data: {
				name,
				formData: {
					duration,
					durationMultiplier,
					endingBalance,
					startingBalance,
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

		const calculations = await db.annualizedReturnCalculation.findMany({
			where: {
				userId: session?.user.id,
			},
		});

		return NextResponse.json(calculations);
	} catch (error) {
		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
