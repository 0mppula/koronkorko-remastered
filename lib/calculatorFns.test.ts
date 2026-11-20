import { describe, expect, it } from 'vitest';

import {
	calcualteBreakEvenPoint,
	calcualteCoumpoundInterest,
	calculateAnnualizedReturn,
	calculateCrosswind,
	calculateDividendYield,
	calculateDollarCostAverage,
	calculateEarningsPerShare,
	calculateEnterpriseValue,
	calculateEventProbability,
	calculateInvestmentTime,
	calculateLiquidationPrice,
	calculateMarkup,
	calculatePresentValue,
	calculateWindTriangle,
} from '@/lib/calculatorFns';
import { formDataToBaseUnits, fromBaseUnit } from '@/lib/units';
import {
	ICompoundInterestFormData,
	IDollarCostAverageFormData,
	IEventProbabilityFormData,
} from '@/types/calculations';

// Expected values come from standard formulas / published worked examples, not from running the code.

describe('calculateMarkup', () => {
	// Markup = (sales price - cost) / cost
	it('calculates profit and markup', () => {
		const result = calculateMarkup({ cost: 50, salesPrice: 75 });

		expect(result.profit).toBe(25);
		expect(result.markup).toBeCloseTo(50, 10);
	});

	it('returns a negative markup when selling below cost', () => {
		const result = calculateMarkup({ cost: 100, salesPrice: 80 });

		expect(result.profit).toBe(-20);
		expect(result.markup).toBeCloseTo(-20, 10);
	});

	it('returns -100% markup for a zero sales price', () => {
		expect(calculateMarkup({ cost: 100, salesPrice: 0 }).markup).toBeCloseTo(-100, 10);
	});

	it('handles very large values', () => {
		const result = calculateMarkup({ cost: 1e9, salesPrice: 1.5e9 });

		expect(result.profit).toBe(5e8);
		expect(result.markup).toBeCloseTo(50, 10);
	});
});

describe('calcualteBreakEvenPoint', () => {
	// BEP = fixed costs / (price - variable cost); CM = price - variable cost
	it('calculates the break-even point and contribution margin', () => {
		const result = calcualteBreakEvenPoint({
			fixedCosts: 10000,
			variableCostPerUnit: 30,
			pricePerUnit: 50,
		});

		expect(result.breakEvenPointUnits).toBeCloseTo(500, 10);
		expect(result.breakEvenPointMoney).toBeCloseTo(25000, 10);
		expect(result.contributionMarginMoney).toBe(20);
		expect(result.contributionMarginPercent).toBeCloseTo(40, 10);
	});

	it('has a 100% contribution margin with zero variable cost', () => {
		const result = calcualteBreakEvenPoint({
			fixedCosts: 10000,
			variableCostPerUnit: 0,
			pricePerUnit: 50,
		});

		expect(result.breakEvenPointUnits).toBeCloseTo(200, 10);
		expect(result.contributionMarginPercent).toBeCloseTo(100, 10);
	});

	it('breaks even at zero units with zero fixed costs', () => {
		const result = calcualteBreakEvenPoint({
			fixedCosts: 0,
			variableCostPerUnit: 30,
			pricePerUnit: 50,
		});

		expect(result.breakEvenPointUnits).toBe(0);
		expect(result.breakEvenPointMoney).toBe(0);
	});
});

describe('calculateInvestmentTime', () => {
	// T = ln(FV / PV) / ln(1 + r); doubling at 10% = ln 2 / ln 1.1 ≈ 7.2725 years
	it('calculates the time to double at 10%', () => {
		const result = calculateInvestmentTime({
			startingBalance: 1000,
			endingBalance: 2000,
			annualInterestRate: 10,
		});

		expect(result.yearsRequired).toBeCloseTo(7.2725409, 6);
		expect(result.monthsRequired).toBeCloseTo(87.2704908, 5);
		expect(result.daysRequired).toBeCloseTo(2654.4774, 3);
	});

	it('handles very large growth targets', () => {
		const result = calculateInvestmentTime({
			startingBalance: 1,
			endingBalance: 1e9,
			annualInterestRate: 7,
		});

		expect(result.yearsRequired).toBeCloseTo(306.29, 1);
	});
});

