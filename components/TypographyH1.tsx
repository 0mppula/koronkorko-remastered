import { cn } from '@/lib/utils';
import React from 'react';

interface TypographyH1Props extends React.HTMLAttributes<HTMLHeadingElement> {}

const TypographyH1 = ({ children, className, ...props }: TypographyH1Props) => {
	return (
		<h1
			className={cn(
				'scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl text-center mb-6',
				className
			)}
			{...props}
		>
			{children}
		</h1>
	);
};

export default TypographyH1;
