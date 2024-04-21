import BackButton from '@/components/Form/BackButton';
import CalculatorContainer from '@/components/Form/CalculatorContainer';
import TypographyH1 from '@/components/TypographyH1';
import { appName } from '@/constants/data';
import { getCalculatorWithPathname } from '@/lib/utils';
import { Metadata } from 'next';
import Calculator from './Calculator';

const calculator = getCalculatorWithPathname('markup-calculator');

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

				<Calculator />
			</CalculatorContainer>
		</>
	);
};

export default page;