describe('calculatePresentValue', () => {
	// PV = FV / (1 + r)^n
	const base = { startingBalance: 1000, discountRate: 5, duration: 10, durationMultiplier: 12 };

	it('discounts over years', () => {
		expect(calculatePresentValue(base).presentValue).toBeCloseTo(613.91, 2);
	});

	it('discounts over months', () => {
		const result = calculatePresentValue({ ...base, duration: 6, durationMultiplier: 1 });

		expect(result.presentValue).toBeCloseTo(975.9, 2);
	});

	it('discounts over quarters', () => {
		const result = calculatePresentValue({ ...base, duration: 4, durationMultiplier: 3 });

		expect(result.presentValue).toBeCloseTo(952.38, 2);
	});

	it('equals the future value with a zero discount rate', () => {
		expect(calculatePresentValue({ ...base, discountRate: 0 }).presentValue).toBe(1000);
	});

	it('equals the future value with a zero duration', () => {
		expect(calculatePresentValue({ ...base, duration: 0 }).presentValue).toBe(1000);
	});

	it('is zero for a zero future value', () => {
		expect(calculatePresentValue({ ...base, startingBalance: 0 }).presentValue).toBe(0);
	});

	it('handles very long durations', () => {
		const result = calculatePresentValue({
			startingBalance: 1e6,
			discountRate: 10,
			duration: 200,
			durationMultiplier: 12,
		});

		expect(result.presentValue).toBeCloseTo(0.0052658, 6);
	});
});

describe('calculateAnnualizedReturn', () => {
	// CAGR = (EV / BV)^(1 / t) - 1
	it('calculates a 10% CAGR over 2 years', () => {
		const result = calculateAnnualizedReturn({
			startingBalance: 1000,
			endingBalance: 1210,
			duration: 2,
			durationMultiplier: 12,
		});

		expect(result.annualizedReturn).toBeCloseTo(10, 8);
		expect(result.percentReturn).toBeCloseTo(21, 8);
	});

	it('calculates a 10% CAGR over 5 years', () => {
		const result = calculateAnnualizedReturn({
			startingBalance: 10000,
			endingBalance: 16105.1,
			duration: 5,
			durationMultiplier: 12,
		});

		expect(result.annualizedReturn).toBeCloseTo(10, 8);
		expect(result.percentReturn).toBeCloseTo(61.051, 8);
	});

	it('calculates a negative CAGR for a loss', () => {
		const result = calculateAnnualizedReturn({
			startingBalance: 1000,
			endingBalance: 810,
			duration: 2,
			durationMultiplier: 12,
		});

		expect(result.annualizedReturn).toBeCloseTo(-10, 8);
	});

	it('annualizes a sub-year duration in quarters', () => {
		const result = calculateAnnualizedReturn({
			startingBalance: 1000,
			endingBalance: 1100,
			duration: 2,
			durationMultiplier: 3,
		});

		expect(result.annualizedReturn).toBeCloseTo(21, 8);
	});

	it('returns -100% when the ending value is zero', () => {
		const result = calculateAnnualizedReturn({
			startingBalance: 1000,
			endingBalance: 0,
			duration: 2,
			durationMultiplier: 12,
		});

		expect(result.annualizedReturn).toBe(-100);
		expect(result.percentReturn).toBe(-100);
	});
});

