import { describe, expect, it } from 'vitest';

import {
	calcualteBreakEvenPoint,
	calcualteCoumpoundInterest,
	calculateAnnualizedReturn,
	calculateCloudBase,
	calculateCrosswind,
	calculateDensityAltitude,
	calculateDescentPlanning,
	calculateDividendYield,
	calculateDollarCostAverage,
	calculateEarningsPerShare,
	calculateEnterpriseValue,
	calculateEventProbability,
	calculateFuelPlanning,
	calculateGlideDistance,
	calculateHeading,
	calculateInvestmentTime,
	calculateLiquidationPrice,
	calculateMach,
	calculateMarkup,
	calculatePresentValue,
	calculateTimeSpeedDistance,
	calculateTrueAirspeed,
	calculateTurnPerformance,
	calculateWindTriangle,
} from '@/lib/calculatorFns';
import {
	BASE_UNITS,
	formDataToBaseUnits,
	formatBaseValue,
	formatUnsignedTemperatureDifference,
	fromBaseUnit,
	normalizeDegrees,
	signedAngleDifference,
	UnitFields,
	UnitPreferences,
} from '@/lib/units';
import {
	ICompoundInterestFormData,
	IDescentPlanningFormData,
	IDollarCostAverageFormData,
	IEventProbabilityFormData,
	IFuelPlanningFormData,
	ITimeSpeedDistanceFormData,
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
			{ ...BASE_UNITS, speed: 'kmh' }
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
	// Not found in any source: rows 3, 4 and 5. They, like every row and the Omni case, are verified
	// by vector addition (TAS along the heading + wind = groundspeed along the course), an
	// independent method that doesn't use the asin formula.
	const SQRT3_2 = Math.sqrt(3) / 2;
	const ASIN_0_1 = 5.739170477266787; // asin(0.1) in degrees

	const tableCases = [
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
	];
	const omniCase = {
		tc: 90,
		tas: 100,
		wd: 45,
		ws: 20,
		wca: -8.1301,
		th: 81.8699,
		gs: 60 * Math.SQRT2,
	};

	it.each(tableCases)(
		'course $tc, TAS $tas, wind $wd at $ws kt',
		({ tc, tas, wd, ws, wca, th, gs }) => {
			const result = calculateWindTriangle({
				trueCourse: tc,
				trueAirspeed: tas,
				windDirection: wd,
				windSpeed: ws,
			});

			expect(result.windCorrectionAngle).toBeCloseTo(wca, 3);
			expect(result.trueHeading).toBeCloseTo(th, 3);
			expect(result.groundspeed).toBeCloseTo(gs, 4);
		}
	);

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

	// Vectors as (east, north); a bearing b points along (sin b, cos b).
	const bearingVector = (bearing: number, length: number) => {
		const radians = (bearing * Math.PI) / 180;

		return { east: length * Math.sin(radians), north: length * Math.cos(radians) };
	};

	it.each([...tableCases, omniCase])(
		'adds up as vectors: course $tc, TAS $tas, wind $wd at $ws kt',
		({ tc, tas, wd, ws, th, gs }) => {
			const result = calculateWindTriangle({
				trueCourse: tc,
				trueAirspeed: tas,
				windDirection: wd,
				windSpeed: ws,
			});

			// Checks both the expected table values and the calculated result.
			for (const { heading, groundspeed } of [
				{ heading: th, groundspeed: gs },
				{ heading: result.trueHeading, groundspeed: result.groundspeed },
			]) {
				const air = bearingVector(heading, tas);
				// The wind blows toward the opposite of the direction it comes from.
				const wind = bearingVector(wd + 180, ws);
				const ground = { east: air.east + wind.east, north: air.north + wind.north };
				const course = bearingVector(tc, 1);

				const along = ground.east * course.east + ground.north * course.north;
				const across = ground.east * course.north - ground.north * course.east;

				expect(across).toBeCloseTo(0, 4);
				expect(along).toBeCloseTo(groundspeed, 4);
				expect(Math.hypot(ground.east, ground.north)).toBeCloseTo(groundspeed, 4);
			}
		}
	);

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
			{ ...BASE_UNITS, speed: 'kmh' }
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
			{ ...BASE_UNITS, speed: 'kmh' }
		);

		const result = calculateWindTriangle(formData);

		expect(result.windCorrectionAngle).toBeCloseTo(90, 3);
		expect(result.groundspeed).toBeCloseTo(0, 4);
	});
});

