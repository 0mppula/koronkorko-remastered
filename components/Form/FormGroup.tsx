import { cn } from '@/lib/utils';
import { PropsWithChildren } from 'react';

interface IFormGroupProps extends PropsWithChildren {
	inline?: boolean;
}

const FormGroup = ({ children, inline = false }: IFormGroupProps) => {
	return (
		<div className={cn('flex flex-col xs:flex-row gap-4', inline && 'flex-row gap-2 xs:gap-4')}>
			{children}
		</div>
	);
};

export default FormGroup;
