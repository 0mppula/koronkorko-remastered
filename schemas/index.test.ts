import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { BASE_UNITS, formDataFromBaseUnits, fromBaseUnit, toBaseUnit } from '@/lib/units';
import { getFuelUnitContext } from '@/lib/utils';
import {
	annualizedReturnFormDataSchema,
	breakEvenPointFormDataSchema,
	calculationNameFormDataSchema,
	calculationNameStringSchema,
	cloudBaseFormDataSchema,
	compoundInterestFormDataSchema,
	createCloudBaseFormDataSchema,
	createCrosswindFormDataSchema,
	createDensityAltitudeFormDataSchema,
	createFuelPlanningFormDataSchema,
	createGlideDistanceFormDataSchema,
	createTimeSpeedDistanceFormDataSchema,
	createTrueAirspeedFormDataSchema,
	createTurnPerformanceFormDataSchema,
	createWindTriangleFormDataSchema,
	crosswindFormDataSchema,
	densityAltitudeFormDataSchema,
	dividendYieldFormDataSchema,
	dollarCostAverageFormDataSchema,
	enterpriseValueFormDataSchema,
	eventProbabilityFormDataSchema,
	fuelPlanningFormDataSchema,
	glideDistanceFormDataSchema,
	headingFormDataSchema,
	investmentTimeFormDataSchema,
	liquidationPriceFormDataSchema,
	markupFormDataSchema,
	presentValueFormDataSchema,
	priceToEarningsRatioFormDataSchema,
	timeSpeedDistanceFormDataSchema,
	trueAirspeedFormDataSchema,
	turnPerformanceFormDataSchema,
	unitPreferencesSchema,
	unitNumberFieldSchema,
	userPreferencesSchema,
	windTriangleFormDataSchema,
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

	// The input shows 230.16 mph, which is above 200 kt; the form holds the unrounded value.
	it('accepts the form value of a 200 kt wind in mph', () => {
		const units = { ...BASE_UNITS, speed: 'mph' } as const;
		const formData = formDataFromBaseUnits(
			{ ...base, windSpeed: 200 },
			{ windSpeed: 'speed' },
			units
		);

		expect(createCrosswindFormDataSchema(units).safeParse(formData).success).toBe(true);
		expect(
			createCrosswindFormDataSchema(units).safeParse({ ...base, windSpeed: 230.16 }).success
		).toBe(false);
	});
});

describe('windTriangleFormDataSchema', () => {
	const base = { trueCourse: 90, trueAirspeed: 100, windDirection: 45, windSpeed: 20 };
	const CROSSWIND_MESSAGE =
		"The wind's crosswind component exceeds the true airspeed, so this course can't be flown";
	const WIND_MESSAGE = 'The wind is too strong: groundspeed would be zero or negative';

	it('accepts valid input', () => {
		expect(windTriangleFormDataSchema.parse(base)).toEqual(base);
	});

	itRejectsMissingFields(windTriangleFormDataSchema, base);
	itRejectsNegativeFields(windTriangleFormDataSchema, base, Object.keys(base));

	it.each(['trueCourse', 'windDirection'])('accepts %s of 1 and 360', (field) => {
		expect(windTriangleFormDataSchema.safeParse({ ...base, [field]: 1 }).success).toBe(true);
		expect(windTriangleFormDataSchema.safeParse({ ...base, [field]: 360 }).success).toBe(true);
	});

	it.each([
		['trueCourse', 'True course'],
		['windDirection', 'Wind direction'],
	])('rejects %s of 0 and 360.1', (field, label) => {
		for (const value of [0, 360.1]) {
			const result = windTriangleFormDataSchema.safeParse({ ...base, [field]: value });

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)).toEqual([`${label} must be between 1 and 360`]);
		}
	});

	it('rejects a TAS of 0 with only the TAS message', () => {
		const result = windTriangleFormDataSchema.safeParse({ ...base, trueAirspeed: 0 });

		expect(issueFields(result)).toEqual(['trueAirspeed']);
		expect(issueMessages(result)).toEqual(['True airspeed must be greater than 0.00 kt']);
	});

	it('accepts a TAS of 600 kt and rejects 600.1 kt', () => {
		expect(windTriangleFormDataSchema.safeParse({ ...base, trueAirspeed: 600 }).success).toBe(
			true
		);

		const result = windTriangleFormDataSchema.safeParse({ ...base, trueAirspeed: 600.1 });

		expect(issueFields(result)).toEqual(['trueAirspeed']);
		expect(issueMessages(result)).toEqual(['True airspeed cannot be greater than 600.00 kt']);
	});

	it('accepts a wind speed of 0 and 200 kt and rejects 200.1 kt', () => {
		const fast = { ...base, trueAirspeed: 600 };

		expect(windTriangleFormDataSchema.safeParse({ ...base, windSpeed: 0 }).success).toBe(true);
		expect(windTriangleFormDataSchema.safeParse({ ...fast, windSpeed: 200 }).success).toBe(
			true
		);

		const result = windTriangleFormDataSchema.safeParse({ ...fast, windSpeed: 200.1 });

		expect(issueFields(result)).toEqual(['windSpeed']);
		expect(issueMessages(result)).toEqual(['Wind speed cannot be greater than 200.00 kt']);
	});

	it('coerces numeric strings', () => {
		expect(
			windTriangleFormDataSchema.parse({
				trueCourse: '090',
				trueAirspeed: '100',
				windDirection: '045',
				windSpeed: '20.5',
			})
		).toEqual({ trueCourse: 90, trueAirspeed: 100, windDirection: 45, windSpeed: 20.5 });
	});

	// sin 90° = 1, so the crosswind component is the full wind speed.
	it('rejects a crosswind component above the TAS on windSpeed', () => {
		const result = windTriangleFormDataSchema.safeParse({
			trueCourse: 360,
			trueAirspeed: 100,
			windDirection: 90,
			windSpeed: 150,
		});

		expect(issueFields(result)).toEqual(['windSpeed']);
		expect(issueMessages(result)).toEqual([CROSSWIND_MESSAGE]);
	});

	it.each([
		{ case: 'a headwind equal to the TAS', tc: 90, wd: 90, ws: 100 },
		{ case: 'a headwind above the TAS', tc: 90, wd: 90, ws: 120 },
		{ case: 'a pure crosswind equal to the TAS', tc: 360, wd: 90, ws: 100 },
	])('rejects $case (groundspeed ≤ 0) on windSpeed', ({ tc, wd, ws }) => {
		const result = windTriangleFormDataSchema.safeParse({
			trueCourse: tc,
			trueAirspeed: 100,
			windDirection: wd,
			windSpeed: ws,
		});

		expect(issueFields(result)).toEqual(['windSpeed']);
		expect(issueMessages(result)).toEqual([WIND_MESSAGE]);
	});

	// GS = 0 + 100·cos 45° > 0: heading at 90° to the course, carried along by the tailwind.
	it('accepts a crosswind component equal to the TAS with a tailwind', () => {
		const result = windTriangleFormDataSchema.safeParse({
			trueCourse: 360,
			trueAirspeed: 100 * Math.SQRT1_2,
			windDirection: 135,
			windSpeed: 100,
		});

		expect(result.success).toBe(true);
	});

	describe('in km/h', () => {
		const schema = createWindTriangleFormDataSchema({ ...BASE_UNITS, speed: 'kmh' });
		// 100 kt = 185.2 km/h, 20 kt = 37.04 km/h
		const kmhBase = { ...base, trueAirspeed: 185.2, windSpeed: 37.04 };

		it('accepts valid input', () => {
			expect(schema.safeParse(kmhBase).success).toBe(true);
		});

		it('checks the limits in base units and shows them in km/h', () => {
			// 600 kt = 1111.2 km/h, 200 kt = 370.4 km/h
			expect(schema.safeParse({ ...kmhBase, trueAirspeed: 1111.2 }).success).toBe(true);
			expect(issueMessages(schema.safeParse({ ...kmhBase, trueAirspeed: 0 }))).toEqual([
				'True airspeed must be greater than 0.00 km/h',
			]);
			expect(issueMessages(schema.safeParse({ ...kmhBase, trueAirspeed: 1112 }))).toEqual([
				'True airspeed cannot be greater than 1,111.20 km/h',
			]);

			const fast = { ...kmhBase, trueAirspeed: 1111.2 };

			expect(schema.safeParse({ ...fast, windSpeed: 370.4 }).success).toBe(true);
			expect(issueMessages(schema.safeParse({ ...fast, windSpeed: 371 }))).toEqual([
				'Wind speed cannot be greater than 370.40 km/h',
			]);
		});

		it('rejects unsolvable winds with the same messages', () => {
			const crosswind = schema.safeParse({
				trueCourse: 360,
				trueAirspeed: 185.2,
				windDirection: 90,
				windSpeed: 277.8,
			});
			const headwind = schema.safeParse({
				trueCourse: 90,
				trueAirspeed: 185.2,
				windDirection: 90,
				windSpeed: 185.2,
			});

			expect(issueMessages(crosswind)).toEqual([CROSSWIND_MESSAGE]);
			expect(issueMessages(headwind)).toEqual([WIND_MESSAGE]);
		});
	});
});