describe('calculateDensityAltitude', () => {
	// ICAO Standard Atmosphere troposphere: T0 288.15 K, P0 1013.25 hPa, L 0.0065 K/m,
	// g0 9.80665 m/s², R 287.05287 J/(kg·K), n = g0/(R·L), ρ0 = P0/(R·T0) = 1.225 kg/m³.
	// The forward relations below (pressure and density at an altitude) are written here
	// independently of calculateDensityAltitude, which solves them for altitude.
	// Sources opened and checked:
	// - Engineering ToolBox, "International Standard Atmosphere"
	//   (https://www.engineeringtoolbox.com/international-standard-atmosphere-d_985.html): pressure
	//   (bar) and density ratio ρ/ρ0 by altitude in metres, 4–5 significant digits. The table matches
	//   these formulas at geometric altitude (z = r0·h/(r0 − h), r0 = 6356766 m, as given in the
	//   Wikipedia "International Standard Atmosphere" article), not at geopotential altitude.
	// - Hot-day and non-standard cases: expected values computed by hand-written code with
	//   40-digit decimals from the formulas above (not by running calculateDensityAltitude).
	//   5000 ft, 1013.25 hPa, 30 °C was also checked by hand (≈ 7801 ft).
	// Not checked: no online density altitude calculator. The NWS calculator
	// (https://www.weather.gov/epz/wxcalc_densityaltitude) only runs in the browser and takes
	// station pressure and dew point, not QNH; the FAA PHAK chapter PDF couldn't be read.
	const T0 = 288.15;
	const P0 = 1013.25;
	const LAPSE_RATE = 0.0065;
	const R = 287.05287;
	const N = 9.80665 / (R * LAPSE_RATE);
	const RHO0 = (P0 * 100) / (R * T0);
	const FT = 0.3048;
	const TROPOPAUSE_FT = 11000 / FT;

	const isaPressureHpa = (altitudeM: number) => P0 * (1 - (LAPSE_RATE * altitudeM) / T0) ** N;
	const isaDensity = (altitudeM: number) => RHO0 * (1 - (LAPSE_RATE * altitudeM) / T0) ** (N - 1);
	const geopotential = (geometricM: number) => (6356766 * geometricM) / (6356766 + geometricM);

	describe('forward ISA relations used by these tests', () => {
		it('give ρ0 = 1.225 kg/m³ at sea level', () => {
			expect(RHO0).toBeCloseTo(1.225, 6);
			expect(N).toBeCloseTo(5.25588, 5);
		});

		it.each([
			{ z: -500, bar: 1.0748, ratio: 1.0489 },
			{ z: 1000, bar: 0.8988, ratio: 0.9075 },
			{ z: 2000, bar: 0.795, ratio: 0.8217 },
			{ z: 5000, bar: 0.5405, ratio: 0.6012 },
			{ z: 10000, bar: 0.265, ratio: 0.3376 },
		])('match the published ISA table at $z m', ({ z, bar, ratio }) => {
			const h = geopotential(z);

			// The table rounds to 0.1 hPa and 4 decimals.
			expect(Math.abs(isaPressureHpa(h) - bar * 1000)).toBeLessThanOrEqual(0.05);
			expect(isaDensity(h) / RHO0).toBeCloseTo(ratio, 4);
		});
	});

	it('gives zero everywhere at ISA sea level', () => {
		const result = calculateDensityAltitude({
			fieldElevation: 0,
			qnh: 1013.25,
			outsideAirTemperature: 15,
		});

		expect(result.pressureAltitude).toBeCloseTo(0, 9);
		expect(result.isaTemperature).toBeCloseTo(15, 9);
		expect(result.isaDeviation).toBeCloseTo(0, 9);
		expect(result.densityAltitude).toBeCloseTo(0, 6);
	});

	// ISA temperature at 5000 ft: 15 − 0.0065 × 5000 × 0.3048 = 5.094 °C.
	it('gives PA = DA = 5000 ft at 5000 ft on an ISA day', () => {
		const result = calculateDensityAltitude({
			fieldElevation: 5000,
			qnh: 1013.25,
			outsideAirTemperature: 5.094,
		});

		expect(result.pressureAltitude).toBeCloseTo(5000, 6);
		expect(result.isaTemperature).toBeCloseTo(5.094, 9);
		expect(result.isaDeviation).toBeCloseTo(0, 9);
		expect(result.densityAltitude).toBeCloseTo(5000, 6);
	});

	it.each([-1500, 0, 1234.5, 5000, 12000, 20000])(
		'gives PA = elevation at %s ft with standard pressure',
		(fieldElevation) => {
			const result = calculateDensityAltitude({
				fieldElevation,
				qnh: 1013.25,
				outsideAirTemperature: 0,
			});

			expect(result.pressureAltitude).toBeCloseTo(fieldElevation, 6);
		}
	);

	// Rounded to 0.01 ft and 0.0001 °C.
	it.each([
		{ e: 5000, qnh: 1013.25, oat: 30, pa: 5000, isa: 5.094, da: 7800.73 },
		{ e: 0, qnh: 1013.25, oat: 35, pa: 0, isa: 15, da: 2275.31 },
		{ e: 2000, qnh: 995, oat: 25, pa: 2495.19, isa: 10.0565, da: 4211.9 },
		{ e: 0, qnh: 1035, oat: -20, pa: -588.91, isa: 16.1667, da: -5243.68 },
		{ e: 7000, qnh: 1020, oat: 30, pa: 6825, isa: 1.4783, da: 10006.21 },
	])('elevation $e ft, QNH $qnh hPa, OAT $oat °C', ({ e, qnh, oat, pa, isa, da }) => {
		const result = calculateDensityAltitude({
			fieldElevation: e,
			qnh,
			outsideAirTemperature: oat,
		});

		expect(result.pressureAltitude).toBeCloseTo(pa, 1);
		expect(result.isaTemperature).toBeCloseTo(isa, 3);
		expect(result.isaDeviation).toBeCloseTo(oat - isa, 3);
		expect(result.densityAltitude).toBeCloseTo(da, 1);
	});

	const corners = [-1500, 20000].flatMap((e) =>
		[900, 1100].flatMap((qnh) => [-60, 60].map((oat) => ({ e, qnh, oat })))
	);
	const grid = [-1500, 0, 5000, 12000, 20000].flatMap((e) =>
		[900, 1013.25, 1100].flatMap((qnh) => [-60, 15, 60].map((oat) => ({ e, qnh, oat })))
	);

	it.each([...corners, ...grid])(
		'is consistent with the ISA at elevation $e ft, QNH $qnh hPa, OAT $oat °C',
		({ e, qnh, oat }) => {
			const result = calculateDensityAltitude({
				fieldElevation: e,
				qnh,
				outsideAirTemperature: oat,
			});
			const stationPressure = (qnh / P0) * isaPressureHpa(e * FT);
			const airDensity = (stationPressure * 100) / (R * (oat + 273.15));

			for (const value of Object.values(result)) {
				expect(Number.isFinite(value)).toBe(true);
			}

			expect(isaPressureHpa(result.pressureAltitude * FT) / stationPressure).toBeCloseTo(
				1,
				9
			);
			expect(isaDensity(result.densityAltitude * FT) / airDensity).toBeCloseTo(1, 9);
			expect(result.isaTemperature).toBeCloseTo(
				15 - LAPSE_RATE * result.pressureAltitude * FT,
				9
			);
			expect(result.isaDeviation).toBeCloseTo(oat - result.isaTemperature, 9);
			expect(result.pressureAltitude).toBeLessThan(TROPOPAUSE_FT);
			expect(result.densityAltitude).toBeLessThan(TROPOPAUSE_FT);
		}
	);

	it('gives the highest results at the hot, high, low-pressure corner of the limits', () => {
		const result = calculateDensityAltitude({
			fieldElevation: 20000,
			qnh: 900,
			outsideAirTemperature: 60,
		});

		expect(result.pressureAltitude).toBeCloseTo(22797.14, 1);
		expect(result.densityAltitude).toBeCloseTo(31562.89, 1);
	});

	it('gives a higher DA for a higher OAT at the same PA', () => {
		const results = [-10, 15, 40].map((outsideAirTemperature) =>
			calculateDensityAltitude({ fieldElevation: 3000, qnh: 1005, outsideAirTemperature })
		);

		expect(results[0].pressureAltitude).toBe(results[2].pressureAltitude);
		expect(results[1].densityAltitude).toBeGreaterThan(results[0].densityAltitude);
		expect(results[2].densityAltitude).toBeGreaterThan(results[1].densityAltitude);
	});

	it('gives a lower PA for a higher QNH at the same elevation', () => {
		const [low, high] = [990, 1030].map((qnh) =>
			calculateDensityAltitude({ fieldElevation: 3000, qnh, outsideAirTemperature: 15 })
		);

		expect(high.pressureAltitude).toBeLessThan(low.pressureAltitude);
		expect(high.densityAltitude).toBeLessThan(low.densityAltitude);
	});

	it('returns the inputs unchanged', () => {
		const formData = { fieldElevation: 1234, qnh: 1001.5, outsideAirTemperature: -7.5 };

		expect(calculateDensityAltitude(formData)).toMatchObject(formData);
	});

	// 1524 m = 5000 ft; 29.92 inHg = 1013.2079 hPa (not 1013.25); 41.17 °F = 5.0944 °C.
	it('works with values entered in m, inHg and °F', () => {
		const formData = formDataToBaseUnits(
			{ fieldElevation: 1524, qnh: 29.92, outsideAirTemperature: 41.17 },
			{ fieldElevation: 'altitude', qnh: 'pressure', outsideAirTemperature: 'temperature' },
			{ ...BASE_UNITS, altitude: 'm', pressure: 'inhg', temperature: 'f' }
		);

		const result = calculateDensityAltitude(formData);

		expect(formData.fieldElevation).toBeCloseTo(5000, 9);
		expect(result.pressureAltitude).toBeCloseTo(5001.11, 1);
		expect(result.densityAltitude).toBeCloseTo(5001.42, 1);
		expect(Math.abs(result.densityAltitude - 5000)).toBeLessThan(2);
	});
});

