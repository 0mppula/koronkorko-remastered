// API URLs
export const MARKUP_CALCULATIONS_API_URL = '/api/markup-calculations' as const;
export const ANNUALIZED_RETURN_CALCULATIONS_API_URL =
	'/api/annualized-return-calculations' as const;
export const BREAK_EVEN_POINT_CALCULATIONS_API_URL = '/api/break-even-point-calculations' as const;
export const COMPOUND_INTEREST_CALCULATIONS_API_URL =
	'/api/compound-interest-calculations' as const;
export const INVESTMENT_TIME_CALCULATIONS_API_URL = '/api/investment-time-calculations' as const;
export const PRESENT_VALUE_CALCULATIONS_API_URL = '/api/present-value-calculations' as const;
export const EVENT_PROBABILITY_CALCULATIONS_API_URL =
	'/api/event-probability-calculations' as const;
export const PRICE_TO_EARNINGS_RATIO_CALCULATIONS_API_URL =
	'/api/price-to-earnings-ratio-calculations' as const;

export const API_URLS = [
	ANNUALIZED_RETURN_CALCULATIONS_API_URL,
	BREAK_EVEN_POINT_CALCULATIONS_API_URL,
	COMPOUND_INTEREST_CALCULATIONS_API_URL,
	INVESTMENT_TIME_CALCULATIONS_API_URL,
	MARKUP_CALCULATIONS_API_URL,
	PRESENT_VALUE_CALCULATIONS_API_URL,
	EVENT_PROBABILITY_CALCULATIONS_API_URL,
	PRICE_TO_EARNINGS_RATIO_CALCULATIONS_API_URL,
] as const;

// Tanstack query keys
export const USER_QUERY_KEY = 'user' as const;
export const MARKUP_CALCULATIONS_QUERY_KEY = 'markup-calculations' as const;
export const ANNUALIZED_RETURN_CALCULATIONS_QUERY_KEY = 'annualized-return-calculations' as const;
export const BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY = 'break-even-point-calculations' as const;
export const COMPOUND_INTEREST_CALCULATIONS_QUERY_KEY = 'compound-interest-calculations' as const;
export const INVESTMENT_TIME_CALCULATIONS_QUERY_KEY = 'investment-time-calculations' as const;
export const PRESENT_VALUE_CALCULATIONS_QUERY_KEY = 'present-value-calculations' as const;
export const EVENT_PROBABILITY_CALCULATIONS_QUERY_KEY = 'event-probability-calculations' as const;
export const PRICE_TO_EARNINGS_RATIO_CALCULATIONS_QUERY_KEY =
	'price-to-earnings-ratio-calculations' as const;

export const QUERY_KEYS = [
	ANNUALIZED_RETURN_CALCULATIONS_QUERY_KEY,
	BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
	COMPOUND_INTEREST_CALCULATIONS_QUERY_KEY,
	INVESTMENT_TIME_CALCULATIONS_QUERY_KEY,
	MARKUP_CALCULATIONS_QUERY_KEY,
	PRESENT_VALUE_CALCULATIONS_QUERY_KEY,
	EVENT_PROBABILITY_CALCULATIONS_QUERY_KEY,
	PRICE_TO_EARNINGS_RATIO_CALCULATIONS_QUERY_KEY,
] as const;
