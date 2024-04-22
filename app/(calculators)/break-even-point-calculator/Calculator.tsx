'use client';

import {
	BREAK_EVEN_POINT_CALCULATIONS_API_URL,
	BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { getCalculations } from '@/lib/queryFns/calculations';
import { breakEvenPointCalculatorSchema } from '@/schemas';
import { InferredBreakEvenPointCalculatorSchema } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { BreakEvenPointCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';

export interface BreakEvenPointReportProps {
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

const defaultValues: InferredBreakEvenPointCalculatorSchema = {
	fixedCosts: 0,
	variableCostsPerUnit: 0,
	pricePerUnit: 0,
};

const Calculator = () => {
	const form = useForm<InferredBreakEvenPointCalculatorSchema>({
		resolver: zodResolver(breakEvenPointCalculatorSchema),
		defaultValues,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<BreakEvenPointCalculation[] | null>({
		queryKey: [BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(BREAK_EVEN_POINT_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return <div>Calculator</div>;
};

export default Calculator;
