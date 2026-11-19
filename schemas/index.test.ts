import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { BASE_UNITS, formDataFromBaseUnits, fromBaseUnit, toBaseUnit } from '@/lib/units';
import {
	annualizedReturnFormDataSchema,
	breakEvenPointFormDataSchema,
	calculationNameFormDataSchema,
	calculationNameStringSchema,
	compoundInterestFormDataSchema,
	createCrosswindFormDataSchema,
	crosswindFormDataSchema,
	dividendYieldFormDataSchema,
	dollarCostAverageFormDataSchema,
	enterpriseValueFormDataSchema,
	eventProbabilityFormDataSchema,
	investmentTimeFormDataSchema,
	liquidationPriceFormDataSchema,
	markupFormDataSchema,
	presentValueFormDataSchema,
	priceToEarningsRatioFormDataSchema,
	unitPreferencesSchema,
	unitNumberFieldSchema,
	userPreferencesSchema,
} from '@/schemas';

// Expected behavior is based on what each calculator needs for a meaningful result.

const issueFields = (result: z.SafeParseReturnType<unknown, unknown>) =>
	result.success ? [] : result.error.issues.map((issue) => issue.path[0]);

const issueMessages = (result: z.SafeParseReturnType<unknown, unknown>) =>
	result.success ? [] : result.error.issues.map((issue) => issue.message);

const itRejectsMissingFields = (schema: z.ZodTypeAny, base: Record<string, unknown>) => {
	it.each(Object.keys(base))('rejects a missing %s', (field) => {
		const input = { ...base };
		delete input[field];

		const result = schema.safeParse(input);

		expect(result.success).toBe(false);
		expect(issueFields(result)).toContain(field);
	});
};

const itRejectsNegativeFields = (
	schema: z.ZodTypeAny,
	base: Record<string, unknown>,
	fields: string[]
) => {
	it.each(fields)('rejects a negative %s', (field) => {
		const result = schema.safeParse({ ...base, [field]: -1 });

		expect(result.success).toBe(false);
		expect(issueFields(result)).toContain(field);
	});
};

describe('calculationNameStringSchema', () => {
	it('accepts a normal name', () => {
		expect(calculationNameStringSchema.parse('Retirement plan')).toBe('Retirement plan');
	});

	it('trims surrounding whitespace', () => {
		expect(calculationNameStringSchema.parse('  Retirement  ')).toBe('Retirement');
	});

	it('accepts exactly 30 characters', () => {
		expect(calculationNameStringSchema.safeParse('a'.repeat(30)).success).toBe(true);
	});

	it('rejects 31 characters', () => {
		const result = calculationNameStringSchema.safeParse('a'.repeat(31));

		expect(issueMessages(result)).toEqual(['Name cannot be longer than 30 characters']);
	});

	it.each(['', '   '])('rejects the empty name %j', (name) => {
		const result = calculationNameStringSchema.safeParse(name);

		expect(issueMessages(result)).toEqual(['Name cannot be empty']);
	});

	it('rejects a missing name', () => {
		const result = calculationNameStringSchema.safeParse(undefined);

		expect(issueMessages(result)).toEqual(['Name is required']);
	});

	it('does not coerce numbers', () => {
		expect(calculationNameStringSchema.safeParse(123).success).toBe(false);
	});
});

describe('calculationNameFormDataSchema', () => {
	it('accepts and trims a name', () => {
		expect(calculationNameFormDataSchema.parse({ name: ' Plan ' })).toEqual({ name: 'Plan' });
	});

	it('rejects an empty object', () => {
		const result = calculationNameFormDataSchema.safeParse({});

		expect(issueFields(result)).toEqual(['name']);
	});
});

