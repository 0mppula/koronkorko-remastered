'use client';

import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { calculatorCategories } from '@/constants/calculators';
import {
	type CalculatorCategoryFilter,
	buildFilterSearchParams,
	parseCategory,
} from '@/lib/filterCalculators';
import { Calculator, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface CalculatorSearchProps {
	filteredCound: number;
}

const CalculatorSearch = ({ filteredCound }: CalculatorSearchProps) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [internalQuery, setInternalQuery] = useState(searchParams.get('q') || '');
	const [category, setCategory] = useState(parseCategory(searchParams.get('category')));
	const queryTimer = useRef<ReturnType<typeof setTimeout>>();

	// Follow URL changes made elsewhere (e.g. a link to /), unless a query update is pending.
	useEffect(() => {
		if (queryTimer.current) return;

		setInternalQuery(searchParams.get('q') || '');
		setCategory(parseCategory(searchParams.get('category')));
	}, [searchParams]);

	useEffect(() => () => clearTimeout(queryTimer.current), []);

	const replaceUrl = (q: string, nextCategory: CalculatorCategoryFilter) => {
		const params = buildFilterSearchParams(searchParams.toString(), {
			q,
			category: nextCategory,
		});

		if (params === searchParams.toString()) return;

		router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
	};

	const handleQueryChange = (value: string) => {
		setInternalQuery(value);

		clearTimeout(queryTimer.current);
		queryTimer.current = setTimeout(() => {
			queryTimer.current = undefined;
			replaceUrl(value, category);
		}, 200);
	};

	const handleCategoryChange = (value: string) => {
		const nextCategory = parseCategory(value);
		setCategory(nextCategory);

		// Flush the pending query so neither update overwrites the other.
		clearTimeout(queryTimer.current);
		queryTimer.current = undefined;
		replaceUrl(internalQuery, nextCategory);
	};

	return (
		<div className="w-full flex flex-wrap xs:flex-nowrap gap-3 sm:gap-4 justify-between items-center">
			<div className="relative w-full grow-1">
				<Input
					className="pl-10 w-full"
					type="search"
					aria-label="Search calculators"
					value={internalQuery}
					onChange={(e) => handleQueryChange(e.target.value)}
					placeholder="Search calculators..."
				/>

				<div className="absolute top-[4px] left-[4px] pointer-events-none flex items-center justify-center p-2 transition-all text-neutral-700 dark:text-neutral-300">
					<Search className="size-4" />
				</div>
			</div>

			<Select value={category} onValueChange={handleCategoryChange}>
				<SelectTrigger
					className="w-[140px] sm:w-[180px] shrink-0 grow basis-0 xs:grow-0 xs:basis-auto"
					aria-label="Filter by category"
				>
					<SelectValue />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="all">All</SelectItem>
					{calculatorCategories.map((c) => (
						<SelectItem key={c.value} value={c.value}>
							{c.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div className="relative flex sm:hidden shrink-0">
				<Calculator className="size-6" aria-hidden="true" />
				<span
					aria-hidden="true"
					className="absolute -top-2 -right-2 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none tabular-nums text-secondary-foreground"
				>
					{filteredCound}
				</span>
				<span className="sr-only">
					{filteredCound} {filteredCound === 1 ? 'calculator' : 'calculators'}
				</span>
			</div>

			<div className="hidden sm:flex justify-center items-center gap-1">
				<span className="text-xl tabular-nums min-w-[2ch] text-right">{filteredCound}</span>
				<Calculator className="size-6" />
			</div>
		</div>
	);
};

export default CalculatorSearch;
