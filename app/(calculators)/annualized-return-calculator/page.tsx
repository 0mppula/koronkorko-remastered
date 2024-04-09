import TypographyH1 from '@/components/TypographyH1';
import { appName, calculators } from '@/constants';
import { Metadata } from 'next';

const calculator = calculators.find(
	(calculator) => calculator.url === 'annualized-return-calculator'
);

export const metadata: Metadata = {
	title: `${calculator?.name} - ${appName}`,
	description: calculator?.description,
};

const page = () => {
	return (
		<>
			<TypographyH1>Annualized Return Calculator</TypographyH1>
		</>
	);
};

export default page;