describe('positiveNumberFieldSchema (markup cost)', () => {
	const cost = markupFormDataSchema.shape.cost;

	it.each([
		[0, 0],
		[1.5, 1.5],
		['12.5', 12.5],
		[' 7 ', 7],
		['1e3', 1000],
		['30.416666666666666666666666666667', 30.416666666666668],
	])('accepts %j as %d', (input, expected) => {
		expect(cost.parse(input)).toBe(expected);
	});

	it.each(['', '   ', null])('coerces %j to 0', (input) => {
		expect(cost.parse(input)).toBe(0);
	});

	it.each([-0.01, '-5'])('rejects the negative value %j', (input) => {
		expect(issueMessages(cost.safeParse(input))).toEqual(['Cost cannot be negative']);
	});

	it.each(['abc', undefined])('rejects the non-number %j', (input) => {
		expect(issueMessages(cost.safeParse(input))).toEqual(['Cost has to be a number']);
	});

	// FINDING: there is no .finite(), so 'Infinity' coerces to Infinity and passes min(0)
	it('rejects Infinity', () => {
		expect(cost.safeParse('Infinity').success).toBe(false);
	});
});

describe('positiveIntegerFieldSchema (event tries)', () => {
	const eventTries = eventProbabilityFormDataSchema.shape.eventTries;

	it.each([
		[0, 0],
		[10, 10],
		['3', 3],
	])('accepts %j', (input, expected) => {
		expect(eventTries.parse(input)).toBe(expected);
	});

	it.each([1.5, '2.5', -1])('rejects %j', (input) => {
		expect(eventTries.safeParse(input).success).toBe(false);
	});
});

describe('positiveNumberFieldSchemaWithMax (present value duration)', () => {
	const duration = presentValueFormDataSchema.shape.duration;

	it.each([
		[0, 0],
		[200, 200],
		['200', 200],
	])('accepts %j', (input, expected) => {
		expect(duration.parse(input)).toBe(expected);
	});

	it('rejects values above the max', () => {
		expect(issueMessages(duration.safeParse(200.01))).toEqual([
			'Duration cannot be greater than 200',
		]);
	});

	it('rejects negative values', () => {
		expect(duration.safeParse(-1).success).toBe(false);
	});
});

describe('numberFieldSchema (earnings per share)', () => {
	const earningsPerShare = priceToEarningsRatioFormDataSchema.shape.earningsPerShare;

	it.each([
		[-5, -5],
		[0, 0],
		['-2.5', -2.5],
	])('accepts %j', (input, expected) => {
		expect(earningsPerShare.parse(input)).toBe(expected);
	});

	it.each(['abc', undefined])('rejects %j', (input) => {
		expect(issueMessages(earningsPerShare.safeParse(input))).toEqual([
			'Earnings per share has to be a number',
		]);
	});
});

describe('markupFormDataSchema', () => {
	const base = { cost: 100, salesPrice: 150 };

	it('accepts valid input', () => {
		expect(markupFormDataSchema.parse(base)).toEqual(base);
	});

	it('accepts a sales price below cost', () => {
		expect(markupFormDataSchema.safeParse({ cost: 100, salesPrice: 80 }).success).toBe(true);
	});

	it('accepts a zero cost', () => {
		expect(markupFormDataSchema.safeParse({ ...base, cost: 0 }).success).toBe(true);
	});

	it('rejects a non-numeric string', () => {
		expect(markupFormDataSchema.safeParse({ ...base, cost: 'abc' }).success).toBe(false);
	});

	itRejectsMissingFields(markupFormDataSchema, base);
	itRejectsNegativeFields(markupFormDataSchema, base, ['cost', 'salesPrice']);
});

describe('breakEvenPointFormDataSchema', () => {
	const base = { fixedCosts: 10000, variableCostPerUnit: 30, pricePerUnit: 50 };

	it('accepts valid input', () => {
		expect(breakEvenPointFormDataSchema.parse(base)).toEqual(base);
	});

	it('accepts zero fixed costs', () => {
		expect(breakEvenPointFormDataSchema.safeParse({ ...base, fixedCosts: 0 }).success).toBe(
			true
		);
	});

	itRejectsMissingFields(breakEvenPointFormDataSchema, base);
	itRejectsNegativeFields(breakEvenPointFormDataSchema, base, Object.keys(base));

	// FINDING: a price below variable cost gives a negative break-even point
	it('rejects a price below variable cost', () => {
		const result = breakEvenPointFormDataSchema.safeParse({
			...base,
			variableCostPerUnit: 60,
			pricePerUnit: 50,
		});

		expect(result.success).toBe(false);
	});

	// FINDING: a price equal to variable cost divides by zero (Infinity units)
	it('rejects a price equal to variable cost', () => {
		const result = breakEvenPointFormDataSchema.safeParse({
			...base,
			variableCostPerUnit: 50,
			pricePerUnit: 50,
		});

		expect(result.success).toBe(false);
	});

	// FINDING: a zero price and zero variable cost give NaN
	it('rejects a zero price', () => {
		const result = breakEvenPointFormDataSchema.safeParse({
			...base,
			variableCostPerUnit: 0,
			pricePerUnit: 0,
		});

		expect(result.success).toBe(false);
	});
});