describe('densityAltitudeFormDataSchema', () => {
	const base = { fieldElevation: 5000, qnh: 1013.25, outsideAirTemperature: 30 };

	it('accepts valid input', () => {
		expect(densityAltitudeFormDataSchema.parse(base)).toEqual(base);
	});

	itRejectsMissingFields(densityAltitudeFormDataSchema, base);

	it('accepts a negative elevation and temperature', () => {
		const input = { fieldElevation: -1200, qnh: 1020, outsideAirTemperature: -25.5 };

		expect(densityAltitudeFormDataSchema.parse(input)).toEqual(input);
	});

	it.each([
		['fieldElevation', -1500, -1500.1, 'Field elevation cannot be lower than -1,500 ft'],
		['qnh', 900, 899.99, 'QNH cannot be lower than 900.00 hPa'],
		[
			'outsideAirTemperature',
			-60,
			-60.01,
			'Outside air temperature cannot be lower than -60.00 °C',
		],
		['fieldElevation', 20000, 20000.1, 'Field elevation cannot be greater than 20,000 ft'],
		['qnh', 1100, 1100.01, 'QNH cannot be greater than 1100.00 hPa'],
		[
			'outsideAirTemperature',
			60,
			60.01,
			'Outside air temperature cannot be greater than 60.00 °C',
		],
	])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
		expect(densityAltitudeFormDataSchema.safeParse({ ...base, [field]: limit }).success).toBe(
			true
		);

		const result = densityAltitudeFormDataSchema.safeParse({ ...base, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	it('coerces numeric strings', () => {
		expect(
			densityAltitudeFormDataSchema.parse({
				fieldElevation: '-500',
				qnh: '1013.25',
				outsideAirTemperature: '-5',
			})
		).toEqual({ fieldElevation: -500, qnh: 1013.25, outsideAirTemperature: -5 });
	});

	describe('in m, inHg and °F', () => {
		const units = { ...BASE_UNITS, altitude: 'm', pressure: 'inhg', temperature: 'f' } as const;
		const schema = createDensityAltitudeFormDataSchema(units);
		// 1524 m = 5000 ft, 29.92 inHg ≈ 1013.21 hPa, 86 °F = 30 °C
		const userBase = { fieldElevation: 1524, qnh: 29.92, outsideAirTemperature: 86 };

		it('accepts valid input', () => {
			expect(schema.safeParse(userBase).success).toBe(true);
		});

		// −1500 ft = −457.2 m, 20000 ft = 6096 m, 900 hPa ≈ 26.577 inHg, 1100 hPa ≈ 32.483 inHg,
		// −60 °C = −76 °F, 60 °C = 140 °F. Shown limits are rounded inwards.
		it.each([
			['fieldElevation', -457, -458, 'Field elevation cannot be lower than -457 m'],
			['fieldElevation', 6096, 6097, 'Field elevation cannot be greater than 6,096 m'],
			['qnh', 26.58, 26.57, 'QNH cannot be lower than 26.58 inHg'],
			['qnh', 32.48, 32.49, 'QNH cannot be greater than 32.48 inHg'],
			[
				'outsideAirTemperature',
				-76,
				-76.1,
				'Outside air temperature cannot be lower than -76.00 °F',
			],
			[
				'outsideAirTemperature',
				140,
				140.1,
				'Outside air temperature cannot be greater than 140.00 °F',
			],
		])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
			expect(schema.safeParse({ ...userBase, [field]: limit }).success).toBe(true);

			const result = schema.safeParse({ ...userBase, [field]: beyond });

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)).toEqual([message]);
		});

		it('accepts the form values of the limits set from base units', () => {
			for (const baseValues of [
				{ fieldElevation: -1500, qnh: 900, outsideAirTemperature: -60 },
				{ fieldElevation: 20000, qnh: 1100, outsideAirTemperature: 60 },
			]) {
				const formData = formDataFromBaseUnits(
					baseValues,
					{
						fieldElevation: 'altitude',
						qnh: 'pressure',
						outsideAirTemperature: 'temperature',
					},
					units
				);

				expect(schema.safeParse(formData).success).toBe(true);
			}
		});
	});
});

