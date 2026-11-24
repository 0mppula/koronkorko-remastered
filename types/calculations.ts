import {
	annualizedReturnFormDataSchema,
	breakEvenPointFormDataSchema,
	calculationNameFormDataSchema,
	calculationNameStringSchema,
	cloudBaseFormDataSchema,
	compoundInterestFormDataSchema,
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
	windTriangleFormDataSchema,
} from '@/schemas';
import {
	AnnualizedReturnCalculation,
	BreakEvenPointCalculation,
	CloudBaseCalculation,
	CompoundInterestCalculation,
	CrosswindCalculation,
	DensityAltitudeCalculation,
	DividendYieldCalculation,
	DollarCostAverageCalculation,
	EnterpriseValueCalculation,
	EventProbabilityCalculation,
	FuelPlanningCalculation,
	GlideDistanceCalculation,
	HeadingCalculation,
	InvestmentTimeCalculation,
	LiquidationPriceCalculation,
	MarkupCalculation,
	PresentValueCalculation,
	PriceToEarningsRatioCalculation,
	TimeSpeedDistanceCalculation,
	TrueAirspeedCalculation,
	TurnPerformanceCalculation,
	WindTriangleCalculation,
} from '@prisma/client';
import { z } from 'zod';

export interface IHasId {
	id: string;
}

export interface IHasName {
	name: string;
}

export interface IHasFormData<TFormData> extends IHasId {
	formData: TFormData;
}

export interface IHasFormDataAndName<TFormData> extends IHasFormData<TFormData>, IHasName {}

export type ICalculationNameString = z.infer<typeof calculationNameStringSchema>;

export type ICalculationNameFormData = z.infer<typeof calculationNameFormDataSchema>;

// Break Even Point Calculator
export type IBreakEvenPointFormData = z.infer<typeof breakEvenPointFormDataSchema>;