describe('calcualteCoumpoundInterest', () => {
	// FV = P(1 + r/n)^(nt) + PMT * ((1 + r/n)^(nt) - 1) / (r/n); APY = (1 + r/n)^n - 1
	const base: ICompoundInterestFormData = {
		startingBalance: 0,
		contribution: 0,
		contributionMultiplier: 1,
		contributionFrequency: 12,
		interestRate: 5,
		compoundFrequency: 12,
		duration: 10,
		durationMultiplier: 12,
	};

	it('compounds a principal monthly (investor.gov example)', () => {
		const result = calcualteCoumpoundInterest({ ...base, startingBalance: 10000 });

		expect(result.futureValue).toBeCloseTo(16470.09, 1);
		expect(result.totalProfit).toBeCloseTo(6470.09, 1);
		expect(result.totalReturn).toBeCloseTo(5.116, 3);
	});

	it('compounds a principal yearly', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 1000,
			interestRate: 10,
			compoundFrequency: 1,
			contributionFrequency: 1,
			duration: 2,
		});

		expect(result.futureValue).toBeCloseTo(1210, 8);
		expect(result.totalReturn).toBeCloseTo(10, 8);
	});

	it('calculates the future value of monthly contributions (ordinary annuity)', () => {
		const result = calcualteCoumpoundInterest({ ...base, contribution: 100, interestRate: 6 });

		expect(result.futureValue).toBeCloseTo(16387.93, 1);
		expect(result.totalContribution).toBe(12000);
		expect(result.totalProfit).toBeCloseTo(4387.93, 1);
	});

	it('combines principal and monthly contributions', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 5000,
			contribution: 100,
		});

		expect(result.futureValue).toBeCloseTo(23763.28, 1);
		expect(result.totalContribution).toBe(17000);
		expect(result.totalProfit).toBeCloseTo(6763.28, 1);
		expect(result.totalReturnPercent).toBeCloseTo(39.78, 1);
		expect(result.depositting).toBe(true);
	});

	it('handles monthly withdrawals', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 10000,
			contribution: 100,
			contributionMultiplier: -1,
			interestRate: 6,
			duration: 1,
		});

		expect(result.futureValue).toBeCloseTo(9383.22, 1);
		expect(result.totalContribution).toBe(8800);
		expect(result.totalProfit).toBeCloseTo(583.22, 1);
		expect(result.totalReturnPercent).toBeCloseTo(5.832, 2);
		expect(result.depositting).toBe(false);
	});

	it('aggregates monthly contributions into yearly compounding periods', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			contribution: 100,
			interestRate: 6,
			compoundFrequency: 1,
		});

		expect(result.futureValue).toBeCloseTo(15816.95, 1);
	});

	it('returns principal plus contributions with a zero interest rate', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 1000,
			contribution: 100,
			interestRate: 0,
			duration: 1,
		});

		expect(result.futureValue).toBe(2200);
		expect(result.totalContribution).toBe(2200);
		expect(result.totalReturn).toBe(0);
	});

	// FINDING: with a 0% rate the annuity term is 0/0, so totalProfit is NaN instead of 0
	it('has zero profit with a zero interest rate', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 1000,
			contribution: 100,
			interestRate: 0,
			duration: 1,
		});

		expect(result.totalProfit).toBe(0);
	});

	// FINDING: with a 0% rate totalReturnPercent is NaN instead of 0
	it('has a zero return percent with a zero interest rate', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 1000,
			contribution: 100,
			interestRate: 0,
			duration: 1,
		});

		expect(result.totalReturnPercent).toBe(0);
	});

	it('handles very long durations', () => {
		const result = calcualteCoumpoundInterest({
			...base,
			startingBalance: 1000,
			interestRate: 10,
			compoundFrequency: 1,
			contributionFrequency: 1,
			duration: 200,
		});

		expect(result.futureValue / 1.89905275e11).toBeCloseTo(1, 4);
	});
});