describe('createFuelPlanningFormDataSchema', () => {
	const base = { fuelBurnRate: 30, flightTime: 60, reserveTime: 30, fuelType: 'avgas' };
	const schemaIn = (fuel: 'l' | 'usgal' | 'kg' | 'lb') =>
		createFuelPlanningFormDataSchema({ ...BASE_UNITS, fuel });

	it('accepts valid input', () => {
		expect(fuelPlanningFormDataSchema.parse({ ...base, taxiFuel: 5, extraFuel: 10 })).toEqual({
			...base,
			taxiFuel: 5,
			extraFuel: 10,
		});
	});

	itRejectsMissingFields(fuelPlanningFormDataSchema, base);

	it('treats missing, empty and null taxi and extra fuel as none', () => {
		for (const value of [undefined, '', null]) {
			const result = fuelPlanningFormDataSchema.parse({
				...base,
				taxiFuel: value,
				extraFuel: value,
			});

			expect(result.taxiFuel).toBeUndefined();
			expect(result.extraFuel).toBeUndefined();
		}
	});

	it('accepts zero taxi and extra fuel', () => {
		expect(
			fuelPlanningFormDataSchema.parse({ ...base, taxiFuel: 0, extraFuel: 0 })
		).toMatchObject({ taxiFuel: 0, extraFuel: 0 });
	});

	itRejectsNegativeFields(fuelPlanningFormDataSchema, { ...base, taxiFuel: 0, extraFuel: 0 }, [
		'flightTime',
		'reserveTime',
		'taxiFuel',
		'extraFuel',
	]);

	it('shows the negative fuel message', () => {
		expect(
			issueMessages(fuelPlanningFormDataSchema.safeParse({ ...base, taxiFuel: -1 }))
		).toEqual(['Taxi fuel cannot be negative']);
	});

	it('rejects a burn rate of 0 with one issue', () => {
		const result = fuelPlanningFormDataSchema.safeParse({ ...base, fuelBurnRate: 0 });

		expect(issueMessages(result)).toEqual(['Fuel burn rate must be greater than 0']);
	});

	it('accepts a flight time of 24 h and rejects more', () => {
		expect(fuelPlanningFormDataSchema.safeParse({ ...base, flightTime: 1440 }).success).toBe(
			true
		);
		expect(
			issueMessages(fuelPlanningFormDataSchema.safeParse({ ...base, flightTime: 1441 }))
		).toEqual(['Flight time cannot be greater than 24 h']);
	});

	it('accepts a reserve of 180 min and rejects more', () => {
		expect(fuelPlanningFormDataSchema.safeParse({ ...base, reserveTime: 180 }).success).toBe(
			true
		);
		expect(
			issueMessages(fuelPlanningFormDataSchema.safeParse({ ...base, reserveTime: 181 }))
		).toEqual(['Reserve time cannot be greater than 180 min']);
	});

	it.each([
		['fuelBurnRate', 'Fuel burn rate cannot be greater than 10,000.00 L/h'],
		['taxiFuel', 'Taxi fuel cannot be greater than 10,000.00 L'],
		['extraFuel', 'Extra fuel cannot be greater than 10,000.00 L'],
	])('accepts 10,000 L for %s and rejects more', (field, message) => {
		expect(fuelPlanningFormDataSchema.safeParse({ ...base, [field]: 10000 }).success).toBe(
			true
		);

		const result = fuelPlanningFormDataSchema.safeParse({ ...base, [field]: 10001 });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	// 10,000 L ÷ 3.785411784 L/US gal = 2,641.7205 US gal
	it('shows the limits in US gal', () => {
		const schema = schemaIn('usgal');

		expect(
			schema.safeParse({ ...base, fuelBurnRate: 2641.72, taxiFuel: 2641.72 }).success
		).toBe(true);
		expect(
			issueMessages(schema.safeParse({ ...base, fuelBurnRate: 2641.73, taxiFuel: 2641.73 }))
		).toEqual([
			'Fuel burn rate cannot be greater than 2,641.72 US gal/h',
			'Taxi fuel cannot be greater than 2,641.72 US gal',
		]);
	});

	// 10,000 L × 0.7189586 kg/L (AVGAS) = 7,189.586 kg; × 0.8004405 kg/L (Jet A) = 8,004.405 kg
	it('shows the limit in kg for the selected fuel type', () => {
		const schema = schemaIn('kg');

		expect(schema.safeParse({ ...base, fuelBurnRate: 7189.58 }).success).toBe(true);
		expect(issueMessages(schema.safeParse({ ...base, fuelBurnRate: 7189.59 }))).toEqual([
			'Fuel burn rate cannot be greater than 7,189.58 kg/h',
		]);

		const jetA = { ...base, fuelType: 'jetA' };

		expect(schema.safeParse({ ...jetA, fuelBurnRate: 7189.59 }).success).toBe(true);
		expect(schema.safeParse({ ...jetA, fuelBurnRate: 8004.4 }).success).toBe(true);
		expect(issueMessages(schema.safeParse({ ...jetA, fuelBurnRate: 8004.41 }))).toEqual([
			'Fuel burn rate cannot be greater than 8,004.40 kg/h',
		]);
	});

	// 10,000 L ÷ 3.785411784 × 6 lb/US gal = 15,850.323 lb of AVGAS
	it('shows the limit in lb', () => {
		const schema = schemaIn('lb');

		expect(schema.safeParse({ ...base, extraFuel: 15850.32 }).success).toBe(true);
		expect(issueMessages(schema.safeParse({ ...base, extraFuel: 15850.33 }))).toEqual([
			'Extra fuel cannot be greater than 15,850.32 lb',
		]);
	});

	it('accepts imported values at the limit in every fuel unit and type', () => {
		for (const fuel of ['l', 'usgal', 'kg', 'lb'] as const) {
			for (const fuelType of ['avgas', 'jetA']) {
				const stored = { ...base, fuelType, fuelBurnRate: 10000, taxiFuel: 10000 };
				const formData = formDataFromBaseUnits(
					stored,
					{ fuelBurnRate: 'fuel', taxiFuel: 'fuel' },
					{ ...BASE_UNITS, fuel },
					getFuelUnitContext
				);

				expect(schemaIn(fuel).safeParse(formData).success).toBe(true);
			}
		}
	});

	it('rejects an unknown fuel type with one issue, also with mass units', () => {
		for (const fuel of ['l', 'kg', 'lb'] as const) {
			const result = schemaIn(fuel).safeParse({ ...base, fuelType: 'diesel' });

			expect(issueFields(result)).toEqual(['fuelType']);
			expect(issueMessages(result)).toEqual(['Fuel type must be AVGAS or Jet A']);
		}
	});

	it('reports an infinite value once', () => {
		for (const field of ['fuelBurnRate', 'taxiFuel']) {
			const result = schemaIn('kg').safeParse({ ...base, [field]: '1e400' });

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)[0]).toMatch(/has to be a finite number$/);
		}
	});

	it('does not check a raw optional value skipped after an earlier issue', () => {
		const result = schemaIn('kg').safeParse({ ...base, fuelBurnRate: 0, taxiFuel: '1e400' });

		expect(issueMessages(result)).toEqual(['Fuel burn rate must be greater than 0']);
	});

	// Zod 3.22 z.preprocess skips its inner schema once any earlier field has an issue.
	it.fails('BUG: reports an invalid taxi fuel together with an invalid burn rate', () => {
		const result = fuelPlanningFormDataSchema.safeParse({
			...base,
			fuelBurnRate: 0,
			taxiFuel: -1,
		});

		expect(issueFields(result)).toEqual(['fuelBurnRate', 'taxiFuel']);
	});

	it('coerces numeric strings', () => {
		expect(
			fuelPlanningFormDataSchema.parse({
				fuelBurnRate: '30.5',
				flightTime: '90',
				reserveTime: '45',
				taxiFuel: '5',
				extraFuel: '',
				fuelType: 'jetA',
			})
		).toEqual({
			fuelBurnRate: 30.5,
			flightTime: 90,
			reserveTime: 45,
			taxiFuel: 5,
			extraFuel: undefined,
			fuelType: 'jetA',
		});
	});
});

describe('trueAirspeedFormDataSchema', () => {
	const base = { calibratedAirspeed: 120, pressureAltitude: 5000, outsideAirTemperature: 5 };
	const MACH_MESSAGE =
		'Calibrated airspeed gives Mach 1 or more at this pressure altitude; only subsonic speeds are supported';

	it('accepts valid input', () => {
		expect(trueAirspeedFormDataSchema.parse(base)).toEqual(base);
	});

	itRejectsMissingFields(trueAirspeedFormDataSchema, base);

	it('accepts a negative pressure altitude and temperature', () => {
		const input = {
			calibratedAirspeed: 90,
			pressureAltitude: -1000,
			outsideAirTemperature: -40,
		};

		expect(trueAirspeedFormDataSchema.parse(input)).toEqual(input);
	});

	it('rejects a CAS of 0', () => {
		const result = trueAirspeedFormDataSchema.safeParse({ ...base, calibratedAirspeed: 0 });

		expect(issueFields(result)).toEqual(['calibratedAirspeed']);
		expect(issueMessages(result)).toEqual(['Calibrated airspeed must be greater than 0.00 kt']);
	});

	it.each([
		['calibratedAirspeed', 400, 400.01, 'Calibrated airspeed cannot be greater than 400.00 kt'],
		['pressureAltitude', -1500, -1501, 'Pressure altitude cannot be lower than -1,500 ft'],
		['pressureAltitude', 36000, 36001, 'Pressure altitude cannot be greater than 36,000 ft'],
		[
			'outsideAirTemperature',
			-70,
			-70.01,
			'Outside air temperature cannot be lower than -70.00 °C',
		],
		[
			'outsideAirTemperature',
			60,
			60.01,
			'Outside air temperature cannot be greater than 60.00 °C',
		],
	])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
		expect(trueAirspeedFormDataSchema.safeParse({ ...base, [field]: limit }).success).toBe(
			true
		);

		const result = trueAirspeedFormDataSchema.safeParse({ ...base, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	// Mach 1 is at CAS 342.274 kt at 36,000 ft and 389.964 kt at 30,000 ft (Aviation Formulary).
	it.each([
		{ pressureAltitude: 36000, accepted: 342, rejected: 343 },
		{ pressureAltitude: 30000, accepted: 389, rejected: 390 },
	])(
		'accepts $accepted kt and rejects $rejected kt at $pressureAltitude ft',
		({ pressureAltitude, accepted, rejected }) => {
			const parse = (calibratedAirspeed: number) =>
				trueAirspeedFormDataSchema.safeParse({
					...base,
					calibratedAirspeed,
					pressureAltitude,
				});

			expect(parse(accepted).success).toBe(true);
			expect(issueFields(parse(rejected))).toEqual(['calibratedAirspeed']);
			expect(issueMessages(parse(rejected))).toEqual([MACH_MESSAGE]);
		}
	);

	it('accepts the maximum CAS at 25,000 ft (Mach 0.934)', () => {
		const input = { ...base, calibratedAirspeed: 400, pressureAltitude: 25000 };

		expect(trueAirspeedFormDataSchema.safeParse(input).success).toBe(true);
	});

	it.each([
		{
			input: { calibratedAirspeed: 450, pressureAltitude: 36000 },
			field: 'calibratedAirspeed',
			message: 'Calibrated airspeed cannot be greater than 400.00 kt',
		},
		{
			input: { calibratedAirspeed: -500, pressureAltitude: 36000 },
			field: 'calibratedAirspeed',
			message: 'Calibrated airspeed must be greater than 0.00 kt',
		},
		{
			input: { calibratedAirspeed: 343, pressureAltitude: 40000 },
			field: 'pressureAltitude',
			message: 'Pressure altitude cannot be greater than 36,000 ft',
		},
	])("doesn't add the Mach message when $field already failed", ({ input, field, message }) => {
		const result = trueAirspeedFormDataSchema.safeParse({ ...base, ...input });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	it('coerces numeric strings', () => {
		expect(
			trueAirspeedFormDataSchema.parse({
				calibratedAirspeed: '150.5',
				pressureAltitude: '-500',
				outsideAirTemperature: '-5',
			})
		).toEqual({ calibratedAirspeed: 150.5, pressureAltitude: -500, outsideAirTemperature: -5 });
	});

	describe('in km/h, m and °F', () => {
		const units = { ...BASE_UNITS, speed: 'kmh', altitude: 'm', temperature: 'f' } as const;
		const schema = createTrueAirspeedFormDataSchema(units);
		// 222.24 km/h = 120 kt, 1524 m = 5000 ft, 41 °F = 5 °C
		const userBase = {
			calibratedAirspeed: 222.24,
			pressureAltitude: 1524,
			outsideAirTemperature: 41,
		};

		it('accepts valid input', () => {
			expect(schema.safeParse(userBase).success).toBe(true);
		});

		// 400 kt = 740.8 km/h, −1500 ft = −457.2 m, 36000 ft = 10972.8 m, −70 °C = −94 °F,
		// 60 °C = 140 °F. Shown limits are rounded inwards.
		it.each([
			[
				'calibratedAirspeed',
				740.8,
				740.81,
				'Calibrated airspeed cannot be greater than 740.80 km/h',
			],
			['pressureAltitude', -457, -458, 'Pressure altitude cannot be lower than -457 m'],
			['pressureAltitude', 10972, 10973, 'Pressure altitude cannot be greater than 10,972 m'],
			[
				'outsideAirTemperature',
				-94,
				-94.01,
				'Outside air temperature cannot be lower than -94.00 °F',
			],
			[
				'outsideAirTemperature',
				140,
				140.01,
				'Outside air temperature cannot be greater than 140.00 °F',
			],
		])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
			expect(schema.safeParse({ ...userBase, [field]: limit }).success).toBe(true);

			const result = schema.safeParse({ ...userBase, [field]: beyond });

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)).toEqual([message]);
		});

		// 633 km/h ≈ 341.8 kt and 636 km/h ≈ 343.4 kt; Mach 1 is at about 342.3 kt here.
		it('checks the Mach number in the user units', () => {
			const parse = (calibratedAirspeed: number) =>
				schema.safeParse({ ...userBase, calibratedAirspeed, pressureAltitude: 10972 });

			expect(parse(633).success).toBe(true);
			expect(issueMessages(parse(636))).toEqual([MACH_MESSAGE]);
		});

		it('accepts the form values of the limits set from base units', () => {
			for (const baseValues of [
				{ calibratedAirspeed: 400, pressureAltitude: -1500, outsideAirTemperature: -70 },
				{ calibratedAirspeed: 300, pressureAltitude: 36000, outsideAirTemperature: 60 },
			]) {
				const formData = formDataFromBaseUnits(
					baseValues,
					{
						calibratedAirspeed: 'speed',
						pressureAltitude: 'altitude',
						outsideAirTemperature: 'temperature',
					},
					units
				);

				expect(schema.safeParse(formData).success).toBe(true);
			}
		});
	});
});

