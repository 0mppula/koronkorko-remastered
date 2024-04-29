import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '../ui/button';

interface BackButtonProps {
	href?: string;
}

const BackButton = ({ href = '/' }: BackButtonProps) => {
	return (
		<div className="w-full mb-1">
			<Link
				href={href}
				className={cn(
					'px-1',
					buttonVariants({
						variant: 'link',
						size: 'sm',
					})
				)}
			>
				<ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
				<span aria-hidden>Calculators</span>
				<span className="sr-only">Back to calculators</span>
			</Link>
		</div>
	);
};

export default BackButton;