describe('calculateFuelPlanning', () => {
	// Fuel = burn rate × time; densities from FAA-H-8083-1B: AVGAS 6.0, Jet A 6.68 lb/US gal.
	const US_GAL = 3.785411784;
	const LB = 0.45359237;
	const AVGAS = (6.0 * LB) / US_GAL;
	const JET_A = (6.68 * LB) / US_GAL;

	const base: IFuelPlanningFormData = {
		fuelBurnRate: 40,
		flightTime: 90,
		reserveTime: 45,
		taxiFuel: undefined,
		extraFuel: undefined,
		fuelType: 'avgas',
	};

	it.each([
		// burn, flight, reserve, taxi, extra, fuel, trip, reserve, total, density
		[40, 90, 45, undefined, undefined, 'avgas', 60, 30, 90, AVGAS],
		[40, 90, 45, undefined, undefined, 'jetA', 60, 30, 90, JET_A],
		[40, 90, 45, 5, 10, 'avgas', 60, 30, 105, AVGAS],
		[30, 0, 30, undefined, undefined, 'avgas', 0, 15, 15, AVGAS],
		[30, 60, 0, undefined, undefined, 'avgas', 30, 0, 30, AVGAS],
	] as const)(
		'%d L/h for %d min with %d min reserve, taxi %s, extra %s, %s',
		(
			fuelBurnRate,
			flightTime,
			reserveTime,
			taxiFuel,
			extraFuel,
			fuelType,
			trip,
			reserve,
			total,
			density
		) => {
			const result = calculateFuelPlanning({
				fuelBurnRate,
				flightTime,
				reserveTime,
				taxiFuel,
				extraFuel,
				fuelType,
			});

			expect(result.tripFuel).toBeCloseTo(trip, 12);
			expect(result.reserveFuel).toBeCloseTo(reserve, 12);
			expect(result.totalFuel).toBeCloseTo(total, 12);
			expect(result.fuelDensity).toBe(density);
			expect(result.totalFuelMass).toBeCloseTo(total * density, 12);
		}
	);

	it('gives the total mass in kg from the densities', () => {
		// 90 L × 0.71896 kg/L and × 0.80044 kg/L
		expect(calculateFuelPlanning(base).totalFuelMass).toBeCloseTo(64.706, 3);
		expect(calculateFuelPlanning({ ...base, fuelType: 'jetA' }).totalFuelMass).toBeCloseTo(
			72.04,
			2
		);
	});

	it('counts missing or null taxi and extra fuel as 0', () => {
		const withNull = { ...base, taxiFuel: null, extraFuel: null };

		expect(calculateFuelPlanning(withNull).totalFuel).toBe(90);
		expect(calculateFuelPlanning(base).totalFuel).toBe(90);
	});

	it('returns the inputs unchanged', () => {
		const formData = { ...base, taxiFuel: 5.5, extraFuel: 0 };

		expect(calculateFuelPlanning(formData)).toMatchObject(formData);
	});

	describe('with values entered in US gal and lb', () => {
		const unitFields: UnitFields<IFuelPlanningFormData> = {
			fuelBurnRate: 'fuel',
			taxiFuel: 'fuel',
			extraFuel: 'fuel',
		};
		const getContext = ({ fuelType }: IFuelPlanningFormData) => ({
			fuelDensityKgPerL: fuelType === 'jetA' ? JET_A : AVGAS,
		});
		const withFuel = (fuel: UnitPreferences['fuel']): UnitPreferences => ({
			...BASE_UNITS,
			fuel,
		});

		const calculateIn = (formData: IFuelPlanningFormData, fuel: UnitPreferences['fuel']) =>
			calculateFuelPlanning(
				formDataToBaseUnits(formData, unitFields, withFuel(fuel), getContext)
			);

		const inUnit = (litres: number, unit: string, fuelType: string) =>
			fromBaseUnit(litres, 'fuel', unit, {
				fuelDensityKgPerL: fuelType === 'jetA' ? JET_A : AVGAS,
			});

		it.each([
			['avgas', 150],
			['jetA', 167],
		] as const)('10 US gal/h for 2 h + 30 min of %s is 25 US gal = %d lb', (fuelType, lb) => {
			const result = calculateIn(
				{ ...base, fuelBurnRate: 10, flightTime: 120, reserveTime: 30, fuelType },
				'usgal'
			);

			expect(inUnit(result.totalFuel, 'usgal', fuelType)).toBeCloseTo(25, 6);
			expect(inUnit(result.totalFuel, 'lb', fuelType)).toBeCloseTo(lb, 6);
			expect(result.totalFuelMass / LB).toBeCloseTo(lb, 6);
		});

		it('60 lb/h of AVGAS for 2 h + 30 min is 150 lb = 25 US gal', () => {
			const result = calculateIn(
				{ ...base, fuelBurnRate: 60, flightTime: 120, reserveTime: 30 },
				'lb'
			);

			expect(inUnit(result.tripFuel, 'lb', 'avgas')).toBeCloseTo(120, 6);
			expect(inUnit(result.reserveFuel, 'lb', 'avgas')).toBeCloseTo(30, 6);
			expect(inUnit(result.totalFuel, 'lb', 'avgas')).toBeCloseTo(150, 6);
			expect(inUnit(result.totalFuel, 'usgal', 'avgas')).toBeCloseTo(25, 6);
		});

		it('66.8 lb/h of Jet A for 2 h + 30 min is 167 lb = 25 US gal', () => {
			const result = calculateIn(
				{ ...base, fuelBurnRate: 66.8, flightTime: 120, reserveTime: 30, fuelType: 'jetA' },
				'lb'
			);

			expect(inUnit(result.totalFuel, 'lb', 'jetA')).toBeCloseTo(167, 6);
			expect(inUnit(result.totalFuel, 'usgal', 'jetA')).toBeCloseTo(25, 6);
		});

		it('reads the same 150 lb as 25 US gal of AVGAS but 150 / 6.68 US gal of Jet A', () => {
			const formData = { ...base, fuelBurnRate: 60, flightTime: 120, reserveTime: 30 };
			const avgas = calculateIn(formData, 'lb');
			const jetA = calculateIn({ ...formData, fuelType: 'jetA' }, 'lb');

			expect(avgas.totalFuel / US_GAL).toBeCloseTo(25, 9);
			expect(jetA.totalFuel / US_GAL).toBeCloseTo(150 / 6.68, 9);
			expect(inUnit(jetA.totalFuel, 'lb', 'jetA')).toBeCloseTo(150, 9);
		});

		it('converts taxi and extra fuel in kg with the density', () => {
			const result = calculateIn(
				{ ...base, fuelBurnRate: AVGAS * 40, taxiFuel: AVGAS * 5, extraFuel: AVGAS * 10 },
				'kg'
			);

			expect(result.taxiFuel).toBeCloseTo(5, 12);
			expect(result.extraFuel).toBeCloseTo(10, 12);
			expect(result.totalFuel).toBeCloseTo(105, 9);
		});
	});
});