describe('timeSpeedDistanceFormDataSchema', () => {
	const schema = timeSpeedDistanceFormDataSchema;
	const schemaIn = (units: Partial<typeof BASE_UNITS>) =>
		createTimeSpeedDistanceFormDataSchema({ ...BASE_UNITS, ...units });

	const bases = {
		distance: { solveFor: 'distance', groundspeed: 120, time: 105 },
		groundspeed: { solveFor: 'groundspeed', distance: 270, time: 180 },
		time: { solveFor: 'time', distance: 210, groundspeed: 140 },
	} as const;

	const givenFields = {
		distance: ['groundspeed', 'time'],
		groundspeed: ['distance', 'time'],
		time: ['distance', 'groundspeed'],
	} as const;

	const fieldNames = { distance: 'Distance', groundspeed: 'Groundspeed', time: 'Time' };

	describe.each(['distance', 'groundspeed', 'time'] as const)('solving for %s', (solveFor) => {
		const base = bases[solveFor];

		it('accepts valid input and outputs the solved field as null', () => {
			expect(schema.parse(base)).toEqual({
				distance: null,
				groundspeed: null,
				time: null,
				...base,
				[solveFor]: null,
			});
		});

		it.each([undefined, '', null, -1, 1e9, 'abc', 'Infinity'])(
			'ignores a hidden value of %s in the solved field',
			(value) => {
				const result = schema.safeParse({ ...base, [solveFor]: value });

				expect(result.success).toBe(true);
				expect(result.success && result.data[solveFor]).toBeNull();
			}
		);

		it.each(givenFields[solveFor])('requires the given %s', (field) => {
			for (const value of [undefined, '', null]) {
				const result = schema.safeParse({ ...base, [field]: value });

				expect(issueFields(result)).toEqual([field]);
				expect(issueMessages(result)).toEqual([`${fieldNames[field]} is required`]);
			}
		});

		it.each(givenFields[solveFor])('rejects a given %s of 0 or less', (field) => {
			for (const value of [0, -1]) {
				const result = schema.safeParse({ ...base, [field]: value });

				expect(issueFields(result)).toEqual([field]);
			}
		});

		it('reports both given fields when both are invalid', () => {
			const [first, second] = givenFields[solveFor];
			const result = schema.safeParse({ ...base, [first]: 0, [second]: 'abc' });

			expect(issueFields(result)).toEqual([first, second]);
		});
	});

	it('shows the minimum messages', () => {
		expect(issueMessages(schema.safeParse({ ...bases.time, distance: 0 }))).toEqual([
			'Distance must be greater than 0.00 NM',
		]);
		expect(issueMessages(schema.safeParse({ ...bases.time, groundspeed: 0 }))).toEqual([
			'Groundspeed must be greater than 0.00 kt',
		]);
		expect(issueMessages(schema.safeParse({ ...bases.distance, time: 0 }))).toEqual([
			'Time must be greater than 0',
		]);
	});

	it('rejects a non-numeric given value', () => {
		expect(issueMessages(schema.safeParse({ ...bases.time, distance: 'abc' }))).toEqual([
			'Distance has to be a number',
		]);
	});

	// 10,000 NM = 18,520 km (× 1.852) = 11,507.794 SM (× 1852 / 1609.344).
	it.each([
		['nm', 10000, 10000.01, '10,000.00 NM'],
		['km', 18520, 18520.01, '18,520.00 km'],
		['sm', 11507.79, 11507.8, '11,507.79 SM'],
	] as const)('accepts a given distance at the limit in %s', (distance, atLimit, over, shown) => {
		// 10,000 NM at 1,000 kt is 600 min, within the time limit.
		const input = { solveFor: 'time', groundspeed: 1000 };

		expect(schemaIn({ distance }).safeParse({ ...input, distance: atLimit }).success).toBe(
			true
		);
		expect(
			issueMessages(schemaIn({ distance }).safeParse({ ...input, distance: over }))
		).toEqual([`Distance cannot be greater than ${shown}`]);
	});

	// 1,000 kt = 1,852 km/h = 1,150.779 mph = 514.444 m/s.
	it.each([
		['kt', 1000, 1000.01, '1,000.00 kt'],
		['kmh', 1852, 1852.01, '1,852.00 km/h'],
		['mph', 1150.77, 1150.78, '1,150.77 mph'],
	] as const)('accepts a given groundspeed at the limit in %s', (speed, atLimit, over, shown) => {
		const input = { solveFor: 'distance', time: 60 };

		expect(schemaIn({ speed }).safeParse({ ...input, groundspeed: atLimit }).success).toBe(
			true
		);
		expect(
			issueMessages(schemaIn({ speed }).safeParse({ ...input, groundspeed: over }))
		).toEqual([`Groundspeed cannot be greater than ${shown}`]);
	});

	it('accepts a given time of 24 h and rejects more', () => {
		const input = { solveFor: 'distance', groundspeed: 1 };

		expect(schema.safeParse({ ...input, time: 1440 }).success).toBe(true);
		expect(issueMessages(schema.safeParse({ ...input, time: 1440.01 }))).toEqual([
			'Time cannot be greater than 24 h',
		]);
	});

	describe('the solved value', () => {
		// 500 kt × 1,200 min / 60 = 10,000 NM.
		it.each([
			['nm', '10,000.00 NM'],
			['km', '18,520.00 km'],
			['sm', '11,507.79 SM'],
		] as const)('accepts a distance at its limit and rejects more in %s', (distance, shown) => {
			const input = { solveFor: 'distance', groundspeed: 500 };

			expect(schemaIn({ distance }).safeParse({ ...input, time: 1200 }).success).toBe(true);

			const result = schemaIn({ distance }).safeParse({ ...input, time: 1200.01 });

			expect(issueFields(result)).toEqual(['solveFor']);
			expect(issueMessages(result)).toEqual([`The resulting distance would exceed ${shown}`]);
		});

		// 60 × 1,000 NM / 60 min = 1,000 kt.
		it.each([
			['kt', '1,000.00 kt'],
			['kmh', '1,852.00 km/h'],
			['mph', '1,150.77 mph'],
			['ms', '514.44 m/s'],
		] as const)('accepts a groundspeed at its limit and rejects more in %s', (speed, shown) => {
			const input = { solveFor: 'groundspeed', time: 60 };

			expect(schemaIn({ speed }).safeParse({ ...input, distance: 1000 }).success).toBe(true);

			const result = schemaIn({ speed }).safeParse({ ...input, distance: 1000.01 });

			expect(issueFields(result)).toEqual(['solveFor']);
			expect(issueMessages(result)).toEqual([
				`The resulting groundspeed would exceed ${shown}`,
			]);
		});

		// 60 × 2,400 NM / 100 kt = 1,440 min.
		it('accepts a time of 24 h and rejects more', () => {
			const input = { solveFor: 'time', groundspeed: 100 };

			expect(schema.safeParse({ ...input, distance: 2400 }).success).toBe(true);

			const result = schema.safeParse({ ...input, distance: 2400.01 });

			expect(issueFields(result)).toEqual(['solveFor']);
			expect(issueMessages(result)).toEqual(['The resulting time would exceed 24 h']);
		});

		// 926 km/h = 500 kt.
		it('is checked in base units', () => {
			const input = { solveFor: 'distance', groundspeed: 926 };

			expect(
				schemaIn({ speed: 'kmh', distance: 'km' }).safeParse({ ...input, time: 1200 })
					.success
			).toBe(true);
			expect(
				schemaIn({ speed: 'kmh', distance: 'km' }).safeParse({ ...input, time: 1201 })
					.success
			).toBe(false);
		});

		it('is not checked when a given field already failed', () => {
			const result = schema.safeParse({
				solveFor: 'distance',
				groundspeed: 1000.01,
				time: 1440,
			});

			expect(issueFields(result)).toEqual(['groundspeed']);
		});
	});

	it('accepts imported values at the limits in every distance and speed unit', () => {
		const unitFields = { distance: 'distance', groundspeed: 'speed' } as const;

		for (const distance of ['nm', 'km', 'sm'] as const) {
			for (const speed of ['kt', 'kmh', 'mph', 'ms'] as const) {
				const units = { ...BASE_UNITS, distance, speed };
				const stored = { solveFor: 'time', distance: 10000, groundspeed: 1000, time: null };

				expect(
					schemaIn(units).safeParse(formDataFromBaseUnits(stored, unitFields, units))
						.success
				).toBe(true);
			}
		}
	});

	it('rejects an unknown solveFor with one issue', () => {
		const result = schema.safeParse({ ...bases.time, solveFor: 'fuel' });

		expect(issueFields(result)).toEqual(['solveFor']);
		expect(issueMessages(result)).toEqual(['Solve for must be distance, groundspeed or time']);
	});

	it('rejects a missing solveFor', () => {
		const result = schema.safeParse({ distance: 210, groundspeed: 140 });

		expect(issueFields(result)).toEqual(['solveFor']);
	});

	it('coerces numeric strings', () => {
		expect(
			schema.parse({ solveFor: 'time', distance: '210', groundspeed: '140.5', time: '' })
		).toEqual({ solveFor: 'time', distance: 210, groundspeed: 140.5, time: null });
	});
});

