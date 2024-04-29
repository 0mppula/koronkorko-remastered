'use client';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { FormLabel } from '../ui/form';

interface DynamicFormLabelProps extends React.HTMLProps<HTMLLabelElement> {
	label: string;
	shortLabel?: string;
}

const DynamicFormLabel = ({ label, shortLabel = '', ...props }: DynamicFormLabelProps) => {
	const { isXs } = useWindowDimensions();

	return (
		<FormLabel aria-label={label} {...props}>
			{!shortLabel || (!isXs && <span aria-hidden>{label}</span>)}
			{shortLabel && isXs && <span aria-hidden>{shortLabel}</span>}
		</FormLabel>
	);
};

export default DynamicFormLabel;
