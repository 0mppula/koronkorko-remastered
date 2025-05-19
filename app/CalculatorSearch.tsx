'use client';

import { Input } from '@/components/ui/input';
import { Calculator, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CalculatorSearchProps {
	filteredCound: number;
}

const CalculatorSearch = ({ filteredCound }: CalculatorSearchProps) => {
	const searchParams = useSearchParams();
	const router = useRouter();

	const q = searchParams.get('q') || '';
	const [internalQuery, setInternalQuery] = useState(q);

	useEffect(() => {
		// 200ms debounce
		const timer = setTimeout(() => {
			const params = new URLSearchParams(searchParams.toString());

			if (internalQuery) {
				params.set('q', internalQuery);
			} else {
				params.delete('q');
			}

			// Update the URL query string without reloading the page
			router.replace(`?${params.toString()}`);
		}, 200);

		return () => {
			clearTimeout(timer);
		};
	}, [internalQuery, searchParams, q]);

	return (
		<div className="w-full flex gap-4 mb-4 justify-between items-center">
			<div className="relative w-full grow-1">
				<Input
					className="pl-10 w-full"
					type="search"
					value={internalQuery}
					onChange={(e) => setInternalQuery(e.target.value)}
					placeholder="Search calculators..."
				/>

				<div className="absolute top-[4px] left-[4px] pointer-events-none flex items-center justify-center p-2 transition-all text-neutral-700 dark:text-neutral-300">
					<Search className="size-4" />
				</div>
			</div>

			<div className="flex justify-center items-center gap-1">
				<span className="text-xl">{filteredCound}</span>
				<Calculator className="size-6" />
			</div>
		</div>
	);
};

export default CalculatorSearch;