export interface BreakEvenPointReportProps extends IBreakEvenPointFormData {
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

// Markup Calculator
export type IMarkupFormData = z.infer<typeof markupFormDataSchema>;

export interface MarkupReportProps extends IMarkupFormData {
	profit: number;
	markup: number;
}

// Investment Time Calculation
export type IInvestmentTimeFormData = z.infer<typeof investmentTimeFormDataSchema>;

export interface InvestmentTimeReportProps extends IInvestmentTimeFormData {
	yearsRequired: number;
	monthsRequired: number;
	daysRequired: number;
}

// Present Value Calculation
export type IPresentValueFormData = z.infer<typeof presentValueFormDataSchema>;

export interface PresentValueReportProps extends IPresentValueFormData {
	presentValue: number;
}

// Annualized Return Calculation
export type IAnnualizedReturnFormData = z.infer<typeof annualizedReturnFormDataSchema>;

export interface AnnualizedReturnReportProps extends IAnnualizedReturnFormData {
	annualizedReturn: number;
	percentReturn: number;
}

// Compound Interest Calculation
export type ICompoundInterestFormData = z.infer<typeof compoundInterestFormDataSchema>;

export interface CompoundInterestReportProps extends ICompoundInterestFormData {
	totalContribution: number;
	futureValue: number;
	totalProfit: number;
	totalReturn: number;
	principal: number;
	additionalContributions: number;
	depositting: boolean;
	totalReturnPercent: number;
}

// Event Probability Calculation
export type IEventProbabilityFormData = z.infer<typeof eventProbabilityFormDataSchema>;

export interface EventProbabilityReportProps extends IEventProbabilityFormData {
	atLeastOnceProbabilityPercent: number;
	moreThanOnceProbabilityPercent: number;
	exactlyOnceProbabilityPercent: number;
	neverOccuresProbabilityPercent: number;
}

// Price to Earnings Ratio Calculation
export type IPriceToEarningsRatioFormData = z.infer<typeof priceToEarningsRatioFormDataSchema>;

export interface PriceToEarningsRatioReportProps extends IPriceToEarningsRatioFormData {
	peRatio: number;
}

// Dollar Cost Average Calculation
export type IDollarCostAverageFormData = z.infer<typeof dollarCostAverageFormDataSchema>;

export interface DollarCostAverageReportProps extends IDollarCostAverageFormData {
	newSharePrice: number;
	dollarCostAverage: number;
	totalShares: number;
	totalInvested: number;
	totalReturnPercent: number;
	endingValue: number;
	totalReturn: number;
	AbosluteReturnPercent: number;
}

// Enterprise Value Calculation
export type IEnterpriseValueFormData = z.infer<typeof enterpriseValueFormDataSchema>;

export interface EnterpriseValueReportProps extends IEnterpriseValueFormData {
	marketCap: number;
	enterpriseValue: number;
}

// Liquidation Price Calculation
export type ILiquidationPriceFormData = z.infer<typeof liquidationPriceFormDataSchema>;

export interface LiquidationPriceReportProps extends ILiquidationPriceFormData {
	liquidationPrice: number;
	priceChangePercent: number;
}

// Dividend Yield Calculation
export type IDividendYieldFormData = z.infer<typeof dividendYieldFormDataSchema>;

export interface DividendYieldReportProps extends IDividendYieldFormData {
	annualizedDividend: number;
	dividendYieldPercent: number;
}

// Crosswind Calculation
export type ICrosswindFormData = z.infer<typeof crosswindFormDataSchema>;

export interface CrosswindReportProps extends ICrosswindFormData {
	windAngle: number;
	crosswind: number;
	headwind: number;
	gustCrosswind?: number;
	gustHeadwind?: number;
}

// Wind Triangle Calculation
export type IWindTriangleFormData = z.infer<typeof windTriangleFormDataSchema>;

export interface WindTriangleReportProps extends IWindTriangleFormData {
	windCorrectionAngle: number;
	trueHeading: number;
	groundspeed: number;
}

// Density Altitude Calculation
export type IDensityAltitudeFormData = z.infer<typeof densityAltitudeFormDataSchema>;

export interface DensityAltitudeReportProps extends IDensityAltitudeFormData {
	pressureAltitude: number;
	isaTemperature: number;
	isaDeviation: number;
	densityAltitude: number;
}

// Fuel Planning Calculation
export type IFuelPlanningFormData = z.infer<typeof fuelPlanningFormDataSchema>;

export interface FuelPlanningReportProps extends IFuelPlanningFormData {
	fuelDensity: number;
	tripFuel: number;
	reserveFuel: number;
	totalFuel: number;
	totalFuelMass: number;
}

// True Airspeed Calculation
export type ITrueAirspeedFormData = z.infer<typeof trueAirspeedFormDataSchema>;

export interface TrueAirspeedReportProps extends ITrueAirspeedFormData {
	mach: number;
	trueAirspeed: number;
	// Null above the tropopause, where the ISA troposphere formulas don't apply.
	densityAltitude: number | null;
}

// Time Speed Distance Calculation
export type ITimeSpeedDistanceFormData = z.infer<typeof timeSpeedDistanceFormDataSchema>;

export interface TimeSpeedDistanceReportProps {
	solveFor: ITimeSpeedDistanceFormData['solveFor'];
	distance: number;
	groundspeed: number;
	time: number;
}

// Heading Calculation
export type IHeadingFormData = z.infer<typeof headingFormDataSchema>;

export interface HeadingReportProps extends IHeadingFormData {
	magneticHeading: number;
	// Null without a deviation correction.
	compassHeading: number | null;
}

// Cloud Base Calculation
export type ICloudBaseFormData = z.infer<typeof cloudBaseFormDataSchema>;

export interface CloudBaseReportProps extends ICloudBaseFormData {
	spread: number;
	cloudBaseAgl: number;
	// Null without an elevation.
	cloudBaseMsl: number | null;
}

// Glide Distance Calculation
export type IGlideDistanceFormData = z.infer<typeof glideDistanceFormDataSchema>;

export interface GlideDistanceReportProps extends IGlideDistanceFormData {
	height: number;
	glideDistance: number;
	// Null without a glide true airspeed.
	groundspeed: number | null;
	glideTime: number | null;
}

// Turn Performance Calculation
export type ITurnPerformanceFormData = z.infer<typeof turnPerformanceFormDataSchema>;

export interface TurnPerformanceReportProps extends ITurnPerformanceFormData {
	rateOfTurn: number;
	turnRadius: number;
	loadFactor: number;
	fullTurnTime: number;
	standardRateBankAngle: number;
	// Null without a stall speed.
	stallSpeedInTurn: number | null;
}

export type CalculationType =
	| BreakEvenPointCalculation
	| MarkupCalculation
	| InvestmentTimeCalculation
	| PresentValueCalculation
	| AnnualizedReturnCalculation
	| CompoundInterestCalculation
	| EventProbabilityCalculation
	| PriceToEarningsRatioCalculation
	| DollarCostAverageCalculation
	| EnterpriseValueCalculation
	| LiquidationPriceCalculation
	| DividendYieldCalculation
	| CrosswindCalculation
	| WindTriangleCalculation
	| DensityAltitudeCalculation
	| FuelPlanningCalculation
	| TrueAirspeedCalculation
	| TimeSpeedDistanceCalculation
	| HeadingCalculation
	| CloudBaseCalculation
	| GlideDistanceCalculation
	| TurnPerformanceCalculation;