describe('headingFormDataSchema', () => {
	const base = { trueHeading: 88, variation: 10, variationDirection: 'east' };
	const withCorrection = { ...base, deviationCorrection: -4 };

	it('accepts valid input', () => {
		expect(headingFormDataSchema.parse(base)).toEqual(base);
		expect(headingFormDataSchema.parse(withCorrection)).toEqual(withCorrection);
		expect(headingFormDataSchema.parse({ ...base, variationDirection: 'west' })).toEqual({
			...base,
			variationDirection: 'west',
		});
	});

	itRejectsMissingFields(headingFormDataSchema, base);

	it('accepts a true heading of 1 and 360', () => {
		expect(headingFormDataSchema.safeParse({ ...base, trueHeading: 1 }).success).toBe(true);
		expect(headingFormDataSchema.safeParse({ ...base, trueHeading: 360 }).success).toBe(true);
	});

	it.each([0, 360.01])('rejects a true heading of %d', (trueHeading) => {
		const result = headingFormDataSchema.safeParse({ ...base, trueHeading });

		expect(issueFields(result)).toEqual(['trueHeading']);
		expect(issueMessages(result)).toEqual(['True heading must be between 1 and 360']);
	});

	it('accepts a variation of 0 and 180', () => {
		expect(headingFormDataSchema.safeParse({ ...base, variation: 0 }).success).toBe(true);
		expect(headingFormDataSchema.safeParse({ ...base, variation: 180 }).success).toBe(true);
	});

	it.each([
		[-0.01, 'Variation cannot be negative'],
		[180.01, 'Variation cannot be greater than 180°'],
	])('rejects a variation of %d', (variation, message) => {
		const result = headingFormDataSchema.safeParse({ ...base, variation });

		expect(issueFields(result)).toEqual(['variation']);
		expect(issueMessages(result)).toEqual([message]);
	});

	it.each(['north', 'E', ''])('rejects a variation direction of %j', (variationDirection) => {
		const result = headingFormDataSchema.safeParse({ ...base, variationDirection });

		expect(issueFields(result)).toEqual(['variationDirection']);
		expect(issueMessages(result)).toEqual(['Variation must be East or West']);
	});

	it.each([undefined, '', null])('treats a correction of %j as none', (deviationCorrection) => {
		const result = headingFormDataSchema.safeParse({ ...base, deviationCorrection });

		expect(result.success).toBe(true);
		expect(result.success && result.data.deviationCorrection).toBeUndefined();
	});

	it.each([-20, 0, 20])('accepts a correction of %d', (deviationCorrection) => {
		expect(headingFormDataSchema.parse({ ...base, deviationCorrection })).toEqual({
			...base,
			deviationCorrection,
		});
	});

	it.each([-20.01, 20.01])('rejects a correction of %d', (deviationCorrection) => {
		const result = headingFormDataSchema.safeParse({ ...base, deviationCorrection });

		expect(issueFields(result)).toEqual(['deviationCorrection']);
		expect(issueMessages(result)).toEqual([
			'Deviation correction must be between -20° and +20°',
		]);
	});

	// Zod 3.22 z.preprocess skips its inner schema once any earlier field has an issue.
	it.fails('BUG: reports an invalid correction together with an invalid true heading', () => {
		const result = headingFormDataSchema.safeParse({
			...base,
			trueHeading: 0,
			deviationCorrection: 30,
		});

		expect(issueFields(result)).toEqual(['trueHeading', 'deviationCorrection']);
	});

	it('coerces numeric strings', () => {
		expect(
			headingFormDataSchema.parse({
				trueHeading: '088',
				variation: '10.5',
				variationDirection: 'west',
				deviationCorrection: '-4',
			})
		).toEqual({
			trueHeading: 88,
			variation: 10.5,
			variationDirection: 'west',
			deviationCorrection: -4,
		});
	});
});