describe('investmentTimeFormDataSchema', () => {
	const base = { startingBalance: 1000, endingBalance: 2000, annualInterestRate: 7 };

	it('accepts valid input', () => {
		expect(investmentTimeFormDataSchema.parse(base)).toEqual(base);
	});

	it('rejects equal starting and ending values on both fields', () => {
		const result = investmentTimeFormDataSchema.safeParse({
			...base,
			startingBalance: 2000,
		});

		expect(issueFields(result)).toEqual(['endingBalance', 'startingBalance']);
	});

	it('rejects a starting value above the ending value', () => {
		const result = investmentTimeFormDataSchema.safeParse({
			...base,
			startingBalance: 3000,
		});

		expect(result.success).toBe(false);
	});

	it.each([
		['startingBalance', 0],
		['endingBalance', 0],
		['annualInterestRate', 0],
	])('accepts a zero %s', (field, value) => {
		expect(investmentTimeFormDataSchema.safeParse({ ...base, [field]: value }).success).toBe(
			true
		);
	});

	itRejectsMissingFields(investmentTimeFormDataSchema, base);
	itRejectsNegativeFields(investmentTimeFormDataSchema, base, Object.keys(base));
});

describe('presentValueFormDataSchema', () => {
	const base = { startingBalance: 10000, duration: 10, durationMultiplier: 12, discountRate: 5 };

	it('accepts valid input', () => {
		expect(presentValueFormDataSchema.parse(base)).toEqual(base);
	});

	it.each([
		['duration', 0],
		['discountRate', 0],
	])('accepts a zero %s', (field, value) => {
		expect(presentValueFormDataSchema.safeParse({ ...base, [field]: value }).success).toBe(
			true
		);
	});

	it('coerces the duration multiplier from a select value', () => {
		expect(presentValueFormDataSchema.parse({ ...base, durationMultiplier: '3' })).toEqual({
			...base,
			durationMultiplier: 3,
		});
	});

	it('rejects a duration above 200', () => {
		expect(presentValueFormDataSchema.safeParse({ ...base, duration: 201 }).success).toBe(
			false
		);
	});

	itRejectsMissingFields(presentValueFormDataSchema, base);
	itRejectsNegativeFields(presentValueFormDataSchema, base, Object.keys(base));
});

describe('annualizedReturnFormDataSchema', () => {
	const base = {
		startingBalance: 1000,
		endingBalance: 2000,
		duration: 5,
		durationMultiplier: 12,
	};

	it('accepts valid input', () => {
		expect(annualizedReturnFormDataSchema.parse(base)).toEqual(base);
	});

	it('accepts a zero ending value', () => {
		expect(
			annualizedReturnFormDataSchema.safeParse({ ...base, endingBalance: 0 }).success
		).toBe(true);
	});

	it('rejects a duration above 200', () => {
		expect(annualizedReturnFormDataSchema.safeParse({ ...base, duration: 201 }).success).toBe(
			false
		);
	});

	itRejectsMissingFields(annualizedReturnFormDataSchema, base);
	itRejectsNegativeFields(annualizedReturnFormDataSchema, base, Object.keys(base));

	// FINDING: a zero starting value divides by zero (Infinity return)
	it('rejects a zero starting value', () => {
		expect(
			annualizedReturnFormDataSchema.safeParse({ ...base, startingBalance: 0 }).success
		).toBe(false);
	});

	// FINDING: a zero duration makes the exponent 1/0
	it('rejects a zero duration', () => {
		expect(annualizedReturnFormDataSchema.safeParse({ ...base, duration: 0 }).success).toBe(
			false
		);
	});

	// FINDING: a zero duration multiplier makes the exponent 1/0
	it('rejects a zero duration multiplier', () => {
		expect(
			annualizedReturnFormDataSchema.safeParse({ ...base, durationMultiplier: 0 }).success
		).toBe(false);
	});
});