describe('calculateTrueAirspeed', () => {
	// Sources:
	// - FAA PHAK (FAA-H-8083-25C) p. 11-18: CAS equals TAS at sea level in the standard atmosphere.
	// - Aviation Formulary V1.47 (https://edwilliams.org/avform147.htm), "Mach numbers": CAS 250 kt,
	//   PA 10,000 ft, OAT −6.72 °C gives M 0.4523 and TAS 287.7 kt (rounded); "Standard Atmosphere":
	//   PA 8,000 ft, OAT 18 °C gives DA 10,145 ft; reverse formula for the CAS at Mach 1.
	// - Other values: the ICAO Standard Atmosphere and the Formulary's pitot formulas evaluated with
	//   40-digit decimals in a standalone Python script (not by running calculateTrueAirspeed).
	it.each([
		{ cas: 100, pa: 0, oat: 15, mach: 0.151176, tas: 100, da: 0 },
		{ cas: 250, pa: 10000, oat: -6.72, mach: 0.452275, tas: 287.6741, da: 9772.71 },
		{ cas: 100, pa: 8000, oat: 18, mach: 0.175238, tas: 116.5179, da: 10144.66 },
		{ cas: 120, pa: 5000, oat: 5.094, mach: 0.198717, tas: 129.1678, da: 5000 },
		{ cas: 150, pa: -1500, oat: 40, mach: 0.220805, tas: 152.2622, da: 996.95 },
		{ cas: 200, pa: 20000, oat: -24.6, mach: 0.440378, tas: 270.5449, da: 20002.85 },
		{ cas: 300, pa: 36000, oat: -56.5, mach: 0.891339, tas: 511.2443, da: 35979.02 },
		{ cas: 400, pa: 25000, oat: -70, mach: 0.933725, tas: 518.6017, da: 20358.52 },
	])('CAS $cas kt, PA $pa ft, OAT $oat °C', ({ cas, pa, oat, mach, tas, da }) => {
		const result = calculateTrueAirspeed({
			calibratedAirspeed: cas,
			pressureAltitude: pa,
			outsideAirTemperature: oat,
		});

		expect(result.mach).toBeCloseTo(mach, 5);
		expect(result.trueAirspeed).toBeCloseTo(tas, 3);
		expect(result.densityAltitude).toBeCloseTo(da, 1);
	});

	it('matches the Formulary examples at their published precision', () => {
		const mach = calculateTrueAirspeed({
			calibratedAirspeed: 250,
			pressureAltitude: 10000,
			outsideAirTemperature: -6.72,
		});
		const densityAltitude = calculateTrueAirspeed({
			calibratedAirspeed: 100,
			pressureAltitude: 8000,
			outsideAirTemperature: 18,
		});

		expect(mach.mach).toBeCloseTo(0.4523, 4);
		expect(mach.trueAirspeed).toBeCloseTo(287.7, 1);
		expect(densityAltitude.densityAltitude).toBeCloseTo(10145, 0);
	});

	it('gives TAS = CAS and Mach = CAS / 661.4786 kt at ISA sea level', () => {
		const result = calculateTrueAirspeed({
			calibratedAirspeed: 100,
			pressureAltitude: 0,
			outsideAirTemperature: 15,
		});

		expect(result.trueAirspeed).toBeCloseTo(100, 9);
		expect(result.mach).toBeCloseTo(100 / 661.4786, 7);
		expect(result.densityAltitude).toBeCloseTo(0, 6);
	});

	// DA would be 46,505.64 ft, above the 36,089.24 ft tropopause.
	it('returns no density altitude above the tropopause but still gives TAS and Mach', () => {
		const result = calculateTrueAirspeed({
			calibratedAirspeed: 300,
			pressureAltitude: 36000,
			outsideAirTemperature: 60,
		});

		expect(result.mach).toBeCloseTo(0.891339, 5);
		expect(result.trueAirspeed).toBeCloseTo(633.9705, 3);
		expect(result.densityAltitude).toBeNull();
	});

	it('gives a higher TAS and DA for a higher OAT, with the same Mach', () => {
		const [cold, warm] = [-10, 30].map((outsideAirTemperature) =>
			calculateTrueAirspeed({
				calibratedAirspeed: 150,
				pressureAltitude: 6000,
				outsideAirTemperature,
			})
		);

		expect(warm.mach).toBe(cold.mach);
		expect(warm.trueAirspeed).toBeGreaterThan(cold.trueAirspeed);
		expect(warm.densityAltitude).toBeGreaterThan(cold.densityAltitude!);
	});

	it('returns the inputs unchanged', () => {
		const formData = {
			calibratedAirspeed: 123.4,
			pressureAltitude: 4321,
			outsideAirTemperature: -3.5,
		};

		expect(calculateTrueAirspeed(formData)).toMatchObject(formData);
	});

	// 463 km/h = 250 kt, 3048 m = 10,000 ft, 19.9 °F = −6.7222 °C.
	it('works with values entered in km/h, m and °F', () => {
		const formData = formDataToBaseUnits(
			{ calibratedAirspeed: 463, pressureAltitude: 3048, outsideAirTemperature: 19.9 },
			{
				calibratedAirspeed: 'speed',
				pressureAltitude: 'altitude',
				outsideAirTemperature: 'temperature',
			},
			{ ...BASE_UNITS, speed: 'kmh', altitude: 'm', temperature: 'f' }
		);

		const result = calculateTrueAirspeed(formData);

		expect(result.mach).toBeCloseTo(0.452275, 5);
		expect(result.trueAirspeed).toBeCloseTo(287.6729, 3);
		expect(fromBaseUnit(result.trueAirspeed, 'speed', 'kmh')).toBeCloseTo(532.7702, 3);
	});

	describe('calculateMach', () => {
		// CAS for Mach 1 from the Formulary's reverse formula.
		it.each([
			{ cas: 342.274, pa: 36000 },
			{ cas: 389.964, pa: 30000 },
		])('gives Mach 1 at $cas kt and $pa ft', ({ cas, pa }) => {
			expect(calculateMach(cas, pa)).toBeCloseTo(1, 4);
		});

		it('does not depend on the OAT', () => {
			const result = calculateTrueAirspeed({
				calibratedAirspeed: 200,
				pressureAltitude: 20000,
				outsideAirTemperature: 10,
			});

			expect(calculateMach(200, 20000)).toBe(result.mach);
		});
	});
});

describe('calculateTimeSpeedDistance', () => {
	// FAA PHAK (FAA-H-8083-25C), p. 16-11 worked examples.
	it('calculates the time to fly 210 NM at 140 kt as 1:30', () => {
		expect(
			calculateTimeSpeedDistance({
				solveFor: 'time',
				distance: 210,
				groundspeed: 140,
				time: null,
			})
		).toEqual({ solveFor: 'time', distance: 210, groundspeed: 140, time: 90 });
	});

	it('calculates the distance flown in 1 h 45 min at 120 kt as 210 NM', () => {
		expect(
			calculateTimeSpeedDistance({
				solveFor: 'distance',
				distance: null,
				groundspeed: 120,
				time: 105,
			})
		).toEqual({ solveFor: 'distance', distance: 210, groundspeed: 120, time: 105 });
	});

	it('calculates the groundspeed for 270 NM in 3 h as 90 kt', () => {
		expect(
			calculateTimeSpeedDistance({
				solveFor: 'groundspeed',
				distance: 270,
				groundspeed: null,
				time: 180,
			})
		).toEqual({ solveFor: 'groundspeed', distance: 270, groundspeed: 90, time: 180 });
	});

	it('ignores a hidden value in the solved field', () => {
		expect(
			calculateTimeSpeedDistance({
				solveFor: 'distance',
				distance: 999,
				groundspeed: 120,
				time: 105,
			}).distance
		).toBe(210);
		expect(
			calculateTimeSpeedDistance({
				solveFor: 'groundspeed',
				distance: 270,
				groundspeed: -5,
				time: 180,
			}).groundspeed
		).toBe(90);
		expect(
			calculateTimeSpeedDistance({
				solveFor: 'time',
				distance: 210,
				groundspeed: 140,
				time: 5000,
			}).time
		).toBe(90);
	});

	it('reproduces the inputs when a result is fed back in the other modes', () => {
		const start: ITimeSpeedDistanceFormData = {
			solveFor: 'time',
			distance: 137.5,
			groundspeed: 112,
			time: null,
		};
		const { time } = calculateTimeSpeedDistance(start);

		expect(
			calculateTimeSpeedDistance({ ...start, solveFor: 'distance', distance: null, time })
				.distance
		).toBeCloseTo(137.5, 9);
		expect(
			calculateTimeSpeedDistance({
				...start,
				solveFor: 'groundspeed',
				groundspeed: null,
				time,
			}).groundspeed
		).toBeCloseTo(112, 9);
	});

	const unitFields: UnitFields<ITimeSpeedDistanceFormData> = {
		distance: 'distance',
		groundspeed: 'speed',
	};

	// 210 NM × 1.852 = 388.92 km; 140 kt × 1.852 = 259.28 km/h.
	it('works with values entered in km and km/h', () => {
		const formData = formDataToBaseUnits<ITimeSpeedDistanceFormData>(
			{ solveFor: 'time', distance: 388.92, groundspeed: 259.28, time: null },
			unitFields,
			{ ...BASE_UNITS, distance: 'km', speed: 'kmh' }
		);

		expect(calculateTimeSpeedDistance(formData).time).toBeCloseTo(90, 6);
	});

	// Same-unit arithmetic: 138 mph × 1.75 h = 241.5 SM.
	it('works with values entered in mph and shown in SM', () => {
		const formData = formDataToBaseUnits<ITimeSpeedDistanceFormData>(
			{ solveFor: 'distance', distance: null, groundspeed: 138, time: 105 },
			unitFields,
			{ ...BASE_UNITS, distance: 'sm', speed: 'mph' }
		);

		const { distance } = calculateTimeSpeedDistance(formData);

		expect(fromBaseUnit(distance, 'distance', 'sm')).toBeCloseTo(241.5, 6);
	});
});