describe('cloudBaseFormDataSchema', () => {
	const base = { temperature: 15, dewPoint: 5 };
	const withElevation = { ...base, elevation: 1000 };
	const mslMessage = 'The resulting cloud base would exceed 60,000 ft MSL';

	it('accepts valid input', () => {
		expect(cloudBaseFormDataSchema.parse(base)).toEqual(base);
		expect(cloudBaseFormDataSchema.parse(withElevation)).toEqual(withElevation);
	});

	itRejectsMissingFields(cloudBaseFormDataSchema, base);

	it.each([undefined, '', null])('treats an elevation of %j as none', (elevation) => {
		const result = cloudBaseFormDataSchema.safeParse({ ...base, elevation });

		expect(result.success).toBe(true);
		expect(result.success && result.data.elevation).toBeUndefined();
	});

	it.each([
		[
			{ temperature: -60, dewPoint: -60 },
			{ temperature: -60.01, dewPoint: -60 },
			'temperature',
		],
		[{ temperature: 60, dewPoint: 0 }, { temperature: 60.01, dewPoint: 0 }, 'temperature'],
		[{ temperature: 0, dewPoint: -60 }, { temperature: 0, dewPoint: -60.01 }, 'dewPoint'],
		[{ temperature: 60, dewPoint: 60 }, { temperature: 60, dewPoint: 60.01 }, 'dewPoint'],
	])('accepts %j and rejects %j', (limit, beyond, field) => {
		expect(cloudBaseFormDataSchema.safeParse(limit).success).toBe(true);

		const result = cloudBaseFormDataSchema.safeParse(beyond);

		expect(issueFields(result)).toEqual([field]);
	});

	it.each([
		[-1500, -1500.1, 'Elevation cannot be lower than -1,500 ft'],
		[30000, 30000.1, 'Elevation cannot be greater than 30,000 ft'],
	])('accepts an elevation of %d and rejects %d', (limit, beyond, message) => {
		expect(cloudBaseFormDataSchema.safeParse({ ...base, elevation: limit }).success).toBe(true);

		const result = cloudBaseFormDataSchema.safeParse({ ...base, elevation: beyond });

		expect(issueFields(result)).toEqual(['elevation']);
		expect(issueMessages(result)).toEqual([message]);
	});

	it('rejects a dew point above the temperature and accepts an equal one', () => {
		const result = cloudBaseFormDataSchema.safeParse({ temperature: 10, dewPoint: 10.01 });

		expect(issueFields(result)).toEqual(['dewPoint']);
		expect(issueMessages(result)).toEqual(['Dew point cannot be higher than the temperature']);
		expect(cloudBaseFormDataSchema.safeParse({ temperature: 10, dewPoint: 10 }).success).toBe(
			true
		);
	});

	it('accepts a dew point a float tolerance above the temperature', () => {
		const input = { temperature: 15, dewPoint: 15 + 1e-10 };

		expect(cloudBaseFormDataSchema.safeParse(input).success).toBe(true);
	});

	// 120 °C spread: 49,090.91 ft AGL; + 10,909 ft = 59,999.91 ft, + 10,910 ft = 60,000.91 ft MSL.
	it('rejects a cloud base above 60,000 ft MSL on the elevation', () => {
		const extreme = { temperature: 60, dewPoint: -60 };

		expect(cloudBaseFormDataSchema.safeParse({ ...extreme, elevation: 10909 }).success).toBe(
			true
		);
		expect(cloudBaseFormDataSchema.safeParse(extreme).success).toBe(true);

		const result = cloudBaseFormDataSchema.safeParse({ ...extreme, elevation: 10910 });

		expect(issueFields(result)).toEqual(['elevation']);
		expect(issueMessages(result)).toEqual([mslMessage]);
	});

	it.each([
		[{ temperature: -61, dewPoint: 0 }, ['temperature']],
		[{ temperature: 60, dewPoint: 61 }, ['dewPoint']],
		[{ temperature: 60, dewPoint: -61, elevation: 20000 }, ['dewPoint']],
		[{ temperature: 60, dewPoint: -60, elevation: 30001 }, ['elevation']],
	])('adds no cross-field issue when a field already failed: %j', (input, fields) => {
		const result = cloudBaseFormDataSchema.safeParse(input);

		expect(issueFields(result)).toEqual(fields);
		expect(issueMessages(result)).not.toContain(mslMessage);
		expect(issueMessages(result)).not.toContain(
			'Dew point cannot be higher than the temperature'
		);
	});

	// Zod 3.22 z.preprocess skips its inner schema once any earlier field has an issue.
	it.fails('BUG: reports an invalid elevation together with an invalid temperature', () => {
		const result = cloudBaseFormDataSchema.safeParse({
			temperature: 61,
			dewPoint: 0,
			elevation: 30001,
		});

		expect(issueFields(result)).toEqual(['temperature', 'elevation']);
	});

	it('coerces numeric strings', () => {
		expect(
			cloudBaseFormDataSchema.parse({
				temperature: '15.5',
				dewPoint: '-3',
				elevation: '1200',
			})
		).toEqual({ temperature: 15.5, dewPoint: -3, elevation: 1200 });
	});

	describe('in °F and m', () => {
		const units = { ...BASE_UNITS, temperature: 'f', altitude: 'm' } as const;
		const schema = createCloudBaseFormDataSchema(units);

		// −60 °C = −76 °F, 60 °C = 140 °F, −1500 ft = −457.2 m, 30000 ft = 9144 m.
		it.each([
			[
				{ temperature: 140, dewPoint: 32 },
				{ temperature: 140.1, dewPoint: 32 },
				'temperature',
				'Temperature cannot be greater than 140.00 °F',
			],
			[
				{ temperature: -76, dewPoint: -76 },
				{ temperature: -76, dewPoint: -76.1 },
				'dewPoint',
				'Dew point cannot be lower than -76.00 °F',
			],
			[
				{ temperature: 59, dewPoint: 41, elevation: 9144 },
				{ temperature: 59, dewPoint: 41, elevation: 9145 },
				'elevation',
				'Elevation cannot be greater than 9,144 m',
			],
			[
				{ temperature: 59, dewPoint: 41, elevation: -457 },
				{ temperature: 59, dewPoint: 41, elevation: -458 },
				'elevation',
				'Elevation cannot be lower than -457 m',
			],
		])('accepts %j and rejects %j', (limit, beyond, field, message) => {
			expect(schema.safeParse(limit).success).toBe(true);

			const result = schema.safeParse(beyond);

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)).toEqual([message]);
		});

		// 3,325 m = 10,908.79 ft (59,999.70 ft MSL); 3,326 m = 10,912.07 ft (60,002.98 ft MSL).
		it('shows the MSL limit in m', () => {
			const extreme = { temperature: 140, dewPoint: -76 };

			expect(schema.safeParse({ ...extreme, elevation: 3325 }).success).toBe(true);

			const result = schema.safeParse({ ...extreme, elevation: 3326 });

			expect(issueFields(result)).toEqual(['elevation']);
			expect(issueMessages(result)).toEqual([
				'The resulting cloud base would exceed 18,288 m MSL',
			]);
		});

		it('rejects a dew point above the temperature', () => {
			const result = schema.safeParse({ temperature: 50, dewPoint: 50.1 });

			expect(issueFields(result)).toEqual(['dewPoint']);
			expect(schema.safeParse({ temperature: 50, dewPoint: 50 }).success).toBe(true);
		});

		it('accepts the form values of the limits set from base units', () => {
			const formData = formDataFromBaseUnits(
				{ temperature: 60, dewPoint: -60, elevation: 10909 },
				{ temperature: 'temperature', dewPoint: 'temperature', elevation: 'altitude' },
				units
			);

			expect(schema.safeParse(formData).success).toBe(true);
		});
	});
});

