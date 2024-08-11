import { cn } from '@/lib/utils';
import React from 'react';

interface TypographyH3Props extends React.HTMLAttributes<HTMLHeadingElement> {}

const TypographyH3 = ({ children, className, ...props }: TypographyH3Props) => {
	return (
		<h3
			className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)}
			{...props}
		>
			{children}
		</h3>
	);
};

export default TypographyH3;