describe('calculateHeading', () => {
	// FAA PHAK (FAA-H-8083-25C) worked examples, plus exact wrap-around cases.
	const cases: [number, number, 'east' | 'west', number | null, number, number | null, string][] =
		[
			[360, 9, 'east', null, 351, null, 'PHAK 16-7, 9° E: 360 → 351'],
			[90, 9, 'east', null, 81, null, 'PHAK 16-7, 9° E: 090 → 081'],
			[180, 9, 'east', null, 171, null, 'PHAK 16-7, 9° E: 180 → 171'],
			[270, 9, 'east', null, 261, null, 'PHAK 16-7, 9° E: 270 → 261'],
			[60, 9, 'east', null, 51, null, 'PHAK 16-7, TH 060 → 051'],
			[180, 10, 'west', -2, 190, 188, 'PHAK 8-24/8-25, Washington, D.C.'],
			[180, 14, 'east', null, 166, null, 'PHAK 8-24, Los Angeles'],
			[28, 7, 'east', 2, 21, 23, 'PHAK 16-20 flight planning example'],
			[88, 10, 'east', -4, 78, 74, 'PHAK Figure 16-16'],
			[5, 10, 'east', null, 355, null, 'wraps below 0'],
			[355, 10, 'west', 20, 5, 25, 'wraps above 360'],
			[90, 180, 'east', null, 270, null, '180° E'],
			[90, 180, 'west', null, 270, null, '180° W gives the same as 180° E'],
			[10, 0, 'east', -20, 10, 350, 'zero variation; correction wraps below 0'],
		];

	it.each(cases)(
		'TH %d, variation %d %s, correction %j → MH %d, CH %j (%s)',
		(trueHeading, variation, variationDirection, deviationCorrection, mh, ch) => {
			const { magneticHeading, compassHeading } = calculateHeading({
				trueHeading,
				variation,
				variationDirection,
				deviationCorrection,
			});

			expect(magneticHeading).toBeCloseTo(mh, 6);

			if (ch === null) {
				expect(compassHeading).toBeNull();
			} else {
				expect(compassHeading).toBeCloseTo(ch, 6);
			}
		}
	);

	// PHAK 8-25 reverse rule: CH ∓ correction = MH, MH + E / − W variation = TH.
	it.each(cases)(
		'returns to TH %d from the compass heading by the reverse rule',
		(trueHeading, variation, variationDirection, deviationCorrection) => {
			const { magneticHeading, compassHeading } = calculateHeading({
				trueHeading,
				variation,
				variationDirection,
				deviationCorrection,
			});
			const backToMagnetic =
				compassHeading === null
					? magneticHeading
					: normalizeDegrees(compassHeading - (deviationCorrection ?? 0));
			const backToTrue = normalizeDegrees(
				backToMagnetic + (variationDirection === 'east' ? variation : -variation)
			);

			expect(backToMagnetic).toBeCloseTo(magneticHeading, 9);
			expect(signedAngleDifference(backToTrue, trueHeading)).toBeCloseTo(0, 9);
		}
	);

	// PHAK Figure 16-12 deviation card (For → Steer), with zero variation.
	it.each([
		[30, -2, 28],
		[210, 2, 212],
	])('steers %d° with a %d° card correction as %d°', (heading, correction, steer) => {
		expect(
			calculateHeading({
				trueHeading: heading,
				variation: 0,
				variationDirection: 'east',
				deviationCorrection: correction,
			}).compassHeading
		).toBeCloseTo(steer, 6);
	});

	it('treats an undefined correction as none and returns the inputs unrounded', () => {
		const input = { trueHeading: 87.6, variation: 9.4, variationDirection: 'west' } as const;

		expect(calculateHeading(input)).toEqual({
			...input,
			magneticHeading: expect.closeTo(97, 9),
			compassHeading: null,
		});
	});

	it('returns a magnetic heading of 0 (not 360) for magnetic north', () => {
		expect(
			calculateHeading({ trueHeading: 350, variation: 10, variationDirection: 'west' })
				.magneticHeading
		).toBe(0);
	});
});

describe('calculateCloudBase', () => {
	// FAA PHAK (FAA-H-8083-25C) p. 12-14: temperature and dew point converge at 4.4 °F per 1,000 ft
	// (5.4 °F and 1 °F lapse rates); 85 °F / 71 °F gives 3,180 ft AGL. Expected values are exact
	// rational arithmetic (spread × 1.8 / 4.4 × 1,000), computed with Python decimal, not by running
	// calculateCloudBase.
	const fToC = (f: number) => ((f - 32) * 5) / 9;

	it.each([
		{ t: fToC(85), d: fToC(71), e: null, spread: 7.777778, agl: 3181.82, msl: null },
		{ t: 15, d: 5, e: 1000, spread: 10, agl: 4090.91, msl: 5090.91 },
		{ t: 20, d: 20, e: null, spread: 0, agl: 0, msl: null },
		{ t: 60, d: -60, e: 10909, spread: 120, agl: 49090.91, msl: 59999.91 },
	])('temperature $t °C, dew point $d °C, elevation $e ft', ({ t, d, e, spread, agl, msl }) => {
		const result = calculateCloudBase({ temperature: t, dewPoint: d, elevation: e });

		expect(result.spread).toBeCloseTo(spread, 6);
		expect(result.cloudBaseAgl).toBeCloseTo(agl, 2);

		if (msl === null) {
			expect(result.cloudBaseMsl).toBeNull();
		} else {
			expect(result.cloudBaseMsl).toBeCloseTo(msl, 2);
		}
	});

	// PHAK rounds 14 / 4.4 to 3.18 before multiplying by 1,000; the code doesn't round.
	it('is within 0.1 % of the PHAK example of 3,180 ft AGL', () => {
		const { cloudBaseAgl } = calculateCloudBase({ temperature: fToC(85), dewPoint: fToC(71) });

		expect(Math.abs(cloudBaseAgl - 3180) / 3180).toBeLessThan(0.001);
	});

	it.each([
		[15, 5],
		[fToC(85), fToC(71)],
		[-10, -25.5],
		[60, -60],
	])('lifts %d °C / %d °C to the height where they meet at PHAK rates', (t, d) => {
		const h = calculateCloudBase({ temperature: t, dewPoint: d }).cloudBaseAgl / 1000;
		const cToF = (c: number) => (c * 9) / 5 + 32;

		expect(cToF(t) - 5.4 * h).toBeCloseTo(cToF(d) - 1 * h, 9);
	});

	it('treats an undefined elevation as none', () => {
		expect(calculateCloudBase({ temperature: 15, dewPoint: 5 }).cloudBaseMsl).toBeNull();
	});

	it('gives zero, not a negative value, for a dew point a float tolerance above', () => {
		const result = calculateCloudBase({
			temperature: 15,
			dewPoint: 15 + 1e-10,
			elevation: 500,
		});

		expect(result.spread).toBe(0);
		expect(result.cloudBaseAgl).toBe(0);
		expect(result.cloudBaseMsl).toBe(500);
	});

	it('returns the inputs unchanged', () => {
		const formData = { temperature: 12.3, dewPoint: -4.5, elevation: 1234.5 };

		expect(calculateCloudBase(formData)).toMatchObject(formData);
	});

	// 59 °F / 41 °F = 15 / 5 °C; 4,090.91 ft × 0.3048 = 1,246.91 m; the spread is 18 °F.
	it('works with values entered in °F and shown in m', () => {
		const formData = formDataToBaseUnits(
			{ temperature: 59, dewPoint: 41, elevation: null },
			{ temperature: 'temperature', dewPoint: 'temperature', elevation: 'altitude' },
			{ ...BASE_UNITS, temperature: 'f', altitude: 'm' }
		);

		const result = calculateCloudBase(formData);

		expect(result.spread).toBeCloseTo(10, 9);
		expect(result.cloudBaseAgl).toBeCloseTo(4090.91, 2);
		expect(fromBaseUnit(result.cloudBaseAgl, 'altitude', 'm')).toBeCloseTo(1246.91, 2);
		expect(formatUnsignedTemperatureDifference(result.spread, 'f')).toBe('18.00 °F');
		expect(formatBaseValue(result.cloudBaseAgl, 'altitude', 'm')).toBe('1,247 m');
	});
});

