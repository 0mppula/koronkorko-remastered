import { ButtonWithIcon } from '@/components/ButtonWithIcon';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';

interface BreakdownControlsProps {
	visualizationType: 'chart' | 'table';
	setVisualizationType: (value: 'chart' | 'table') => void;
	breakdownInterval: 'monthly' | 'yearly';
	setBreakdownInterval: (value: 'monthly' | 'yearly') => void;
}

const BreakdownControls = ({
	breakdownInterval,
	setBreakdownInterval,
	setVisualizationType,
	visualizationType,
}: BreakdownControlsProps) => {
	const handleBreakdownIntervalChange = (value: 'yearly' | 'monthly') => {
		setBreakdownInterval(value);
	};

	const handleVisualizationTypeChange = (value: 'chart' | 'table') => {
		setVisualizationType(value);
	};

	return (
		<div className="flex flex-col gap-4 sm:flex-row w-full">
			<Tabs
				onValueChange={(value) =>
					handleBreakdownIntervalChange(value as 'monthly' | 'yearly')
				}
				value={breakdownInterval}
				className="w-full"
			>
				<TabsList className="w-full h-11">
					<TabsTrigger value="yearly" className="w-full">
						Yearly
					</TabsTrigger>

					<TabsTrigger value="monthly" className="w-full">
						Monthly
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<Tabs
				onValueChange={(value) => handleVisualizationTypeChange(value as 'chart' | 'table')}
				value={visualizationType}
				className="w-full"
			>
				<TabsList className="w-full h-11">
					<TabsTrigger value="chart" className="w-full">
						Chart
					</TabsTrigger>
					<TabsTrigger value="table" className="w-full">
						Table
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<ButtonWithIcon className="h-11" loading={false} icon={Download}>
				<span aria-hidden>.xlsx</span>
				<span className="sr-only">Download breakdown as .xlsx</span>
			</ButtonWithIcon>
		</div>
	);
};

export default BreakdownControls;