describe('compoundInterestFormDataSchema', () => {
	const base = {
		startingBalance: 1000,
		contribution: 100,
		contributionMultiplier: 1,
		contributionFrequency: 12,
		interestRate: 7,
		compoundFrequency: 12,
		duration: 10,
		durationMultiplier: 12,
	};

	it('accepts valid input', () => {
		expect(compoundInterestFormDataSchema.parse(base)).toEqual(base);
	});

	it.each([-1, '-1'])('accepts the withdraw multiplier %j', (contributionMultiplier) => {
		expect(
			compoundInterestFormDataSchema.parse({ ...base, contributionMultiplier })
				.contributionMultiplier
		).toBe(-1);
	});

	it.each([0, 2, -2])('rejects the contribution multiplier %j', (contributionMultiplier) => {
		const result = compoundInterestFormDataSchema.safeParse({
			...base,
			contributionMultiplier,
		});

		expect(issueMessages(result)).toEqual(['Contribution multiplier must be either -1 or 1']);
	});

	// FINDING: only 0 is excluded inside [-1, 1], so fractions pass despite the error message
	it.each([0.5, -0.5])('rejects the contribution multiplier %j', (contributionMultiplier) => {
		const result = compoundInterestFormDataSchema.safeParse({
			...base,
			contributionMultiplier,
		});

		expect(result.success).toBe(false);
	});

	it.each([
		['contributionFrequency', 0],
		['interestRate', 0],
		['duration', 0],
	])('accepts a zero %s', (field, value) => {
		expect(compoundInterestFormDataSchema.safeParse({ ...base, [field]: value }).success).toBe(
			true
		);
	});

	it('rejects a duration above 200', () => {
		expect(compoundInterestFormDataSchema.safeParse({ ...base, duration: 201 }).success).toBe(
			false
		);
	});

	itRejectsMissingFields(compoundInterestFormDataSchema, base);
	itRejectsNegativeFields(
		compoundInterestFormDataSchema,
		base,
		Object.keys(base).filter((field) => field !== 'contributionMultiplier')
	);

	// FINDING: a zero compound frequency divides the rate by zero
	it('rejects a zero compound frequency', () => {
		expect(
			compoundInterestFormDataSchema.safeParse({ ...base, compoundFrequency: 0 }).success
		).toBe(false);
	});
});

describe('eventProbabilityFormDataSchema', () => {
	const base = { eventProbabilityPercent: 50, eventTries: 10 };

	it('accepts valid input', () => {
		expect(eventProbabilityFormDataSchema.parse(base)).toEqual(base);
	});

	it.each([0, 100])('accepts a %d% probability', (eventProbabilityPercent) => {
		expect(
			eventProbabilityFormDataSchema.safeParse({ ...base, eventProbabilityPercent }).success
		).toBe(true);
	});

	it('rejects a probability above 100%', () => {
		const result = eventProbabilityFormDataSchema.safeParse({
			...base,
			eventProbabilityPercent: 100.01,
		});

		expect(issueMessages(result)).toEqual(['Event probability cannot be greater than 100']);
	});

	it('accepts zero tries', () => {
		expect(eventProbabilityFormDataSchema.safeParse({ ...base, eventTries: 0 }).success).toBe(
			true
		);
	});

	it('rejects fractional tries', () => {
		expect(eventProbabilityFormDataSchema.safeParse({ ...base, eventTries: 1.5 }).success).toBe(
			false
		);
	});

	itRejectsMissingFields(eventProbabilityFormDataSchema, base);
	itRejectsNegativeFields(eventProbabilityFormDataSchema, base, Object.keys(base));
});