describe('calculateEventProbability', () => {
	// Binomial: P(at least once) = 1 - (1 - p)^T; P(exactly once) = T * p * (1 - p)^(T - 1)
	const calc = (data: IEventProbabilityFormData) => calculateEventProbability(data);

	it('calculates two coin flips', () => {
		const result = calc({ eventProbabilityPercent: 50, eventTries: 2 });

		expect(result.atLeastOnceProbabilityPercent).toBeCloseTo(75, 10);
		expect(result.neverOccuresProbabilityPercent).toBeCloseTo(25, 10);
		expect(result.exactlyOnceProbabilityPercent).toBeCloseTo(50, 10);
		expect(result.moreThanOnceProbabilityPercent).toBeCloseTo(25, 10);
	});

	it("calculates de Méré's problem (a six in four rolls)", () => {
		const result = calc({ eventProbabilityPercent: 100 / 6, eventTries: 4 });

		expect(result.atLeastOnceProbabilityPercent).toBeCloseTo((671 / 1296) * 100, 8);
		expect(result.exactlyOnceProbabilityPercent).toBeCloseTo((500 / 1296) * 100, 8);
		expect(result.moreThanOnceProbabilityPercent).toBeCloseTo((171 / 1296) * 100, 8);
	});

	it('never occurs with a zero probability', () => {
		const result = calc({ eventProbabilityPercent: 0, eventTries: 10 });

		expect(result.atLeastOnceProbabilityPercent).toBe(0);
		expect(result.neverOccuresProbabilityPercent).toBe(100);
		expect(result.exactlyOnceProbabilityPercent).toBe(0);
		expect(result.moreThanOnceProbabilityPercent).toBe(0);
	});

	it('always occurs on every try with a 100% probability', () => {
		const result = calc({ eventProbabilityPercent: 100, eventTries: 5 });

		expect(result.atLeastOnceProbabilityPercent).toBe(100);
		expect(result.neverOccuresProbabilityPercent).toBe(0);
		expect(result.exactlyOnceProbabilityPercent).toBe(0);
		expect(result.moreThanOnceProbabilityPercent).toBe(100);
	});

	it('never occurs with zero tries', () => {
		const result = calc({ eventProbabilityPercent: 30, eventTries: 0 });

		expect(result.atLeastOnceProbabilityPercent).toBe(0);
		expect(result.neverOccuresProbabilityPercent).toBe(100);
		expect(result.exactlyOnceProbabilityPercent).toBe(0);
		expect(result.moreThanOnceProbabilityPercent).toBe(0);
	});

	// FINDING: T * p * (1 - p)^(T - 1) is 0 * 0^-1 = NaN for p = 100%, T = 0
	it('has a zero exactly-once probability with 100% and zero tries', () => {
		const result = calc({ eventProbabilityPercent: 100, eventTries: 0 });

		expect(result.exactlyOnceProbabilityPercent).toBe(0);
	});

	it('handles a large number of tries', () => {
		const result = calc({ eventProbabilityPercent: 1, eventTries: 1000 });

		expect(result.atLeastOnceProbabilityPercent).toBeCloseTo(99.995683, 4);
		expect(result.exactlyOnceProbabilityPercent).toBeCloseTo(0.0436073, 4);
	});
});

describe('calculateEarningsPerShare', () => {
	// P/E = share price / earnings per share
	it('calculates the P/E ratio', () => {
		expect(calculateEarningsPerShare({ sharePrice: 100, earningsPerShare: 5 }).peRatio).toBe(
			20
		);
		expect(calculateEarningsPerShare({ sharePrice: 50, earningsPerShare: 2.5 }).peRatio).toBe(
			20
		);
	});

	it('handles very small earnings', () => {
		const result = calculateEarningsPerShare({ sharePrice: 100, earningsPerShare: 0.01 });

		expect(result.peRatio).toBeCloseTo(10000, 8);
	});

	it('is zero for a zero share price', () => {
		expect(calculateEarningsPerShare({ sharePrice: 0, earningsPerShare: 5 }).peRatio).toBe(0);
	});

	it('is negative for negative earnings', () => {
		expect(calculateEarningsPerShare({ sharePrice: 100, earningsPerShare: -5 }).peRatio).toBe(
			-20
		);
	});
});

