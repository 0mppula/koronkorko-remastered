import { cn } from '@/lib/utils';
import React from 'react';
import { buttonVariants } from '../ui/button';

interface ReportSourceProps extends React.HTMLAttributes<HTMLParagraphElement> {
	href: string;
	text: string;
}

const ReportSource = ({ href, text, className, ...props }: ReportSourceProps) => {
	return (
		<p {...props} className={cn('ml-auto', className)}>
			Learn more at{' '}
			<a
				className={cn(
					buttonVariants({
						variant: 'link',
						size: 'sm',
					}),
					'p-0 h-auto transition-none'
				)}
				href={href}
				target="_blank"
				rel="noopener noreferrer"
			>
				{text}
			</a>
		</p>
	);
};

export default ReportSource;
