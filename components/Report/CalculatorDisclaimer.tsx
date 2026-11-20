import { type CalculatorCategory } from '@/constants/calculators';
import { calculatorDisclaimers } from '@/constants/data';

interface CalculatorDisclaimerProps {
	category: CalculatorCategory;
}

const CalculatorDisclaimer = ({ category }: CalculatorDisclaimerProps) => {
	return (
		<p className="basis-full text-sm text-muted-foreground">
			{calculatorDisclaimers[category]}
		</p>
	);
};

export default CalculatorDisclaimer;
