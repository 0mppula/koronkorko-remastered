import { describe, expect, it } from 'vitest';

import { calculatorCategories, calculators } from '@/constants/calculators';
import {
	buildFilterSearchParams,
	filterCalculators,
	parseCategory,
	splitHighlight,
} from '@/lib/filterCalculators';

const list = [
	{ name: 'Markup Calculator', category: 'finance', description: 'Selling price and cost.' },
	{ name: 'Crosswind Calculator', category: 'aviation', description: 'Wind components.' },
	{ name: 'Wind Triangle Calculator', category: 'aviation', description: 'Heading and speed.' },
	{ name: 'Dividend Yield Calculator', category: 'finance', description: 'Yield of a stock.' },
] as const;

const names = (result: readonly { name: string }[]) => result.map((c) => c.name);

describe('parseCategory', () => {
	it('accepts every category', () => {
		for (const category of calculatorCategories) {
			expect(parseCategory(category.value)).toBe(category.value);
		}
	});

	it('falls back to all for unknown, empty or missing values', () => {
		expect(parseCategory('weather')).toBe('all');
		expect(parseCategory('Aviation')).toBe('all');
		expect(parseCategory('')).toBe('all');
		expect(parseCategory(null)).toBe('all');
		expect(parseCategory(undefined)).toBe('all');
	});
});

describe('filterCalculators', () => {
	it('returns every calculator for an empty query and all', () => {
		expect(filterCalculators(list, '', 'all')).toEqual(list);
	});

	it('returns only the finance calculators', () => {
		expect(names(filterCalculators(list, '', 'finance'))).toEqual([
			'Markup Calculator',
			'Dividend Yield Calculator',
		]);
	});

	it('returns only the aviation calculators', () => {
		expect(names(filterCalculators(list, '', 'aviation'))).toEqual([
			'Crosswind Calculator',
			'Wind Triangle Calculator',
		]);
	});

	it('matches the query in the name or description, ignoring case', () => {
		expect(names(filterCalculators(list, 'WIND', 'all'))).toEqual([
			'Crosswind Calculator',
			'Wind Triangle Calculator',
		]);
		expect(names(filterCalculators(list, 'price', 'all'))).toEqual(['Markup Calculator']);
	});

	it('applies the query and the category together', () => {
		expect(names(filterCalculators(list, 'yield', 'finance'))).toEqual([
			'Dividend Yield Calculator',
		]);
		expect(filterCalculators(list, 'yield', 'aviation')).toEqual([]);
		expect(names(filterCalculators(list, 'heading', 'aviation'))).toEqual([
			'Wind Triangle Calculator',
		]);
	});

	it('treats an unknown category as all', () => {
		expect(filterCalculators(list, '', parseCategory('weather'))).toEqual(list);
		expect(names(filterCalculators(list, 'wind', parseCategory('weather')))).toEqual([
			'Crosswind Calculator',
			'Wind Triangle Calculator',
		]);
	});

	it('matches regex characters literally', () => {
		expect(filterCalculators(list, '(', 'all')).toEqual([]);
		expect(filterCalculators(list, '.*', 'all')).toEqual([]);
		expect(names(filterCalculators(list, 'cost.', 'all'))).toEqual(['Markup Calculator']);
	});

	it('works with the real calculator list', () => {
		expect(filterCalculators(calculators, '', 'all')).toEqual(calculators);

		for (const category of calculatorCategories) {
			const result = filterCalculators(calculators, '', category.value);

			expect(result.length).toBeGreaterThan(0);
			expect(result.every((c) => c.category === category.value)).toBe(true);
		}
	});
});

describe('splitHighlight', () => {
	it('returns the whole text unmatched for an empty query', () => {
		expect(splitHighlight('Crosswind Calculator', '')).toEqual([
			{ text: 'Crosswind Calculator', match: false },
		]);
	});

	it('marks every match, ignoring case and keeping the original case', () => {
		expect(splitHighlight('Wind and crosswind', 'WIND')).toEqual([
			{ text: 'Wind', match: true },
			{ text: ' and cross', match: false },
			{ text: 'wind', match: true },
		]);
	});

	it('handles regex characters in the query without throwing', () => {
		expect(splitHighlight('Price (P/E) ratio', '(p/e)')).toEqual([
			{ text: 'Price ', match: false },
			{ text: '(P/E)', match: true },
			{ text: ' ratio', match: false },
		]);
		expect(splitHighlight('Price ratio', '(')).toEqual([{ text: 'Price ratio', match: false }]);
		expect(splitHighlight('a.b', '.')).toEqual([
			{ text: 'a', match: false },
			{ text: '.', match: true },
			{ text: 'b', match: false },
		]);
	});
});

describe('buildFilterSearchParams', () => {
	it('writes both the query and the category', () => {
		expect(buildFilterSearchParams('', { q: 'wind', category: 'aviation' })).toBe(
			'q=wind&category=aviation'
		);
	});

	it('removes an empty query and the all category', () => {
		expect(
			buildFilterSearchParams('q=wind&category=aviation', { q: '', category: 'all' })
		).toBe('');
	});

	it('keeps unrelated parameters', () => {
		expect(buildFilterSearchParams('ref=x&q=old', { q: '', category: 'finance' })).toBe(
			'ref=x&category=finance'
		);
	});

	it('includes the pending query when the category changes', () => {
		// The URL still has the query from before the user kept typing.
		expect(buildFilterSearchParams('q=wi', { q: 'wind', category: 'aviation' })).toBe(
			'q=wind&category=aviation'
		);
	});

	it('keeps the selected category when the query changes', () => {
		expect(
			buildFilterSearchParams('category=aviation', { q: 'wind', category: 'aviation' })
		).toBe('category=aviation&q=wind');
	});

	it('encodes the query', () => {
		expect(buildFilterSearchParams('', { q: 'a&b c', category: 'all' })).toBe('q=a%26b+c');
	});
});
