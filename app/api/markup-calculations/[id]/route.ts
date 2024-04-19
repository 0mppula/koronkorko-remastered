import { getAuthSession } from '@/app/actions/auth';
import db from '@/lib/db';
import { calculationNameStringSchema, markupCalculatorSchema } from '@/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function PUT(req: Request) {
	const session = await getAuthSession();
	const body = await req.json();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		let formData: z.infer<typeof markupCalculatorSchema> | undefined;
		let name: z.infer<typeof calculationNameStringSchema> | undefined;

		if (body.formData) {
			formData = markupCalculatorSchema.parse(body.formData);
		}

		if (body.name) {
			name = calculationNameStringSchema.parse(body.name);
		}

		const calculation = await db.markupCalculation.update({
			where: {
				id: body.id as string,
				userId: session?.user.id,
			},
			data: {
				formData,
				name,
			},
		});

		return NextResponse.json(calculation);
	} catch (error) {
		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}

export async function DELETE({ params: { id: calculationId } }: { params: { id: string } }) {
	const session = await getAuthSession();

	try {
		if (!session) {
			return NextResponse.json({ error: 'Not Authorized' }, { status: 401 });
		}

		const calculation = await db.markupCalculation.delete({
			where: {
				id: calculationId as string,
				userId: session?.user.id,
			},
		});

		return NextResponse.json(calculation);
	} catch (error) {
		NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}
