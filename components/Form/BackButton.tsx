import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface BackButtonProps {
	href?: string;
}

const BackButton = ({ href = '/' }: BackButtonProps) => {
	return (
		<div className="w-full mb-1">
			<Button asChild variant="link" size="sm" className="px-1">
				<Link href={href}>
					<ArrowLeft className="mr-2 h-4 w-4 mb-[1px]" /> Calculators
				</Link>
			</Button>
		</div>
	);
};

export default BackButton;
