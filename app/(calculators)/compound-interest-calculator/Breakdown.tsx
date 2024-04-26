'use client';

import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import { ICompoundInterestFormData } from '@/types/calculations';
import { Dispatch, SetStateAction, useState } from 'react';
import BreakdownControls from './BreakdownControls';
import { ReportProps } from './Calculator';

interface BreakdownProps extends ReportProps {
	setIsLoading: Dispatch<SetStateAction<boolean>>;
	formData: ICompoundInterestFormData;
}

const Breakdown = ({ formData, report, setIsLoading, isLoading }: BreakdownProps) => {
	const [visualizationType, setVisualizationType] = useState<'chart' | 'table'>('chart');
	const [breakdownInterval, setBreakdownInterval] = useState<'monthly' | 'yearly'>('yearly');

	return (
		<ReportSummaryContainer isLoading={isLoading} title="Breakdown">
			<BreakdownControls
				visualizationType={visualizationType}
				setVisualizationType={setVisualizationType}
				breakdownInterval={breakdownInterval}
				setBreakdownInterval={setBreakdownInterval}
			/>
		</ReportSummaryContainer>
	);
};

export default Breakdown;
