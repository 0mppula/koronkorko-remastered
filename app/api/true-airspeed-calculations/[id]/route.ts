import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { calculationNameStringSchema, trueAirspeedFormDataSchema } from '@/schemas';
import { ICalculationNameString, ITrueAirspeedFormData } from '@/types/calculations';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const PUT = async (req: Request, { params }: { params: { id: string } }) => {
	const session = await getAuthSession();
	const body = await req.json();
	const calculationId = params.id;

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		let formData: ITrueAirspeedFormData | undefined;
		let name: ICalculationNameString | undefined;

		if (body.formData) {
			formData = trueAirspeedFormDataSchema.parse(body.formData);
		}

		if (body.name) {
			name = calculationNameStringSchema.parse(body.name);
		}

		const calculation = await db.trueAirspeedCalculation.update({
			where: {
				id: calculationId as string,
				userId: session?.user.id,
			},
			data: { formData, name },
		});

		return NextResponse.json(calculation);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
		}

		return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
};

export const DELETE = async (_: Request, { params }: { params: { id: string } }) => {
	const session = await getAuthSession();
	const calculationId = params.id;

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const calculation = await db.trueAirspeedCalculation.delete({
			where: {
				id: calculationId as string,
				userId: session?.user.id,
			},
		});

		return NextResponse.json(calculation);
	} catch (error) {
		return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
};