describe('priceToEarningsRatioFormDataSchema', () => {
	const base = { sharePrice: 100, earningsPerShare: 5 };

	it('accepts valid input', () => {
		expect(priceToEarningsRatioFormDataSchema.parse(base)).toEqual(base);
	});

	it.each([-5, 0])('accepts earnings per share of %d', (earningsPerShare) => {
		expect(
			priceToEarningsRatioFormDataSchema.safeParse({ ...base, earningsPerShare }).success
		).toBe(true);
	});

	it('rejects a non-numeric share price', () => {
		expect(
			priceToEarningsRatioFormDataSchema.safeParse({ ...base, sharePrice: 'abc' }).success
		).toBe(false);
	});

	itRejectsMissingFields(priceToEarningsRatioFormDataSchema, base);
	itRejectsNegativeFields(priceToEarningsRatioFormDataSchema, base, ['sharePrice']);
});

describe('dollarCostAverageFormDataSchema', () => {
	const base = {
		initialInvestment: 1000,
		sharePrice: 100,
		deposit: 100,
		depositFrequency: 30.416666666666668,
		interestRate: 10,
		compoundFrequency: 12,
		duration: 1,
		durationMultiplier: 12,
	};

	it('accepts valid input', () => {
		expect(dollarCostAverageFormDataSchema.parse(base)).toEqual(base);
	});

	it('coerces the monthly deposit frequency from a select value', () => {
		const result = dollarCostAverageFormDataSchema.parse({
			...base,
			depositFrequency: '30.416666666666666666666666666667',
		});

		expect(result.depositFrequency).toBe(30.416666666666668);
	});

	it.each([
		['deposit', 0],
		['interestRate', 0],
		['duration', 0],
	])('accepts a zero %s', (field, value) => {
		expect(dollarCostAverageFormDataSchema.safeParse({ ...base, [field]: value }).success).toBe(
			true
		);
	});

	itRejectsMissingFields(dollarCostAverageFormDataSchema, base);
	itRejectsNegativeFields(dollarCostAverageFormDataSchema, base, Object.keys(base));

	// FINDING: a zero deposit frequency makes the deposit count Infinity and hangs the browser
	it('rejects a zero deposit frequency', () => {
		expect(
			dollarCostAverageFormDataSchema.safeParse({ ...base, depositFrequency: 0 }).success
		).toBe(false);
	});

	// FINDING: a zero share price divides by zero (Infinity shares, NaN results)
	it('rejects a zero share price', () => {
		expect(dollarCostAverageFormDataSchema.safeParse({ ...base, sharePrice: 0 }).success).toBe(
			false
		);
	});

	// FINDING: a zero compound frequency silently ignores the price growth
	it('rejects a zero compound frequency', () => {
		expect(
			dollarCostAverageFormDataSchema.safeParse({ ...base, compoundFrequency: 0 }).success
		).toBe(false);
	});

	// FINDING: unlike the other calculators, the duration has no max of 200
	it('rejects a duration above 200', () => {
		expect(dollarCostAverageFormDataSchema.safeParse({ ...base, duration: 201 }).success).toBe(
			false
		);
	});
});

describe('enterpriseValueFormDataSchema', () => {
	const base = { sharePrice: 50, sharesOutstanding: 1000000, cash: 1000000, debt: 2000000 };

	it('accepts valid input', () => {
		expect(enterpriseValueFormDataSchema.parse(base)).toEqual(base);
	});

	it('accepts all zeros', () => {
		const zeros = { sharePrice: 0, sharesOutstanding: 0, cash: 0, debt: 0 };

		expect(enterpriseValueFormDataSchema.safeParse(zeros).success).toBe(true);
	});

	it('accepts cash larger than market cap plus debt', () => {
		expect(enterpriseValueFormDataSchema.safeParse({ ...base, cash: 1e9 }).success).toBe(true);
	});

	it('coerces shares outstanding from a string', () => {
		expect(
			enterpriseValueFormDataSchema.parse({ ...base, sharesOutstanding: '1000' })
				.sharesOutstanding
		).toBe(1000);
	});

	it('rejects fractional shares outstanding', () => {
		expect(
			enterpriseValueFormDataSchema.safeParse({ ...base, sharesOutstanding: 1.5 }).success
		).toBe(false);
	});

	itRejectsMissingFields(enterpriseValueFormDataSchema, base);
	itRejectsNegativeFields(enterpriseValueFormDataSchema, base, Object.keys(base));
});