describe('calculateGlideDistance', () => {
	// FAA AFH (FAA-H-8083-3C) p. 3-21: a 10:1 glide ratio is 10,000 ft forward per 1,000 ft lost;
	// p. 3-23: a headwind shortens and a tailwind lengthens the glide. FAA GFH (FAA-H-8083-13B)
	// p. 5-4: 60 kt TAS with a 25 kt headwind is 35 kt GS, with a 25 kt tailwind 85 kt; p. 5-10:
	// 24:1 from 50 kt / 2.1 kt sink. Expected values are the formulas evaluated with Python
	// decimal (50 digits), with 1 NM = 1852 / 0.3048 ft, not by running calculateGlideDistance;
	// descent rate = TAS × 1 NM in ft / 60 / glide ratio (ft/min).
	const NM_IN_FEET = 1852 / 0.3048;
	const gfh = {
		altitude: 4000,
		terrainElevation: 1000,
		glideRatio: 24,
		glideTrueAirspeed: 60,
		windType: null,
	};

	it.each([
		{
			case: 'AFH 10:1, no TAS',
			input: { altitude: 1500, terrainElevation: 500, glideRatio: 10, windType: null },
			height: 1000,
			distance: 1.645788,
			gs: null,
			time: null,
			descentRate: null,
		},
		{
			case: 'GFH 24:1, 60 kt, no wind',
			input: gfh,
			height: 3000,
			distance: 11.849676,
			gs: 60,
			time: 11.849676,
			descentRate: 253.171479,
		},
		{
			case: 'GFH 25 kt headwind',
			input: { ...gfh, windSpeed: 25, windType: 'headwind' as const },
			height: 3000,
			distance: 6.912311,
			gs: 35,
			time: 11.849676,
			descentRate: 253.171479,
		},
		{
			case: 'GFH 25 kt tailwind',
			input: { ...gfh, windSpeed: 25, windType: 'tailwind' as const },
			height: 3000,
			distance: 16.787041,
			gs: 85,
			time: 11.849676,
			descentRate: 253.171479,
		},
		{
			case: '9:1, no TAS',
			input: { altitude: 6000, terrainElevation: 1000, glideRatio: 9, windType: null },
			height: 5000,
			distance: 7.406048,
			gs: null,
			time: null,
			descentRate: null,
		},
		{
			case: 'all limits at their extremes (largest possible result)',
			input: {
				altitude: 60000,
				terrainElevation: -1500,
				glideRatio: 70,
				glideTrueAirspeed: 20,
				windSpeed: 200,
				windType: 'tailwind' as const,
			},
			height: 61500,
			distance: 7793.63067,
			gs: 220,
			time: 2125.535637,
			descentRate: 28.933883,
		},
	])('$case', ({ input, height, distance, gs, time, descentRate }) => {
		const result = calculateGlideDistance(input);

		expect(result.height).toBe(height);
		expect(Number.isFinite(result.glideDistance)).toBe(true);
		expect(result.glideDistance).toBeCloseTo(distance, 6);

		if (gs === null || time === null || descentRate === null) {
			expect(result.groundspeed).toBeNull();
			expect(result.glideTime).toBeNull();
			expect(result.descentRate).toBeNull();
		} else {
			expect(result.groundspeed).toBeCloseTo(gs, 9);
			expect(result.glideTime).toBeCloseTo(time, 6);
			expect(result.descentRate).toBeCloseTo(descentRate, 6);
		}
	});

	// GFH p. 5-10: 50 kt with a sink speed of 2.1 kt; 2.1 kt = 212.664042 ft/min.
	it('descends at the GFH sink speed of 2.1 kt at 50 kt and 50 / 2.1', () => {
		const result = calculateGlideDistance({
			...gfh,
			glideRatio: 50 / 2.1,
			glideTrueAirspeed: 50,
		});

		expect(result.descentRate).toBeCloseTo(212.664042, 6);
		expect(result.descentRate).toBeCloseTo((2.1 * NM_IN_FEET) / 60, 9);
	});

	it('treats a wind of 0 as no wind', () => {
		const result = calculateGlideDistance({ ...gfh, windSpeed: 0, windType: null });

		expect(result.groundspeed).toBe(60);
		expect(result.glideDistance).toBeCloseTo(11.849676, 6);
	});

	it('gives the same glide time with a headwind, no wind and a tailwind', () => {
		const headwind = calculateGlideDistance({ ...gfh, windSpeed: 25, windType: 'headwind' });
		const noWind = calculateGlideDistance(gfh);
		const tailwind = calculateGlideDistance({ ...gfh, windSpeed: 25, windType: 'tailwind' });

		expect(headwind.glideTime).toBe(noWind.glideTime);
		expect(tailwind.glideTime).toBe(noWind.glideTime);
		expect(noWind.glideTime).toBeCloseTo(11.849676, 6);
		expect(headwind.glideDistance).toBeLessThan(noWind.glideDistance);
		expect(noWind.glideDistance).toBeLessThan(tailwind.glideDistance);
	});

	it.each([
		{ windSpeed: 25, windType: 'headwind' as const },
		{ windSpeed: 25, windType: 'tailwind' as const },
		{ windSpeed: null, windType: null },
		{ windSpeed: 200, windType: 'tailwind' as const },
	])('flies the glide distance in the glide time at the groundspeed: %j', (wind) => {
		const result = calculateGlideDistance({ ...gfh, ...wind });

		expect(((result.glideTime as number) / 60) * (result.groundspeed as number)).toBeCloseTo(
			result.glideDistance,
			9
		);
	});

	// The sink rate is TAS / glide ratio: 60 kt / 24 = 2.5 kt = 253.1715 ft/min.
	it.each(['headwind', 'tailwind'] as const)(
		'descends at TAS / glide ratio with a %s',
		(windType) => {
			const result = calculateGlideDistance({ ...gfh, windSpeed: 25, windType });

			expect(result.height / (result.glideTime as number)).toBeCloseTo(
				(60 * NM_IN_FEET) / 60 / 24,
				9
			);
			expect(result.height / (result.glideTime as number)).toBeCloseTo(253.171479, 6);
			expect(result.descentRate).toBeCloseTo(result.height / (result.glideTime as number), 9);
			expect(result.descentRate).toBe(calculateGlideDistance(gfh).descentRate);
		}
	);

	it('gives the still-air distance without a wind', () => {
		const withTas = calculateGlideDistance(gfh);
		const withoutTas = calculateGlideDistance({ ...gfh, glideTrueAirspeed: null });

		expect(withTas.glideDistance).toBeCloseTo(withoutTas.glideDistance, 12);
		expect(withoutTas.glideDistance * NM_IN_FEET).toBeCloseTo(3000 * 24, 6);
	});

	it('returns the inputs unchanged', () => {
		const formData = { ...gfh, windSpeed: 12.3, windType: 'headwind' as const };

		expect(calculateGlideDistance(formData)).toMatchObject(formData);
	});

	// 1,219.2 m / 304.8 m = 4,000 / 1,000 ft; 111.12 km/h = 60 kt; 46.3 km/h = 25 kt;
	// 6.912311 NM × 1.852 = 12.8016 km; 60 kt / 24 = 2.5 kt = 2.5 × 1852 / 3600 m/s.
	it('works with values entered in m and km/h and shown in km', () => {
		const formData = formDataToBaseUnits(
			{
				altitude: 1219.2,
				terrainElevation: 304.8,
				glideRatio: 24,
				glideTrueAirspeed: 111.12,
				windSpeed: 46.3,
				windType: 'headwind' as const,
			},
			{
				altitude: 'altitude',
				terrainElevation: 'altitude',
				glideTrueAirspeed: 'speed',
				windSpeed: 'speed',
			},
			{ ...BASE_UNITS, altitude: 'm', speed: 'kmh', distance: 'km' }
		);

		const result = calculateGlideDistance(formData);

		expect(result.glideDistance).toBeCloseTo(6.912311, 6);
		expect(fromBaseUnit(result.glideDistance, 'distance', 'km')).toBeCloseTo(12.8016, 6);
		expect(fromBaseUnit(result.groundspeed as number, 'speed', 'kmh')).toBeCloseTo(64.82, 9);
		expect(result.glideTime).toBeCloseTo(11.849676, 6);
		expect(fromBaseUnit(result.descentRate as number, 'verticalSpeed', 'ms')).toBeCloseTo(
			1.286111,
			6
		);
	});
});