describe('glideDistanceFormDataSchema', () => {
	const schema = glideDistanceFormDataSchema;
	const base = { altitude: 4000, terrainElevation: 1000, glideRatio: 9 };
	const withWind = { ...base, glideTrueAirspeed: 60, windSpeed: 25, windType: 'headwind' };
	const TAS_REQUIRED = 'Glide true airspeed is required when a wind is entered';
	const TYPE_REQUIRED = 'Choose headwind or tailwind';
	const HEADWIND_MESSAGE = 'The headwind must be lower than the glide true airspeed';
	const ABOVE_TERRAIN = 'Altitude must be above the terrain elevation';

	it('accepts valid input with and without a TAS and wind', () => {
		expect(schema.parse(base)).toEqual({ ...base, windType: null });
		expect(schema.parse({ ...base, glideTrueAirspeed: 60 })).toEqual({
			...base,
			glideTrueAirspeed: 60,
			windType: null,
		});
		expect(schema.parse(withWind)).toEqual(withWind);
		expect(schema.parse({ ...withWind, windType: 'tailwind' })).toEqual({
			...withWind,
			windType: 'tailwind',
		});
	});

	itRejectsMissingFields(schema, base);

	it.each([undefined, '', null])('treats a TAS and wind of %j as none', (value) => {
		const result = schema.safeParse({
			...base,
			glideTrueAirspeed: value,
			windSpeed: value,
			windType: 'headwind',
		});

		expect(result.success).toBe(true);
		expect(result.success && result.data.glideTrueAirspeed).toBeUndefined();
		expect(result.success && result.data.windSpeed).toBeUndefined();
		expect(result.success && result.data.windType).toBeNull();
	});

	it('treats a wind of 0 as no wind: no TAS or wind type needed', () => {
		for (const windType of [undefined, null, 'tailwind']) {
			const result = schema.safeParse({ ...base, windSpeed: 0, windType });

			expect(result.success).toBe(true);
			expect(result.success && result.data.windSpeed).toBe(0);
			expect(result.success && result.data.windType).toBeNull();
		}
	});

	it('requires a TAS with a wind above 0', () => {
		const result = schema.safeParse({ ...withWind, glideTrueAirspeed: '' });

		expect(issueFields(result)).toEqual(['glideTrueAirspeed']);
		expect(issueMessages(result)).toEqual([TAS_REQUIRED]);
	});

	it.each([undefined, null])('requires a wind type of %j with a wind above 0', (windType) => {
		const result = schema.safeParse({ ...withWind, windType });

		expect(issueFields(result)).toEqual(['windType']);
		expect(issueMessages(result)).toEqual([TYPE_REQUIRED]);
	});

	it('reports both a missing TAS and a missing wind type', () => {
		const result = schema.safeParse({ ...base, windSpeed: 25 });

		expect(issueFields(result)).toEqual(['windType', 'glideTrueAirspeed']);
	});

	it.each(['crosswind', 'Headwind'])('rejects a wind type of %j', (windType) => {
		const result = schema.safeParse({ ...withWind, windType });

		expect(issueFields(result)).toEqual(['windType']);
		expect(issueMessages(result)).toEqual([TYPE_REQUIRED]);
	});

	it('accepts a headwind of 59.99 kt at 60 kt and rejects 60 kt and more', () => {
		expect(schema.safeParse({ ...withWind, windSpeed: 59.99 }).success).toBe(true);

		for (const windSpeed of [60, 70]) {
			const result = schema.safeParse({ ...withWind, windSpeed });

			expect(issueFields(result)).toEqual(['windSpeed']);
			expect(issueMessages(result)).toEqual([HEADWIND_MESSAGE]);
		}
	});

	it('accepts a 200 kt tailwind at a TAS of 20 kt', () => {
		const input = { ...withWind, glideTrueAirspeed: 20, windSpeed: 200, windType: 'tailwind' };

		expect(schema.safeParse(input).success).toBe(true);
	});

	it.each([4000, 3999])('rejects an altitude of %d ft above 4,000 ft terrain', (altitude) => {
		const result = schema.safeParse({ ...base, altitude, terrainElevation: 4000 });

		expect(issueFields(result)).toEqual(['altitude']);
		expect(issueMessages(result)).toEqual([ABOVE_TERRAIN]);
	});

	it.each([
		['altitude', 60000, 60000.1, 'Altitude cannot be greater than 60,000 ft'],
		['altitude', -1000, -1500.1, 'Altitude cannot be lower than -1,500 ft'],
		['terrainElevation', -1500, -1500.1, 'Terrain elevation cannot be lower than -1,500 ft'],
		['terrainElevation', 30000, 30000.1, 'Terrain elevation cannot be greater than 30,000 ft'],
		['glideRatio', 70, 70.01, 'Glide ratio cannot be greater than 70'],
		['glideRatio', 0.01, 0, 'Glide ratio must be greater than 0'],
		['glideTrueAirspeed', 20, 19.99, 'Glide true airspeed cannot be lower than 20.00 kt'],
		['glideTrueAirspeed', 400, 400.01, 'Glide true airspeed cannot be greater than 400.00 kt'],
		['windSpeed', 0, -0.01, 'Wind speed cannot be lower than 0.00 kt'],
		['windSpeed', 200, 200.01, 'Wind speed cannot be greater than 200.00 kt'],
	])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
		const input = {
			...withWind,
			terrainElevation: -1500,
			altitude: 40000,
			glideTrueAirspeed: 400,
			windType: 'tailwind',
		};

		expect(schema.safeParse({ ...input, [field]: limit }).success).toBe(true);

		const result = schema.safeParse({ ...input, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	it('rejects a negative glide ratio', () => {
		expect(issueMessages(schema.safeParse({ ...base, glideRatio: -1 }))).toEqual([
			'Glide ratio must be greater than 0',
		]);
	});

	it.each([
		[{ altitude: -1501, terrainElevation: 1000 }, ['altitude']],
		[{ altitude: 4000, terrainElevation: 30001 }, ['terrainElevation']],
		[{ glideTrueAirspeed: 19, windSpeed: 25 }, ['glideTrueAirspeed']],
		[{ glideTrueAirspeed: 401, windSpeed: 25 }, ['glideTrueAirspeed']],
		[{ glideTrueAirspeed: '', windSpeed: 201 }, ['windSpeed']],
	])('adds no cross-field issue when a field already failed: %j', (input, fields) => {
		const result = schema.safeParse({ ...withWind, ...input });

		expect(issueFields(result)).toEqual(fields);
		expect(issueMessages(result)).not.toContain(ABOVE_TERRAIN);
		expect(issueMessages(result)).not.toContain(TAS_REQUIRED);
		expect(issueMessages(result)).not.toContain(HEADWIND_MESSAGE);
	});

	// Zod 3.22 z.preprocess skips its inner schema once any earlier field has an issue.
	it.fails('BUG: reports an invalid TAS together with an invalid altitude', () => {
		const result = schema.safeParse({ ...base, altitude: 60001, glideTrueAirspeed: 401 });

		expect(issueFields(result)).toEqual(['altitude', 'glideTrueAirspeed']);
	});

	it('coerces numeric strings', () => {
		expect(
			schema.parse({
				altitude: '4500.5',
				terrainElevation: '-200',
				glideRatio: '8.5',
				glideTrueAirspeed: '65',
				windSpeed: '10',
				windType: 'tailwind',
			})
		).toEqual({
			altitude: 4500.5,
			terrainElevation: -200,
			glideRatio: 8.5,
			glideTrueAirspeed: 65,
			windSpeed: 10,
			windType: 'tailwind',
		});
	});

	describe('in m and km/h', () => {
		const units = { ...BASE_UNITS, altitude: 'm', speed: 'kmh' } as const;
		const userSchema = createGlideDistanceFormDataSchema(units);
		// 1,219.2 m / 304.8 m = 4,000 / 1,000 ft; 111.12 km/h = 60 kt; 46.3 km/h = 25 kt.
		const userBase = {
			altitude: 1219.2,
			terrainElevation: 304.8,
			glideRatio: 24,
			glideTrueAirspeed: 111.12,
			windSpeed: 46.3,
			windType: 'headwind',
		};

		it('accepts valid input', () => {
			expect(userSchema.safeParse(userBase).success).toBe(true);
		});

		// 60,000 ft = 18,288 m, −1,500 ft = −457.2 m, 30,000 ft = 9,144 m, 20 kt = 37.04 km/h,
		// 400 kt = 740.8 km/h, 200 kt = 370.4 km/h. Shown limits are rounded inwards.
		it.each([
			['altitude', 18288, 18289, 'Altitude cannot be greater than 18,288 m'],
			['terrainElevation', -457, -458, 'Terrain elevation cannot be lower than -457 m'],
			['terrainElevation', 9144, 9145, 'Terrain elevation cannot be greater than 9,144 m'],
			[
				'glideTrueAirspeed',
				37.04,
				37.03,
				'Glide true airspeed cannot be lower than 37.04 km/h',
			],
			[
				'glideTrueAirspeed',
				740.8,
				740.81,
				'Glide true airspeed cannot be greater than 740.80 km/h',
			],
			['windSpeed', 370.4, 370.41, 'Wind speed cannot be greater than 370.40 km/h'],
		])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
			const input = { ...userBase, altitude: 12000, windType: 'tailwind' };

			expect(userSchema.safeParse({ ...input, [field]: limit }).success).toBe(true);

			const result = userSchema.safeParse({ ...input, [field]: beyond });

			expect(issueFields(result)).toEqual([field]);
			expect(issueMessages(result)).toEqual([message]);
		});

		it('rejects a headwind equal to the TAS', () => {
			const result = userSchema.safeParse({ ...userBase, windSpeed: 111.12 });

			expect(issueFields(result)).toEqual(['windSpeed']);
			expect(issueMessages(result)).toEqual([HEADWIND_MESSAGE]);
		});

		it('rejects an altitude equal to the terrain elevation', () => {
			const result = userSchema.safeParse({ ...userBase, altitude: 304.8 });

			expect(issueMessages(result)).toEqual([ABOVE_TERRAIN]);
		});

		it('accepts the form values of the limits set from base units', () => {
			const formData = formDataFromBaseUnits(
				{
					altitude: 60000,
					terrainElevation: 30000,
					glideRatio: 70,
					glideTrueAirspeed: 20,
					windSpeed: 200,
					windType: 'tailwind',
				},
				{
					altitude: 'altitude',
					terrainElevation: 'altitude',
					glideTrueAirspeed: 'speed',
					windSpeed: 'speed',
				},
				units
			);

			expect(userSchema.safeParse(formData).success).toBe(true);
		});
	});

	// 20 kt = 23.0156 mph, 400 kt = 460.3115 mph, 200 kt = 230.1558 mph (rounded inwards).
	it.each([
		['glideTrueAirspeed', 23.02, 23.01, 'Glide true airspeed cannot be lower than 23.02 mph'],
		[
			'glideTrueAirspeed',
			460.31,
			460.32,
			'Glide true airspeed cannot be greater than 460.31 mph',
		],
		['windSpeed', 230.15, 230.16, 'Wind speed cannot be greater than 230.15 mph'],
	])('shows the %s limit in mph: accepts %d and rejects %d', (field, limit, beyond, message) => {
		const mphSchema = createGlideDistanceFormDataSchema({ ...BASE_UNITS, speed: 'mph' });
		const input = { ...withWind, glideTrueAirspeed: 460, windType: 'tailwind' };

		expect(mphSchema.safeParse({ ...input, [field]: limit }).success).toBe(true);

		const result = mphSchema.safeParse({ ...input, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});
});

describe('turnPerformanceFormDataSchema', () => {
	const schema = turnPerformanceFormDataSchema;
	const base = { trueAirspeed: 120, bankAngle: 30 };

	it('accepts valid input with and without a stall speed', () => {
		expect(schema.parse(base)).toEqual(base);
		expect(schema.parse({ ...base, stallSpeed: 50 })).toEqual({ ...base, stallSpeed: 50 });
	});

	itRejectsMissingFields(schema, base);

	it.each([undefined, '', null])('treats a stall speed of %j as none', (stallSpeed) => {
		const result = schema.safeParse({ ...base, stallSpeed });

		expect(result.success).toBe(true);
		expect(result.success && result.data.stallSpeed).toBeUndefined();
	});

	it.each([
		['trueAirspeed', 20, 19.99, 'True airspeed cannot be lower than 20.00 kt'],
		['trueAirspeed', 400, 400.01, 'True airspeed cannot be greater than 400.00 kt'],
		['bankAngle', 0.01, 0, 'Bank angle must be greater than 0°'],
		['bankAngle', 75, 75.01, 'Bank angle cannot be greater than 75°'],
		['stallSpeed', 0.01, 0, 'Stall speed must be greater than 0.00 kt'],
		['stallSpeed', 200, 200.01, 'Stall speed cannot be greater than 200.00 kt'],
	])('accepts %s of %d and rejects %d', (field, limit, beyond, message) => {
		const input = { ...base, stallSpeed: 50 };

		expect(schema.safeParse({ ...input, [field]: limit }).success).toBe(true);

		const result = schema.safeParse({ ...input, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	it.each(['trueAirspeed', 'bankAngle', 'stallSpeed'])('rejects a negative %s', (field) => {
		const result = schema.safeParse({ ...base, stallSpeed: 50, [field]: -1 });

		expect(issueFields(result)).toEqual([field]);
	});

	it('accepts a stall speed above the TAS (no comparison)', () => {
		expect(schema.safeParse({ trueAirspeed: 40, bankAngle: 30, stallSpeed: 60 }).success).toBe(
			true
		);
	});

	// Zod 3.22 z.preprocess skips its inner schema once any earlier field has an issue.
	it.fails('BUG: reports an invalid stall speed together with an invalid bank angle', () => {
		const result = schema.safeParse({ ...base, bankAngle: 80, stallSpeed: 201 });

		expect(issueFields(result)).toEqual(['bankAngle', 'stallSpeed']);
	});

	it('coerces numeric strings', () => {
		expect(
			schema.parse({ trueAirspeed: '120.5', bankAngle: '30', stallSpeed: '48.5' })
		).toEqual({ trueAirspeed: 120.5, bankAngle: 30, stallSpeed: 48.5 });
	});

	// 20 kt = 37.04 km/h, 400 kt = 740.8 km/h, 200 kt = 370.4 km/h.
	it.each([
		['trueAirspeed', 37.04, 37.03, 'True airspeed cannot be lower than 37.04 km/h'],
		['trueAirspeed', 740.8, 740.81, 'True airspeed cannot be greater than 740.80 km/h'],
		['stallSpeed', 370.4, 370.41, 'Stall speed cannot be greater than 370.40 km/h'],
	])('shows the %s limit in km/h: accepts %d and rejects %d', (field, limit, beyond, message) => {
		const kmhSchema = createTurnPerformanceFormDataSchema({ ...BASE_UNITS, speed: 'kmh' });
		const input = { trueAirspeed: 222.24, bankAngle: 30, stallSpeed: 92.6 };

		expect(kmhSchema.safeParse({ ...input, [field]: limit }).success).toBe(true);

		const result = kmhSchema.safeParse({ ...input, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	// 20 kt = 23.0156 mph, 400 kt = 460.3115 mph, 200 kt = 230.1558 mph (rounded inwards).
	it.each([
		['trueAirspeed', 23.02, 23.01, 'True airspeed cannot be lower than 23.02 mph'],
		['trueAirspeed', 460.31, 460.32, 'True airspeed cannot be greater than 460.31 mph'],
		['stallSpeed', 230.15, 230.16, 'Stall speed cannot be greater than 230.15 mph'],
	])('shows the %s limit in mph: accepts %d and rejects %d', (field, limit, beyond, message) => {
		const mphSchema = createTurnPerformanceFormDataSchema({ ...BASE_UNITS, speed: 'mph' });
		const input = { trueAirspeed: 138, bankAngle: 30, stallSpeed: 57.5 };

		expect(mphSchema.safeParse({ ...input, [field]: limit }).success).toBe(true);

		const result = mphSchema.safeParse({ ...input, [field]: beyond });

		expect(issueFields(result)).toEqual([field]);
		expect(issueMessages(result)).toEqual([message]);
	});

	it('accepts the form values of the limits set from base units', () => {
		const units = { ...BASE_UNITS, speed: 'kmh' } as const;
		const formData = formDataFromBaseUnits(
			{ trueAirspeed: 400, bankAngle: 75, stallSpeed: 200 },
			{ trueAirspeed: 'speed', stallSpeed: 'speed' },
			units
		);

		expect(createTurnPerformanceFormDataSchema(units).safeParse(formData).success).toBe(true);
	});
});

describe('unitPreferencesSchema', () => {
	const base = {
		speed: 'kmh',
		altitude: 'm',
		temperature: 'f',
		pressure: 'inhg',
		fuel: 'lb',
		distance: 'sm',
		verticalSpeed: 'ms',
	};

	it('accepts valid input', () => {
		expect(unitPreferencesSchema.parse(base)).toEqual(base);
	});

	it('accepts every vertical speed unit', () => {
		for (const verticalSpeed of ['fpm', 'ms']) {
			expect(unitPreferencesSchema.parse({ ...base, verticalSpeed }).verticalSpeed).toBe(
				verticalSpeed
			);
		}
	});

	it('rejects an unknown vertical speed unit', () => {
		const result = unitPreferencesSchema.safeParse({ ...base, verticalSpeed: 'kt' });

		expect(issueFields(result)).toEqual(['verticalSpeed']);
		expect(issueMessages(result)).toEqual(['Invalid verticalSpeed unit']);
	});

	it('accepts every distance unit', () => {
		for (const distance of ['nm', 'km', 'sm']) {
			expect(unitPreferencesSchema.parse({ ...base, distance }).distance).toBe(distance);
		}
	});

	it('rejects an unknown distance unit', () => {
		const result = unitPreferencesSchema.safeParse({ ...base, distance: 'mi' });

		expect(issueFields(result)).toEqual(['distance']);
		expect(issueMessages(result)).toEqual(['Invalid distance unit']);
	});

	it('accepts every fuel unit', () => {
		for (const fuel of ['l', 'usgal', 'kg', 'lb']) {
			expect(unitPreferencesSchema.parse({ ...base, fuel }).fuel).toBe(fuel);
		}
	});

	it('rejects imperial gallons', () => {
		const result = unitPreferencesSchema.safeParse({ ...base, fuel: 'impgal' });

		expect(issueFields(result)).toEqual(['fuel']);
		expect(issueMessages(result)).toEqual(['Invalid fuel unit']);
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
		units: {
			speed: 'kt',
			altitude: 'ft',
			temperature: 'c',
			pressure: 'hpa',
			fuel: 'l',
			distance: 'nm',
			verticalSpeed: 'fpm',
		},
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

	it('shows limits with a dot regardless of the default locale', () => {
		const NumberFormat = Intl.NumberFormat;

		// Simulates a Finnish browser: Intl.NumberFormat without a locale formats as fi-FI.
		vi.stubGlobal(
			'Intl',
			Object.create(Intl, {
				NumberFormat: {
					value: function (locales?: string, options?: Intl.NumberFormatOptions) {
						return new NumberFormat(locales ?? 'fi-FI', options);
					},
				},
			})
		);

		try {
			expect(issueMessages(windSpeed('kmh').safeParse(371))).toEqual([
				'Wind speed cannot be greater than 370.40 km/h',
			]);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