describe('liquidationPriceFormDataSchema', () => {
	const base = { entryPrice: 100, leverageRatio: 10 };

	it('accepts valid input', () => {
		expect(liquidationPriceFormDataSchema.parse(base)).toEqual(base);
	});

	it.each([1, 125])('accepts a leverage of %d', (leverageRatio) => {
		expect(liquidationPriceFormDataSchema.safeParse({ ...base, leverageRatio }).success).toBe(
			true
		);
	});

	itRejectsMissingFields(liquidationPriceFormDataSchema, base);
	itRejectsNegativeFields(liquidationPriceFormDataSchema, base, Object.keys(base));

	// FINDING: a zero leverage divides by zero (-Infinity liquidation price)
	it('rejects a zero leverage', () => {
		expect(
			liquidationPriceFormDataSchema.safeParse({ ...base, leverageRatio: 0 }).success
		).toBe(false);
	});

	// FINDING: a leverage below 1 gives a negative liquidation price
	it('rejects a leverage below 1', () => {
		expect(
			liquidationPriceFormDataSchema.safeParse({ ...base, leverageRatio: 0.5 }).success
		).toBe(false);
	});

	// FINDING: a zero entry price gives a NaN price change percent
	it('rejects a zero entry price', () => {
		expect(liquidationPriceFormDataSchema.safeParse({ ...base, entryPrice: 0 }).success).toBe(
			false
		);
	});
});

describe('dividendYieldFormDataSchema', () => {
	const base = { dividendAmount: 0.5, distributionFrequency: 4, sharePrice: 50 };

	it('accepts valid input', () => {
		expect(dividendYieldFormDataSchema.parse(base)).toEqual(base);
	});

	it.each([
		['dividendAmount', 0],
		['distributionFrequency', 0],
	])('accepts a zero %s', (field, value) => {
		expect(dividendYieldFormDataSchema.safeParse({ ...base, [field]: value }).success).toBe(
			true
		);
	});

	it('coerces the distribution frequency from a select value', () => {
		expect(
			dividendYieldFormDataSchema.parse({ ...base, distributionFrequency: '12' })
				.distributionFrequency
		).toBe(12);
	});

	itRejectsMissingFields(dividendYieldFormDataSchema, base);
	itRejectsNegativeFields(dividendYieldFormDataSchema, base, Object.keys(base));

	// FINDING: a zero share price divides by zero (Infinity or NaN yield)
	it('rejects a zero share price', () => {
		expect(dividendYieldFormDataSchema.safeParse({ ...base, sharePrice: 0 }).success).toBe(
			false
		);
	});
});

