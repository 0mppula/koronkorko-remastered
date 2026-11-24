import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { calculationNameStringSchema, weightAndBalanceFormDataSchema } from '@/schemas';
import { ICalculationNameString } from '@/types/calculations';
import { Prisma } from '@prisma/client';
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

		let formData: Prisma.WeightAndBalanceCalculationFormDataCreateInput | undefined;
		let name: ICalculationNameString | undefined;

		if (body.formData) {
			const { stations, fuelType, maxTakeoffWeight } = weightAndBalanceFormDataSchema.parse(
				body.formData
			);

			// Listed explicitly so a form-only row id is never stored.
			formData = {
				stations: stations.map(({ name, type, weight, fuel, arm }) => ({
					name,
					type,
					weight: weight ?? undefined,
					fuel: fuel ?? undefined,
					arm,
				})),
				fuelType,
				maxTakeoffWeight: maxTakeoffWeight ?? undefined,
			};
		}

		if (body.name) {
			name = calculationNameStringSchema.parse(body.name);
		}

		const calculation = await db.weightAndBalanceCalculation.update({
			where: {
				id: calculationId as string,
				userId: session?.user.id,
			},
			// Replaces the whole formData, so a removed maximum takeoff weight is removed.
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

		const calculation = await db.weightAndBalanceCalculation.delete({
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