describe('calculateDollarCostAverage', () => {
	// Average cost = total invested / total shares; price grows by (1 + r/n)^(n * years)
	const base: IDollarCostAverageFormData = {
		initialInvestment: 1000,
		sharePrice: 10,
		deposit: 100,
		depositFrequency: 365,
		interestRate: 0,
		compoundFrequency: 1,
		duration: 2,
		durationMultiplier: 12,
	};

	it('averages yearly deposits at a constant price', () => {
		const result = calculateDollarCostAverage(base);

		expect(result.totalShares).toBeCloseTo(120, 10);
		expect(result.dollarCostAverage).toBeCloseTo(10, 10);
		expect(result.endingValue).toBeCloseTo(1200, 10);
		expect(result.newSharePrice).toBe(10);
		expect(result.AbosluteReturnPercent).toBe(0);
	});

	// FINDING: totalInvested adds deposit * i instead of deposit * (i + 1), missing the last deposit
	it('includes every deposit in the total invested', () => {
		expect(calculateDollarCostAverage(base).totalInvested).toBe(1200);
	});

	it('averages yearly deposits with a 10% yearly price increase', () => {
		const result = calculateDollarCostAverage({ ...base, interestRate: 10 });

		expect(result.newSharePrice).toBeCloseTo(12.1, 10);
		expect(result.totalShares).toBeCloseTo(117.355372, 6);
		expect(result.dollarCostAverage).toBeCloseTo(10.225352, 6);
		expect(result.endingValue).toBeCloseTo(1420, 8);
		expect(result.AbosluteReturnPercent).toBeCloseTo(21, 8);
	});

	// FINDING: the totalInvested off-by-one makes totalReturn 320 instead of 220
	it('calculates the total return with a 10% yearly price increase', () => {
		const result = calculateDollarCostAverage({ ...base, interestRate: 10 });

		expect(result.totalReturn).toBeCloseTo(220, 8);
		expect(result.totalReturnPercent).toBeCloseTo(18.333333, 5);
	});

	it('makes exactly 12 monthly deposits in a year', () => {
		const result = calculateDollarCostAverage({
			...base,
			depositFrequency: 30.416666666666666666666666666667,
			duration: 1,
		});

		expect(result.totalShares).toBeCloseTo(220, 10);
		expect(result.dollarCostAverage).toBeCloseTo(10, 10);
	});

	it('makes no deposits with a zero duration', () => {
		const result = calculateDollarCostAverage({ ...base, interestRate: 10, duration: 0 });

		expect(result.totalShares).toBe(100);
		expect(result.dollarCostAverage).toBe(10);
		expect(result.totalInvested).toBe(1000);
		expect(result.endingValue).toBe(1000);
		expect(result.totalReturn).toBe(0);
		expect(result.newSharePrice).toBe(10);
	});
});

describe('calculateEnterpriseValue', () => {
	// EV = market cap + debt - cash
	it('calculates market cap and enterprise value', () => {
		const result = calculateEnterpriseValue({
			sharePrice: 50,
			sharesOutstanding: 1_000_000,
			cash: 5_000_000,
			debt: 10_000_000,
		});

		expect(result.marketCap).toBe(50_000_000);
		expect(result.enterpriseValue).toBe(55_000_000);
	});

	it('can be negative when cash exceeds market cap plus debt', () => {
		const result = calculateEnterpriseValue({
			sharePrice: 10,
			sharesOutstanding: 1000,
			cash: 50_000,
			debt: 0,
		});

		expect(result.enterpriseValue).toBe(-40_000);
	});

	it('is zero for all-zero inputs', () => {
		const result = calculateEnterpriseValue({
			sharePrice: 0,
			sharesOutstanding: 0,
			cash: 0,
			debt: 0,
		});

		expect(result.marketCap).toBe(0);
		expect(result.enterpriseValue).toBe(0);
	});

	it('handles very large values', () => {
		const result = calculateEnterpriseValue({
			sharePrice: 190,
			sharesOutstanding: 15_500_000_000,
			cash: 0,
			debt: 0,
		});

		expect(result.marketCap).toBe(2.945e12);
	});
});