describe('crosswindFormDataSchema', () => {
	const base = { runwayHeading: 60, windDirection: 90, windSpeed: 20 };
	const withGust = { ...base, gustSpeed: 30 };

	it('accepts valid input', () => {
		expect(crosswindFormDataSchema.parse(base)).toEqual(base);
		expect(crosswindFormDataSchema.parse(withGust)).toEqual(withGust);
	});

	itRejectsMissingFields(crosswindFormDataSchema, base);
	itRejectsNegativeFields(crosswindFormDataSchema, withGust, Object.keys(withGust));

	it.each([undefined, '', null])('treats a gust of %j as no gust', (gustSpeed) => {
		const result = crosswindFormDataSchema.safeParse({ ...base, gustSpeed });

		expect(result.success).toBe(true);
		expect(result.success && result.data.gustSpeed).toBeUndefined();
	});

	it.each(['runwayHeading', 'windDirection'])('accepts %s of 1 and 360', (field) => {
		expect(crosswindFormDataSchema.safeParse({ ...base, [field]: 1 }).success).toBe(true);
		expect(crosswindFormDataSchema.safeParse({ ...base, [field]: 360 }).success).toBe(true);
		expect(crosswindFormDataSchema.safeParse({ ...base, [field]: 87.5 }).success).toBe(true);
	});

	it.each([
		['runwayHeading', 'Runway heading'],
		['windDirection', 'Wind direction'],
	])('rejects %s of 0 and 360.1', (field, label) => {
		for (const value of [0, 360.1]) {
			const result = crosswindFormDataSchema.safeParse({ ...base, [field]: value });

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)).toEqual([`${label} must be between 1 and 360`]);
		}
	});

	it('accepts a wind speed of 0 and 200 kt and rejects 200.1 kt', () => {
		expect(crosswindFormDataSchema.safeParse({ ...base, windSpeed: 0 }).success).toBe(true);
		expect(crosswindFormDataSchema.safeParse({ ...base, windSpeed: 200 }).success).toBe(true);

		const result = crosswindFormDataSchema.safeParse({ ...base, windSpeed: 200.1 });

		expect(issueFields(result)).toEqual(['windSpeed']);
		expect(issueMessages(result)).toEqual(['Wind speed cannot be greater than 200.00 kt']);
	});

	it.each([20, 15])('rejects a gust of %d kt with a 20 kt wind', (gustSpeed) => {
		const result = crosswindFormDataSchema.safeParse({ ...base, gustSpeed });

		expect(issueFields(result)).toEqual(['gustSpeed']);
		expect(issueMessages(result)).toEqual(['Gust speed must be greater than wind speed']);
	});

	it('accepts a gust of 200 kt and rejects a gust above 200 kt', () => {
		expect(crosswindFormDataSchema.safeParse({ ...base, gustSpeed: 200 }).success).toBe(true);

		const result = crosswindFormDataSchema.safeParse({ ...base, gustSpeed: 200.1 });

		expect(issueFields(result)).toContain('gustSpeed');
		expect(issueMessages(result)).toContain('Gust speed cannot be greater than 200.00 kt');
	});

	it('coerces numeric strings', () => {
		expect(
			crosswindFormDataSchema.parse({
				runwayHeading: '087',
				windDirection: '120',
				windSpeed: '12.5',
				gustSpeed: '25',
			})
		).toEqual({ runwayHeading: 87, windDirection: 120, windSpeed: 12.5, gustSpeed: 25 });
	});

	it('checks speed limits in base units and shows them in km/h', () => {
		const schema = createCrosswindFormDataSchema({ ...BASE_UNITS, speed: 'kmh' });

		// 200 kt × 1.852 = 370.4 km/h
		expect(schema.safeParse({ ...base, windSpeed: 370.4 }).success).toBe(true);

		const result = schema.safeParse({ ...base, windSpeed: 371 });

		expect(issueFields(result)).toEqual(['windSpeed']);
		expect(issueMessages(result)).toEqual(['Wind speed cannot be greater than 370.40 km/h']);
	});
});

describe('unitPreferencesSchema', () => {
	const base = { speed: 'kmh', altitude: 'm', temperature: 'f' };

	it('accepts valid input', () => {
		expect(unitPreferencesSchema.parse(base)).toEqual(base);
	});

	it('rejects an unknown unit', () => {
		const result = unitPreferencesSchema.safeParse({ ...base, speed: 'furlongs' });

		expect(issueFields(result)).toEqual(['speed']);
		expect(issueMessages(result)).toEqual(['Invalid speed unit']);
	});

	itRejectsMissingFields(unitPreferencesSchema, base);
});

describe('userPreferencesSchema', () => {
	const base = {
		theme: 'dark',
		currency: 'eur',
		units: { speed: 'kt', altitude: 'ft', temperature: 'c' },
	};

	it('accepts valid input', () => {
		expect(userPreferencesSchema.parse(base)).toEqual(base);
	});

	it('drops unknown keys', () => {
		expect(userPreferencesSchema.parse({ ...base, isAdmin: true })).toEqual(base);
	});

	it('rejects missing units', () => {
		const result = userPreferencesSchema.safeParse({ theme: 'dark', currency: 'eur' });

		expect(issueMessages(result)).toEqual(['Unit preferences are required']);
	});

	it('rejects an unknown unit value', () => {
		const result = userPreferencesSchema.safeParse({
			...base,
			units: { ...base.units, temperature: 'k' },
		});

		expect(issueMessages(result)).toEqual(['Invalid temperature unit']);
	});

	it('rejects an unknown currency', () => {
		const result = userPreferencesSchema.safeParse({ ...base, currency: 'btc' });

		expect(issueMessages(result)).toEqual(['Invalid currency']);
	});

	it('rejects an unknown theme', () => {
		const result = userPreferencesSchema.safeParse({ ...base, theme: 'neon' });

		expect(issueMessages(result)).toEqual(['Invalid theme']);
	});
});

