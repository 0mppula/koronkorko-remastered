import { ButtonWithIcon } from '@/components/ButtonWithIcon';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
	const handleBreakdownIntervalChange = (value: 'monthly' | 'yearly') => {
		setBreakdownInterval(value);
	};

	const handleVisualizationTypeChange = (value: 'chart' | 'table') => {
		setVisualizationType(value);
	};

	return (
		<div className="flex flex-col gap-4 xs:flex-row w-full">
			<RadioGroup
				className="w-full flex justify-center items-end rounded-sm group gap-0"
				onValueChange={handleBreakdownIntervalChange}
				value={breakdownInterval}
			>
				<div className="w-full">
					<RadioGroupItem value="yearly" id="yearly" className="peer sr-only" />
					<Label
						htmlFor="yearly"
						className="peer-data-[state=checked]:bg-primary bg-secondary peer-data-[state=checked]:text-secondary-foreground p-[10px] cursor-pointer w-full text-primary-foreground rounded-s-md font-semibold h-11 flex items-center justify-center shadow-inset-xl peer-data-[state=checked]:shadow-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ring-offset-background peer-focus-visible:rounded-md relative peer-focus-visible:z-10"
					>
						Yearly
					</Label>
				</div>

				<div className="w-full">
					<RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
					<Label
						htmlFor="monthly"
						className="peer-data-[state=checked]:bg-primary bg-secondary peer-data-[state=checked]:text-secondary-foreground p-[10px] cursor-pointer w-full text-primary-foreground rounded-e-md font-semibold h-11 flex items-center justify-center shadow-inset-xl peer-data-[state=checked]:shadow-none peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ring-offset-background peer-focus-visible:rounded-md relative peer-focus-visible:z-10"
					>
						Monthly
					</Label>
				</div>
			</RadioGroup>

			<RadioGroup
				className="w-full flex justify-center items-end rounded-sm group gap-0"
				onValueChange={handleVisualizationTypeChange}
				value={visualizationType}
			>
				<div className="w-full">
					<RadioGroupItem value="chart" id="chart" className="peer sr-only" />
					<Label
						htmlFor="chart"
						className="peer-data-[state=checked]:bg-primary bg-secondary peer-data-[state=checked]:text-secondary-foreground p-[10px] cursor-pointer w-full text-primary-foreground rounded-s-md font-semibold h-11 flex items-center justify-center shadow-inset-xl peer-data-[state=checked]:shadow-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ring-offset-background peer-focus-visible:rounded-md relative peer-focus-visible:z-10"
					>
						Chart
					</Label>
				</div>

				<div className="w-full">
					<RadioGroupItem value="table" id="table" className="peer sr-only" />
					<Label
						htmlFor="table"
						className="peer-data-[state=checked]:bg-primary bg-secondary peer-data-[state=checked]:text-secondary-foreground p-[10px] cursor-pointer w-full text-primary-foreground rounded-e-md font-semibold h-11 flex items-center justify-center shadow-inset-xl peer-data-[state=checked]:shadow-none peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ring-offset-background peer-focus-visible:rounded-md relative peer-focus-visible:z-10"
					>
						Table
					</Label>
				</div>
			</RadioGroup>

			<ButtonWithIcon className="h-11" loading={false} icon={Download}>
				<span aria-hidden>.xlsx</span>
				<span className="sr-only">Download breakdown as .xlsx</span>
			</ButtonWithIcon>
		</div>
	);
};

export default BreakdownControls;