describe('calculateLiquidationPrice', () => {
	// Simplified long position without maintenance margin: entry * (1 - 1 / leverage)
	it('calculates the liquidation price at 10x', () => {
		const result = calculateLiquidationPrice({ entryPrice: 100, leverageRatio: 10 });

		expect(result.liquidationPrice).toBeCloseTo(90, 10);
		expect(result.priceChangePercent).toBeCloseTo(-10, 10);
	});

	it('calculates the liquidation price at 2x', () => {
		const result = calculateLiquidationPrice({ entryPrice: 100, leverageRatio: 2 });

		expect(result.liquidationPrice).toBe(50);
		expect(result.priceChangePercent).toBe(-50);
	});

	it('liquidates at zero without leverage', () => {
		const result = calculateLiquidationPrice({ entryPrice: 100, leverageRatio: 1 });

		expect(result.liquidationPrice).toBe(0);
		expect(result.priceChangePercent).toBe(-100);
	});

	it('handles high leverage', () => {
		expect(
			calculateLiquidationPrice({ entryPrice: 30000, leverageRatio: 100 }).liquidationPrice
		).toBeCloseTo(29700, 8);
		expect(
			calculateLiquidationPrice({ entryPrice: 100, leverageRatio: 125 }).priceChangePercent
		).toBeCloseTo(-0.8, 10);
	});
});

describe('calculateDividendYield', () => {
	// Yield = annual dividend / share price
	it('calculates a quarterly dividend yield', () => {
		const result = calculateDividendYield({
			dividendAmount: 0.5,
			distributionFrequency: 4,
			sharePrice: 50,
		});

		expect(result.annualizedDividend).toBe(2);
		expect(result.dividendYieldPercent).toBeCloseTo(4, 10);
	});

	it('calculates a monthly dividend yield', () => {
		const result = calculateDividendYield({
			dividendAmount: 0.1,
			distributionFrequency: 12,
			sharePrice: 12,
		});

		expect(result.annualizedDividend).toBeCloseTo(1.2, 10);
		expect(result.dividendYieldPercent).toBeCloseTo(10, 10);
	});

	it('calculates a yearly dividend yield', () => {
		const result = calculateDividendYield({
			dividendAmount: 3,
			distributionFrequency: 1,
			sharePrice: 100,
		});

		expect(result.dividendYieldPercent).toBeCloseTo(3, 10);
	});

	it('is zero with no dividend', () => {
		const result = calculateDividendYield({
			dividendAmount: 0,
			distributionFrequency: 4,
			sharePrice: 50,
		});

		expect(result.annualizedDividend).toBe(0);
		expect(result.dividendYieldPercent).toBe(0);
	});

	it('handles a very large share price', () => {
		const result = calculateDividendYield({
			dividendAmount: 1,
			distributionFrequency: 4,
			sharePrice: 1e6,
		});

		expect(result.dividendYieldPercent).toBeCloseTo(0.0004, 10);
	});
});

