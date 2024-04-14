import Link from 'next/link';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface BackButtonProps {
	href?: string;
}

const BackButton = ({ href = '/' }: BackButtonProps) => {
	return (
		<div className="w-full">
			<Button asChild variant="link" size="sm">
				<Link href={href}>
					<ArrowLeft className="mr-2 h-4 w-4 mb-[1px]" /> Calculators
				</Link>
			</Button>
		</div>
	);
};

export default BackButton;