// Speed limits in kt: 200 kt = 370.4 km/h (1 NM = 1852 m) ≈ 230.1558 mph (1 mi = 1609.344 m).
describe('unitNumberFieldSchema', () => {
	const windSpeed = (unit: string) =>
		unitNumberFieldSchema('Wind speed', 'speed', unit, { min: 0, max: 200 });

	it('accepts values within the limits in base units', () => {
		expect(windSpeed('kt').parse(200)).toBe(200);
		expect(windSpeed('kt').parse(0)).toBe(0);
	});

	it('accepts the limit in a non-base unit', () => {
		expect(windSpeed('kmh').parse(370.4)).toBe(370.4);
	});

	it('rejects values above the limit with the limit in the user unit', () => {
		const result = windSpeed('kmh').safeParse(370.5);

		expect(result.success).toBe(false);
		expect(issueMessages(result)).toEqual(['Wind speed cannot be greater than 370.40 km/h']);
	});

	it('rounds a shown maximum down in the user unit', () => {
		// 230.16 mph ≈ 200.0004 kt is above the limit, so the shown limit is 230.15 mph.
		expect(issueMessages(windSpeed('mph').safeParse(230.16))).toEqual([
			'Wind speed cannot be greater than 230.15 mph',
		]);
	});

	it('accepts the shown maximum in the user unit and in base units', () => {
		expect(windSpeed('mph').safeParse(230.15).success).toBe(true);
		expect(windSpeed('kt').safeParse(toBaseUnit(230.15, 'speed', 'mph')).success).toBe(true);
	});

	it('accepts a value saved at the limit after converting it to the user unit', () => {
		expect(windSpeed('mph').safeParse(fromBaseUnit(200, 'speed', 'mph')).success).toBe(true);

		const { windSpeed: imported } = formDataFromBaseUnits(
			{ windSpeed: 200 },
			{ windSpeed: 'speed' },
			{ ...BASE_UNITS, speed: 'mph' }
		);

		expect(windSpeed('mph').safeParse(imported).success).toBe(true);
	});

	it('rounds a shown minimum up in the user unit', () => {
		// 15 kt ≈ 17.2617 mph, so the shown minimum is 17.27 mph.
		const trueAirspeed = unitNumberFieldSchema('True airspeed', 'speed', 'mph', { min: 15 });

		expect(issueMessages(trueAirspeed.safeParse(17.26))).toEqual([
			'True airspeed cannot be lower than 17.27 mph',
		]);
		expect(trueAirspeed.safeParse(17.27).success).toBe(true);
	});

	it('rejects values below an inclusive minimum', () => {
		// -60 °C = -76 °F
		const temperature = unitNumberFieldSchema('Temperature', 'temperature', 'f', { min: -60 });

		expect(temperature.parse(-76)).toBe(-76);
		expect(issueMessages(temperature.safeParse(-76.1))).toEqual([
			'Temperature cannot be lower than -76.00 °F',
		]);
	});

	it('rejects the minimum when it is exclusive', () => {
		const trueAirspeed = unitNumberFieldSchema('True airspeed', 'speed', 'kt', {
			min: 0,
			minExclusive: true,
		});

		expect(trueAirspeed.parse(0.1)).toBe(0.1);
		expect(issueMessages(trueAirspeed.safeParse(0))).toEqual([
			'True airspeed must be greater than 0.00 kt',
		]);
	});

	it('coerces numeric strings', () => {
		expect(windSpeed('kmh').parse('18.52')).toBe(18.52);
	});

	it('keeps the number field messages', () => {
		expect(issueMessages(windSpeed('kt').safeParse('abc'))).toEqual([
			'Wind speed has to be a number',
		]);
	});
});
