import BackButton from '@/components/Form/BackButton';
import CalculatorContainer from '@/components/Form/CalculatorContainer';
import TypographyH1 from '@/components/TypographyH1';
import { appName } from '@/constants';
import { getCalculatorWithPathname } from '@/lib/utils';
import { Metadata } from 'next';

const calculator = getCalculatorWithPathname('annualized-return-calculator');

export const metadata: Metadata = {
	title: `${calculator.name} - ${appName}`,
	description: calculator.description,
};

const page = () => {
	return (
		<>
			<TypographyH1 className="text-center mb-6">{calculator.name}</TypographyH1>

			<CalculatorContainer>
				<BackButton />
			</CalculatorContainer>
		</>
	);
};

export default page;