describe('calculateCrosswind', () => {
	// Crosswind = V·sin θ, headwind = V·cos θ (exact trigonometry)
	const SQRT3_2 = Math.sqrt(3) / 2;
	const SQRT2_2 = Math.SQRT2 / 2;

	it.each([
		{ runway: 60, wind: 90, speed: 20, angle: 30, crosswind: 10, headwind: 20 * SQRT3_2 },
		{ runway: 60, wind: 30, speed: 20, angle: -30, crosswind: -10, headwind: 20 * SQRT3_2 },
		{ runway: 60, wind: 60, speed: 15, angle: 0, crosswind: 0, headwind: 15 },
		{ runway: 60, wind: 240, speed: 10, angle: 180, crosswind: 0, headwind: -10 },
		{ runway: 60, wind: 150, speed: 12, angle: 90, crosswind: 12, headwind: 0 },
		{
			runway: 270,
			wind: 315,
			speed: 30,
			angle: 45,
			crosswind: 30 * SQRT2_2,
			headwind: 30 * SQRT2_2,
		},
		// sin 10° = 0.173648, cos 10° = 0.984808, sin 20° = 0.342020, cos 20° = 0.939693
		{ runway: 360, wind: 10, speed: 20, angle: 10, crosswind: 3.47296, headwind: 19.69616 },
		{ runway: 10, wind: 350, speed: 20, angle: -20, crosswind: -6.8404, headwind: 18.79386 },
		{ runway: 60, wind: 90, speed: 0, angle: 30, crosswind: 0, headwind: 0 },
	])(
		'runway $runway, wind $wind at $speed kt',
		({ runway, wind, speed, angle, crosswind, headwind }) => {
			const result = calculateCrosswind({
				runwayHeading: runway,
				windDirection: wind,
				windSpeed: speed,
			});

			expect(result.windAngle).toBeCloseTo(angle, 10);
			expect(result.crosswind).toBeCloseTo(crosswind, 4);
			expect(result.headwind).toBeCloseTo(headwind, 4);
		}
	);

	it('calculates gust components with the same wind direction', () => {
		const result = calculateCrosswind({
			runwayHeading: 60,
			windDirection: 90,
			windSpeed: 20,
			gustSpeed: 30,
		});

		expect(result.crosswind).toBeCloseTo(10, 4);
		expect(result.headwind).toBeCloseTo(20 * SQRT3_2, 4);
		expect(result.gustCrosswind).toBeCloseTo(15, 4);
		expect(result.gustHeadwind).toBeCloseTo(30 * SQRT3_2, 4);
	});

	it('has no gust components without a gust', () => {
		for (const gustSpeed of [undefined, null]) {
			const result = calculateCrosswind({
				runwayHeading: 60,
				windDirection: 90,
				windSpeed: 20,
				gustSpeed,
			});

			expect(result.gustCrosswind).toBeUndefined();
			expect(result.gustHeadwind).toBeUndefined();
		}
	});

	it('returns the inputs unchanged', () => {
		const formData = { runwayHeading: 87, windDirection: 120, windSpeed: 12, gustSpeed: 22 };

		expect(calculateCrosswind(formData)).toMatchObject(formData);
	});

	it('works with wind speeds entered in km/h', () => {
		// 37.04 km/h = 20 kt (1 kt = 1.852 km/h exactly)
		const formData = formDataToBaseUnits(
			{ runwayHeading: 60, windDirection: 90, windSpeed: 37.04 },
			{ windSpeed: 'speed' },
			{ speed: 'kmh', altitude: 'ft', temperature: 'c' }
		);

		expect(formData.windSpeed).toBeCloseTo(20, 10);

		const result = calculateCrosswind(formData);

		expect(result.crosswind).toBeCloseTo(10, 4);
		expect(fromBaseUnit(result.crosswind, 'speed', 'kmh')).toBeCloseTo(18.52, 4);
	});
});

