import { describe, expect, it } from 'vitest';

import { formatCurrency } from '@/lib/utils';

// Intl uses non-breaking spaces (e.g. fi-FI), so compare with plain spaces.
const normalize = (value: string) => value.replace(/\s/g, ' ');

describe('formatCurrency', () => {
	it('defaults to USD', () => {
		expect(formatCurrency(1234.56)).toBe('$1,234.56');
	});

	it('formats each currency with its locale', () => {
		expect(formatCurrency(1234.56, 'usd')).toBe('$1,234.56');
		expect(normalize(formatCurrency(1234.56, 'eur'))).toBe('1 234,56 €');
		expect(formatCurrency(1234.56, 'gbp')).toBe('£1,234.56');
		expect(formatCurrency(1234, 'jpy')).toBe('¥1,234');
		expect(formatCurrency(1234567.89, 'inr')).toBe('₹1,234,567.89');
	});

	it('formats negative values', () => {
		expect(formatCurrency(-1234.5)).toBe('-$1,234.50');
	});

	it('rounds to the maximum fraction digits', () => {
		expect(formatCurrency(1234.567)).toBe('$1,234.57');
		expect(formatCurrency(1234.567, 'usd', 0)).toBe('$1,235');
	});

	it('formats very large values', () => {
		expect(formatCurrency(1e12)).toBe('$1,000,000,000,000.00');
	});

	it('formats zero', () => {
		expect(formatCurrency(0, 'usd')).toBe('$0.00');
		expect(normalize(formatCurrency(0, 'eur'))).toBe('0,00 €');
		expect(formatCurrency(0, 'gbp')).toBe('£0.00');
		expect(formatCurrency(0, 'inr')).toBe('₹0.00');
	});

	// FINDING: zero yen is hardcoded as '¥0.00', but JPY has no minor unit (ISO 4217)
	it.fails('BUG: formats zero yen without decimals', () => {
		expect(formatCurrency(0, 'jpy')).toBe('¥0');
	});

	it('formats zero with Intl when formatZero is false', () => {
		expect(formatCurrency(0, 'usd', 2, false)).toBe('$0.00');
	});

	it('falls back to zero for NaN', () => {
		expect(formatCurrency(NaN, 'usd')).toBe('$0.00');
		expect(normalize(formatCurrency(NaN, 'eur'))).toBe('0,00 €');
	});
});
