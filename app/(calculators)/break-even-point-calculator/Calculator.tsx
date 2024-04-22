'use client';

import ImportCalculationModal from '@/components/Modals/ImportCalculationModal';
import RenameCalculationModal from '@/components/Modals/RenameCalculationModal';
import SaveCalculationModal from '@/components/Modals/SaveCalculationModal';
import {
	BREAK_EVEN_POINT_CALCULATIONS_API_URL,
	BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calcualteBreakEvenPoint } from '@/lib/calculatorFns';
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

	const {
		onCalculate,
		resetForm,
		handleSaveUpdateStart,
		closeSaveModal,
		handleSave,
		handleRename,
		handleClose,
		handleDelete,
		handleImport,
		report,
		saveModalOpen,
		importModalOpen,
		setImportModalOpen,
		renameModalOpen,
		setRenameModalOpen,
		activeCalculation,
	} = useCalculator<
		InferredBreakEvenPointCalculatorSchema,
		BreakEvenPointReportProps,
		BreakEvenPointCalculation
	>({
		apiUrl: BREAK_EVEN_POINT_CALCULATIONS_API_URL,
		queryKey: BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calcualteBreakEvenPoint,
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

	return (
		<>
			<SaveCalculationModal
				isOpen={saveModalOpen}
				handleClose={closeSaveModal}
				handleSave={handleSave}
			/>

			<ImportCalculationModal
				isOpen={importModalOpen}
				setImportModalOpen={setImportModalOpen}
				handleDelete={handleDelete}
				calculations={calculations}
				isLoading={isCalculationsLoading || isFetching}
				handleImport={handleImport}
			/>

			<RenameCalculationModal
				isOpen={renameModalOpen}
				handleClose={() => setRenameModalOpen(false)}
				handleRename={handleRename}
				activeCalculation={activeCalculation}
			/>
		</>
	);
};

export default Calculator;