describe('calculateWindTriangle', () => {
	// WCA = asin(WS·sin δ / TAS), GS = TAS·cos WCA − WS·cos δ, δ = wind direction − course.
	// Expected values are exact derivations from these formulas. Sources opened and checked:
	// - Ed Williams, Aviation Formulary V1.47, "Wind Triangles (2) Find HD, GS"
	//   (https://edwilliams.org/avform147.htm): confirms the formula and sign convention (wind from
	//   the right gives a positive WCA); it has no numeric wind triangle example.
	// - Omni Wind Correction Angle Calculator worked example
	//   (https://www.omnicalculator.com/physics/wind-correction-angle): TC 090, TAS 100, wind
	//   045/20 gives WCA −8° and heading 082°, whole degrees only, confirms the Omni case.
	// - Omni Ground Speed Calculator FAQ (https://www.omnicalculator.com/physics/ground-speed):
	//   GS = TAS + WS in a pure tailwind and TAS − WS in a pure headwind (80/20 kt), GS = TAS in
	//   still air; confirms the rules behind rows 1, 2 and 6.
	// Not independently verified: rows 3, 4 and 5 (no source with these numbers was found).
	const SQRT3_2 = Math.sqrt(3) / 2;
	const ASIN_0_1 = 5.739170477266787; // asin(0.1) in degrees

	it.each([
		{ tc: 90, tas: 100, wd: 90, ws: 20, wca: 0, th: 90, gs: 80 },
		{ tc: 90, tas: 100, wd: 270, ws: 20, wca: 0, th: 90, gs: 120 },
		{ tc: 360, tas: 100, wd: 90, ws: 50, wca: 30, th: 30, gs: 100 * SQRT3_2 },
		{ tc: 10, tas: 100, wd: 280, ws: 50, wca: -30, th: 340, gs: 100 * SQRT3_2 },
		{
			tc: 180,
			tas: 100,
			wd: 210,
			ws: 20,
			wca: ASIN_0_1,
			th: 180 + ASIN_0_1,
			gs: Math.sqrt(9900) - 10 * Math.sqrt(3),
		},
		{ tc: 123, tas: 110, wd: 360, ws: 0, wca: 0, th: 123, gs: 110 },
	])('course $tc, TAS $tas, wind $wd at $ws kt', ({ tc, tas, wd, ws, wca, th, gs }) => {
		const result = calculateWindTriangle({
			trueCourse: tc,
			trueAirspeed: tas,
			windDirection: wd,
			windSpeed: ws,
		});

		expect(result.windCorrectionAngle).toBeCloseTo(wca, 3);
		expect(result.trueHeading).toBeCloseTo(th, 3);
		expect(result.groundspeed).toBeCloseTo(gs, 4);
	});

	it('matches the Omni worked example (course 090, TAS 100, wind 045 at 20 kt)', () => {
		const result = calculateWindTriangle({
			trueCourse: 90,
			trueAirspeed: 100,
			windDirection: 45,
			windSpeed: 20,
		});

		// Omni rounds to whole degrees.
		expect(Math.round(result.windCorrectionAngle)).toBe(-8);
		expect(Math.round(result.trueHeading)).toBe(82);
		// asin(−0.2·sin 45°) = −8.1301°; GS = 100·√0.98 − 20·cos 45° = 60√2
		expect(result.windCorrectionAngle).toBeCloseTo(-8.1301, 3);
		expect(result.groundspeed).toBeCloseTo(60 * Math.SQRT2, 4);
	});

	it('keeps the heading in [0, 360) when it wraps across north', () => {
		const left = calculateWindTriangle({
			trueCourse: 10,
			trueAirspeed: 100,
			windDirection: 280,
			windSpeed: 50,
		});
		const right = calculateWindTriangle({
			trueCourse: 350,
			trueAirspeed: 100,
			windDirection: 80,
			windSpeed: 50,
		});

		expect(left.trueHeading).toBeCloseTo(340, 3);
		expect(right.trueHeading).toBeCloseTo(20, 3);

		for (const { trueHeading } of [left, right]) {
			expect(trueHeading).toBeGreaterThanOrEqual(0);
			expect(trueHeading).toBeLessThan(360);
		}
	});

	it('returns the inputs unchanged', () => {
		const formData = { trueCourse: 87, trueAirspeed: 120, windDirection: 120, windSpeed: 12 };

		expect(calculateWindTriangle(formData)).toMatchObject(formData);
	});

	it('works with speeds entered in km/h', () => {
		// 185.2 km/h = 100 kt and 92.6 km/h = 50 kt (1 kt = 1.852 km/h exactly)
		const formData = formDataToBaseUnits(
			{ trueCourse: 360, trueAirspeed: 185.2, windDirection: 90, windSpeed: 92.6 },
			{ trueAirspeed: 'speed', windSpeed: 'speed' },
			{ speed: 'kmh', altitude: 'ft', temperature: 'c' }
		);

		const result = calculateWindTriangle(formData);

		expect(result.windCorrectionAngle).toBeCloseTo(30, 3);
		expect(result.trueHeading).toBeCloseTo(30, 3);
		expect(result.groundspeed).toBeCloseTo(100 * SQRT3_2, 4);
		expect(fromBaseUnit(result.groundspeed, 'speed', 'kmh')).toBeCloseTo(160.3879, 4);
	});

	it('gives a finite result when the crosswind equals the TAS after a unit conversion', () => {
		const formData = formDataToBaseUnits(
			{ trueCourse: 360, trueAirspeed: 185.2, windDirection: 90, windSpeed: 185.2 },
			{ trueAirspeed: 'speed', windSpeed: 'speed' },
			{ speed: 'kmh', altitude: 'ft', temperature: 'c' }
		);

		const result = calculateWindTriangle(formData);

		expect(result.windCorrectionAngle).toBeCloseTo(90, 3);
		expect(result.groundspeed).toBeCloseTo(0, 4);
	});
});
