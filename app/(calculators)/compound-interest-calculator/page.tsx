import TypographyH1 from '@/components/TypographyH1';
import { appName } from '@/constants';
import { getCalculatorWithPathname } from '@/lib/utils';
import { Metadata } from 'next';

const calculator = getCalculatorWithPathname('compound-interest-calculator');

export const metadata: Metadata = {
	title: `${calculator.name} - ${appName}`,
	description: calculator.description,
};

const page = () => {
	return (
		<>
			<TypographyH1>{calculator.name}</TypographyH1>
		</>
	);
};

export default page;
