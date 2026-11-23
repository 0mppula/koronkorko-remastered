import { type CalculatorCategory, calculatorCategories } from '@/constants/calculators';

export type CalculatorCategoryFilter = CalculatorCategory | 'all';

interface FilterableCalculator {
	name: string;
	description: string;
	category: CalculatorCategory;
}

export const parseCategory = (value?: string | null): CalculatorCategoryFilter =>
	calculatorCategories.find((c) => c.value === value)?.value ?? 'all';

export const filterCalculators = <T extends FilterableCalculator>(
	list: readonly T[],
	query: string,
	category: CalculatorCategoryFilter
): T[] => {
	const lowerQuery = query.toLowerCase();

	return list.filter(
		(c) =>
			(category === 'all' || c.category === category) &&
			(c.name.toLowerCase().includes(lowerQuery) ||
				c.description.toLowerCase().includes(lowerQuery))
	);
};

export const splitHighlight = (content: string, query: string) => {
	if (!query) return [{ text: content, match: false }];

	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	// With a capturing group, split puts the matches at the odd indices.
	return content
		.split(new RegExp(`(${escapedQuery})`, 'gi'))
		.map((text, index) => ({ text, match: index % 2 === 1 }))
		.filter((part) => part.text);
};

export const buildFilterSearchParams = (
	current: string,
	{ q, category }: { q: string; category: CalculatorCategoryFilter }
) => {
	const params = new URLSearchParams(current);

	if (q) {
		params.set('q', q);
	} else {
		params.delete('q');
	}

	if (category !== 'all') {
		params.set('category', category);
	} else {
		params.delete('category');
	}

	return params.toString();
};