describe('calculateTurnPerformance', () => {
	// Exact SI formulas with g = 9.80665 m/s² (Aviation Formulary "Turns and pivotal altitude";
	// FAA PHAK FAA-H-8083-25C pp. 5-35, 5-38..5-40), evaluated with Python decimal (50 digits),
	// not by running calculateTurnPerformance.
	const KT_IN_M_PER_S = 1852 / 3600;
	const NM_IN_FEET = 1852 / 0.3048;
	const expectWithinPercent = (actual: number, expected: number, percent: number) =>
		expect(Math.abs(actual / expected - 1) * 100).toBeLessThan(percent);

	it.each([
		{
			tas: 120,
			bank: 30,
			rot: 5.254882,
			ft: 2208.3324,
			nm: 0.363445,
			n: 1.154701,
			t: 68.5077,
			std: 18.242631,
		},
		{
			tas: 240,
			bank: 30,
			rot: 2.627441,
			ft: 8833.3296,
			nm: 1.453779,
			n: 1.154701,
			t: 137.0155,
			std: 33.393506,
		},
		{
			tas: 100,
			bank: 45,
			rot: 10.922067,
			ft: 885.4037,
			nm: 0.145719,
			n: 1.414214,
			t: 32.9608,
			std: 15.358847,
		},
		{
			tas: 240,
			bank: 49,
			rot: 5.235167,
			ft: 4433.2974,
			nm: 0.729627,
			n: 1.524253,
			t: 68.7657,
			std: 33.393506,
		},
		{
			tas: 100,
			bank: 60,
			rot: 18.917575,
			ft: 511.1881,
			nm: 0.084131,
			n: 2,
			t: 19.0299,
			std: 15.358847,
		},
		{
			tas: 400,
			bank: 75,
			rot: 10.190427,
			ft: 3795.8912,
			nm: 0.624723,
			n: 3.863703,
			t: 35.3273,
			std: 47.692408,
		},
		{
			tas: 20,
			bank: 75,
			rot: 203.80854,
			ft: 9.4897,
			nm: 0.001562,
			n: 3.863703,
			t: 1.7664,
			std: 3.144364,
		},
		{
			tas: 20,
			bank: 0.1,
			rot: 0.095313,
			ft: 20291.9371,
			nm: 3.339623,
			n: 1.000002,
			t: 3777.025,
			std: 3.144364,
		},
	])('$tas kt at $bank°', ({ tas, bank, rot, ft, nm, n, t, std }) => {
		const result = calculateTurnPerformance({
			trueAirspeed: tas,
			bankAngle: bank,
			stallSpeed: null,
		});

		expect(result.rateOfTurn).toBeCloseTo(rot, 4);
		expect(result.turnRadius).toBeCloseTo(ft, 4);
		expect(result.turnRadius / NM_IN_FEET).toBeCloseTo(nm, 4);
		expect(result.loadFactor).toBeCloseTo(n, 4);
		expect(result.fullTurnTime).toBeCloseTo(t, 3);
		expect(result.standardRateBankAngle).toBeCloseTo(std, 4);
		expect(result.stallSpeedInTurn).toBeNull();

		// Formulary "v= w R": the speed equals the rate of turn (rad/s) times the radius (m).
		const omega = (result.rateOfTurn * Math.PI) / 180;

		expect(omega * result.turnRadius * 0.3048).toBeCloseTo(tas * KT_IN_M_PER_S, 9);
	});

	// PHAK's constants 1,091 and 11.26 are rounded (exact 1,092.2067 and 11.294283), so its
	// examples differ from the exact values by up to ~0.4 %.
	it('matches the PHAK 5-39/5-40 examples within 0.5 %', () => {
		const at120 = calculateTurnPerformance({
			trueAirspeed: 120,
			bankAngle: 30,
			stallSpeed: null,
		});
		const at240 = calculateTurnPerformance({
			trueAirspeed: 240,
			bankAngle: 30,
			stallSpeed: null,
		});
		const at240Bank49 = calculateTurnPerformance({
			trueAirspeed: 240,
			bankAngle: 49,
			stallSpeed: null,
		});

		expectWithinPercent(at120.rateOfTurn, 5.25, 0.5);
		expectWithinPercent(at120.fullTurnTime, 68.6, 0.5);
		expectWithinPercent(at120.turnRadius, 2215, 0.5);
		expectWithinPercent(at240.rateOfTurn, 2.62, 0.5);
		expectWithinPercent(at240.fullTurnTime, 137, 0.5);
		expectWithinPercent(at240.turnRadius, 8861, 0.5);
		expectWithinPercent(at240Bank49.rateOfTurn, 5.25, 0.5);
	});

	// The Formulary's 11.23 (exact 11.294) makes its radius 0.6 % larger than the exact 885.40 ft.
	it('matches the Aviation Formulary examples at 100 kt', () => {
		const result = calculateTurnPerformance({
			trueAirspeed: 100,
			bankAngle: 45,
			stallSpeed: null,
		});

		expectWithinPercent(result.turnRadius, 891, 1);
		expect(result.rateOfTurn).toBeCloseTo(10.9, 1);
		expect(result.standardRateBankAngle).toBeCloseTo(15.4, 1);
	});

	it('gives 2 G at 60° and raises the stall speed by √n (PHAK 5-35)', () => {
		const result = calculateTurnPerformance({
			trueAirspeed: 100,
			bankAngle: 60,
			stallSpeed: 50,
		});

		expect(result.loadFactor).toBeCloseTo(2, 12);
		expect(result.stallSpeedInTurn).toBeCloseTo(50 * Math.SQRT2, 9);
		expect(result.stallSpeedInTurn).toBeCloseTo(70.7107, 4);
		// PHAK Figure 5-52: the load factor is the vector sum √(1 + tan² 60°).
		expect(result.loadFactor).toBeCloseTo(Math.sqrt(1 + Math.tan(Math.PI / 3) ** 2), 12);
	});

	// Outside the form limit (75°); called directly to check PHAK's 50 kt → 100 kt at 4 G.
	it('doubles a 50 kt stall speed at 4 G', () => {
		const result = calculateTurnPerformance({
			trueAirspeed: 120,
			bankAngle: (Math.acos(0.25) * 180) / Math.PI,
			stallSpeed: 50,
		});

		expect(result.loadFactor).toBeCloseTo(4, 12);
		expect(result.stallSpeedInTurn).toBeCloseTo(100, 9);
	});

	it('gives the stall speed in the turn at the limits', () => {
		const result = calculateTurnPerformance({
			trueAirspeed: 400,
			bankAngle: 75,
			stallSpeed: 200,
		});

		expect(result.stallSpeedInTurn).toBeCloseTo(393.1261, 4);
	});

	it('gives a stall speed above the TAS without comparing them', () => {
		const result = calculateTurnPerformance({
			trueAirspeed: 60,
			bankAngle: 60,
			stallSpeed: 50,
		});

		expect(result.stallSpeedInTurn).toBeCloseTo(70.7107, 4);
	});

	it.each([20, 100, 120, 240, 400])(
		'turns at 3°/s and 360° in 120 s at the standard-rate bank for %d kt',
		(tas) => {
			const { standardRateBankAngle } = calculateTurnPerformance({
				trueAirspeed: tas,
				bankAngle: 30,
				stallSpeed: null,
			});
			const result = calculateTurnPerformance({
				trueAirspeed: tas,
				bankAngle: standardRateBankAngle,
				stallSpeed: null,
			});

			expect(result.rateOfTurn).toBeCloseTo(3, 9);
			expect(result.fullTurnTime).toBeCloseTo(120, 9);
		}
	);

	it('returns the inputs unchanged', () => {
		const formData = { trueAirspeed: 123.4, bankAngle: 25, stallSpeed: 55 };

		expect(calculateTurnPerformance(formData)).toMatchObject(formData);
	});

	// 222.24 km/h = 120 kt; radius 2,208.3324 ft = 673.0997 m = 0.363445 NM = 0.673100 km.
	it('works with values entered in km/h and shown in m and km', () => {
		const formData = formDataToBaseUnits(
			{ trueAirspeed: 222.24, bankAngle: 30, stallSpeed: null },
			{ trueAirspeed: 'speed', stallSpeed: 'speed' },
			{ ...BASE_UNITS, speed: 'kmh', altitude: 'm', distance: 'km' }
		);
		const result = calculateTurnPerformance(formData);

		expect(result.trueAirspeed).toBeCloseTo(120, 9);
		expect(result.rateOfTurn).toBeCloseTo(5.254882, 4);
		expect(fromBaseUnit(result.turnRadius, 'altitude', 'm')).toBeCloseTo(673.0997, 4);
		expect(fromBaseUnit(result.turnRadius / NM_IN_FEET, 'distance', 'km')).toBeCloseTo(
			0.6731,
			4
		);
		expect(result.standardRateBankAngle).toBeCloseTo(18.242631, 4);
	});
});

