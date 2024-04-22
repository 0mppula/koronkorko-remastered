'use client';

import {
	BREAK_EVEN_POINT_CALCULATIONS_API_URL,
	BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import useDeleteCalculationMutation from '@/hooks/useDeleteCalculationMutation';
import useRenameCalculationMutation from '@/hooks/useRenameCalculationMutation';
import useSaveCalculationMutation from '@/hooks/useSaveCalculationMutation';
import useUpdateCalculationMutation from '@/hooks/useUpdateCalculationMutation';
import {
	deleteCalculation,
	getCalculations,
	renameCalculation,
	saveCalculation,
	updateCalculation,
} from '@/lib/queryFns/calculations';
import { breakEvenPointCalculatorSchema } from '@/schemas';
import { InferredBreakEvenPointCalculatorSchema } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { BreakEvenPointCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
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

const calcualteBreakEvenPoint = (formData: InferredBreakEvenPointCalculatorSchema) => {
	const { fixedCosts, variableCostsPerUnit, pricePerUnit } = formData;

	// BEP = Fixed costs / (Sales price per unit – Variable cost per unit)
	const BEP = fixedCosts / (pricePerUnit - variableCostsPerUnit);
	// Break even point in currency
	const BEPM = BEP * pricePerUnit;

	// Contribution margin
	const CM = pricePerUnit - variableCostsPerUnit;
	const CMP = (CM / pricePerUnit) * 100;

	return {
		breakEvenPointUnits: BEP,
		breakEvenPointMoney: BEPM,
		contributionMarginMoney: CM,
		contributionMarginPercent: CMP,
	};
};

const Calculator = () => {
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [renameModalOpen, setRenameModalOpen] = useState(false);
	const [activeCalculation, setActiveCalculation] = useState<BreakEvenPointCalculation | null>(
		null
	);
	const [report, setReport] = useState<BreakEvenPointReportProps | null>(null);

	const form = useForm<InferredBreakEvenPointCalculatorSchema>({
		resolver: zodResolver(breakEvenPointCalculatorSchema),
		defaultValues,
	});

	/* const { onCalculate, resetForm } = useCalculator<
		InferredBreakEvenPointCalculatorSchema,
		BreakEvenPointReportProps
	>(setReport, calcualteBreakEvenPoint, defaultValues, form); */

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

	const { mutate: saveMutation } = useSaveCalculationMutation<
		BreakEvenPointCalculation,
		InferredBreakEvenPointCalculatorSchema
	>(
		BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
		setActiveCalculation,
		saveCalculation,
		setSaveModalOpen
	);

	const { mutate: deleteMutation } = useDeleteCalculationMutation<
		BreakEvenPointReportProps,
		BreakEvenPointCalculation
	>(
		BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
		activeCalculation,
		setActiveCalculation,
		setReport,
		deleteCalculation
	);

	const { mutate: renameMutation } = useRenameCalculationMutation<BreakEvenPointCalculation>(
		BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
		setActiveCalculation,
		setRenameModalOpen,
		renameCalculation
	);

	const { mutate: updateMutation } = useUpdateCalculationMutation<
		InferredBreakEvenPointCalculatorSchema,
		BreakEvenPointCalculation
	>(BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY, setActiveCalculation, updateCalculation);

	return <div>Calculator</div>;
};

export default Calculator;
