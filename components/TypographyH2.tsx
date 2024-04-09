import { cn } from '@/lib/utils';
import React from 'react';

interface TypographyH2Props extends React.HTMLAttributes<HTMLHeadingElement> {}

const TypographyH2 = ({ children, className, ...props }: TypographyH2Props) => {
	return (
		<h2
			className={cn(
				'scroll-m-20 text-2xl font-bold tracking-tight transition-colors first:mt-0',
				className
			)}
			{...props}
		>
			{children}
		</h2>
	);
};

export default TypographyH2;