describe('calculateDescentPlanning', () => {
	// FAA IPH (FAA-H-8083-16B) ch. 3 examples; values from the flat-earth formulas evaluated with
	// 50-digit decimals in a standalone Python script (1 NM = 1852 / 0.3048 ft).
	const base: IDescentPlanningFormData = {
		solveFor: 'topOfDescent',
		descentInput: 'verticalSpeed',
		currentAltitude: 7000,
		targetAltitude: 1000,
		groundspeed: 120,
		verticalSpeed: null,
		descentAngle: null,
		distance: null,
	};

	const cases: [
		string,
		Partial<IDescentPlanningFormData>,
		[number, number, number, number, number, number],
	][] = [
		[
			'IPH 3-4: lose 6,000 ft at 120 kt and 600 fpm, start 20 NM out, 10 min',
			{ verticalSpeed: 600 },
			[20, 600, 10, 300, 4.937365, 2.826606],
		],
		[
			'IPH 3-20 HAYED: 12,000 → 6,000 ft at 180 kt and 500 fpm, 36 NM',
			{ currentAltitude: 12000, targetAltitude: 6000, groundspeed: 180, verticalSpeed: 500 },
			[36, 500, 12, 166.6667, 2.742981, 1.571218],
		],
		[
			'IPH 3-8 inputs: 11,000 → 3,000 ft at 180 kt and 1,000 fpm (exact)',
			{ currentAltitude: 11000, targetAltitude: 3000, groundspeed: 180, verticalSpeed: 1000 },
			[24, 1000, 8, 333.3333, 5.485961, 3.140077],
		],
		[
			'IPH 3-20 RACKI: 12,000 → 6,000 ft within 23 NM at 180 kt',
			{
				solveFor: 'verticalSpeed',
				currentAltitude: 12000,
				targetAltitude: 6000,
				groundspeed: 180,
				distance: 23,
			},
			[23, 782.6087, 7.6667, 260.8696, 4.293361, 2.458405],
		],
		[
			'IPH 3-12: a 3° path from 7,000 to 1,000 ft at 120 kt',
			{ descentInput: 'angle', descentAngle: 3 },
			[18.842107, 636.8714, 9.4211, 318.4357, 5.240778, 3],
		],
	];

	it.each(cases)('%s', (_, input, expected) => {
		const [distance, verticalSpeed, descentTime, feetPerNm, percent, angle] = expected;
		const result = calculateDescentPlanning({ ...base, ...input });

		expect(result.distance).toBeCloseTo(distance, 6);
		expect(result.verticalSpeed).toBeCloseTo(verticalSpeed, 4);
		expect(result.descentTime).toBeCloseTo(descentTime, 4);
		expect(result.gradientFeetPerNm).toBeCloseTo(feetPerNm, 4);
		expect(result.gradientPercent).toBeCloseTo(percent, 6);
		expect(result.descentAngle).toBeCloseTo(angle, 6);
	});

	// IPH rounds 7.6 min up to 8 and divides 6,000 ft by 8 min: "at least 750 feet per minute".
	it('needs more than the 750 fpm IPH rounds to for RACKI', () => {
		const { verticalSpeed } = calculateDescentPlanning({
			...base,
			solveFor: 'verticalSpeed',
			currentAltitude: 12000,
			targetAltitude: 6000,
			groundspeed: 180,
			distance: 23,
		});

		expect(verticalSpeed).toBeGreaterThan(750);
	});

	// IPH's rules of thumb (÷ 300, GS × 5) approximate the 3° path; "about 318 ft/NM" (p. 3-12).
	it('matches the IPH 318 ft/NM for 3° within 0.2 %', () => {
		const { gradientFeetPerNm } = calculateDescentPlanning({
			...base,
			descentInput: 'angle',
			descentAngle: 3,
		});

		expect(Math.abs(gradientFeetPerNm / 318 - 1)).toBeLessThan(0.002);
	});

	it('reproduces the inputs when a result is fed back in the other mode', () => {
		const byVerticalSpeed = calculateDescentPlanning({ ...base, verticalSpeed: 600 });

		expect(
			calculateDescentPlanning({
				...base,
				solveFor: 'verticalSpeed',
				distance: byVerticalSpeed.distance,
			}).verticalSpeed
		).toBeCloseTo(600, 9);

		const byAngle = calculateDescentPlanning({
			...base,
			descentInput: 'angle',
			descentAngle: 3,
		});

		expect(
			calculateDescentPlanning({ ...base, verticalSpeed: byAngle.verticalSpeed }).distance
		).toBeCloseTo(byAngle.distance, 9);
	});

	it('takes as long to fly the distance at the groundspeed as to descend', () => {
		for (const input of cases.map(([, input]) => input)) {
			const result = calculateDescentPlanning({ ...base, ...input });

			expect((result.distance / result.groundspeed) * 60).toBeCloseTo(result.descentTime, 9);
		}
	});

	it('ignores the values of fields not given in the chosen mode', () => {
		const hidden = { verticalSpeed: 5000, descentAngle: 9, distance: 999 };

		expect(
			calculateDescentPlanning({ ...base, ...hidden, verticalSpeed: 600 }).distance
		).toBeCloseTo(20, 9);
		expect(
			calculateDescentPlanning({ ...base, ...hidden, descentInput: 'angle', descentAngle: 3 })
				.distance
		).toBeCloseTo(18.842107, 6);
		expect(
			calculateDescentPlanning({
				...base,
				...hidden,
				solveFor: 'verticalSpeed',
				distance: 20,
			}).verticalSpeed
		).toBeCloseTo(600, 9);
	});

	// 2,133.6 m = 7,000 ft; 304.8 m = 1,000 ft; 222.24 km/h = 120 kt; 3.048 m/s = 600 ft/min.
	it('works with values entered in m, km/h and m/s and shown in km', () => {
		const formData = formDataToBaseUnits<IDescentPlanningFormData>(
			{
				...base,
				currentAltitude: 2133.6,
				targetAltitude: 304.8,
				groundspeed: 222.24,
				verticalSpeed: 3.048,
			},
			{
				currentAltitude: 'altitude',
				targetAltitude: 'altitude',
				groundspeed: 'speed',
				verticalSpeed: 'verticalSpeed',
				distance: 'distance',
			},
			{
				...BASE_UNITS,
				altitude: 'm',
				speed: 'kmh',
				verticalSpeed: 'ms',
				distance: 'km',
			}
		);
		const { distance } = calculateDescentPlanning(formData);

		expect(distance).toBeCloseTo(20, 9);
		expect(fromBaseUnit(distance, 'distance', 'km')).toBeCloseTo(37.04, 9);
	});
});
