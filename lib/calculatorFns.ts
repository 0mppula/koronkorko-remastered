import {
	AnnualizedReturnReportProps,
	BreakEvenPointReportProps,
	CloudBaseReportProps,
	CompoundInterestReportProps,
	CrosswindReportProps,
	DensityAltitudeReportProps,
	DescentPlanningReportProps,
	DividendYieldReportProps,
	DollarCostAverageReportProps,
	EnterpriseValueReportProps,
	EventProbabilityReportProps,
	FuelPlanningReportProps,
	GlideDistanceReportProps,
	HeadingReportProps,
	IAnnualizedReturnFormData,
	IBreakEvenPointFormData,
	ICloudBaseFormData,
	ICompoundInterestFormData,
	ICrosswindFormData,
	IDensityAltitudeFormData,
	IDescentPlanningFormData,
	IDividendYieldFormData,
	IDollarCostAverageFormData,
	IEnterpriseValueFormData,
	IEventProbabilityFormData,
	IFuelPlanningFormData,
	IGlideDistanceFormData,
	IHeadingFormData,
	IInvestmentTimeFormData,
	ILiquidationPriceFormData,
	IMarkupFormData,
	IPresentValueFormData,
	IPriceToEarningsRatioFormData,
	ITrueAirspeedFormData,
	ITimeSpeedDistanceFormData,
	ITurnPerformanceFormData,
	IWindTriangleFormData,
	InvestmentTimeReportProps,
	LiquidationPriceReportProps,
	MarkupReportProps,
	PresentValueReportProps,
	PriceToEarningsRatioReportProps,
	TimeSpeedDistanceReportProps,
	TrueAirspeedReportProps,
	TurnPerformanceReportProps,
	WindTriangleReportProps,
} from '@/types/calculations';
import {
	FOOT_IN_METRES,
	fromBaseUnit,
	NAUTICAL_MILE_IN_METRES,
	normalizeDegrees,
	signedAngleDifference,
	toBaseUnit,
	toRadians,
} from '@/lib/units';
import { getFuelDensity } from '@/lib/utils';

export const calculateMarkup = (formData: IMarkupFormData): MarkupReportProps => {
	const { cost, salesPrice } = formData;

	const profit = salesPrice - cost;
	const markup = (profit / cost) * 100;

	return { cost, salesPrice, profit, markup };
};

export const calcualteBreakEvenPoint = (
	formData: IBreakEvenPointFormData
): BreakEvenPointReportProps => {
	const { fixedCosts, variableCostPerUnit, pricePerUnit } = formData;

	// BEP = Fixed costs / (Sales price per unit – Variable cost per unit)
	const BEP = fixedCosts / (pricePerUnit - variableCostPerUnit);
	// Break even point in currency
	const BEPM = BEP * pricePerUnit;

	// Contribution margin
	const CM = pricePerUnit - variableCostPerUnit;
	const CMP = (CM / pricePerUnit) * 100;

	return {
		fixedCosts,
		variableCostPerUnit,
		pricePerUnit,
		breakEvenPointUnits: BEP,
		breakEvenPointMoney: BEPM,
		contributionMarginMoney: CM,
		contributionMarginPercent: CMP,
	};
};

export const calculateInvestmentTime = (
	formData: IInvestmentTimeFormData
): InvestmentTimeReportProps => {
	const { startingBalance, endingBalance, annualInterestRate } = formData;

	const r = annualInterestRate / 100;
	const T = Math.log(endingBalance / startingBalance) / Math.log(1 + r);

	return {
		startingBalance,
		endingBalance,
		annualInterestRate,
		yearsRequired: T,
		monthsRequired: T * 12,
		daysRequired: T * 365,
	};
};

export const calculatePresentValue = (formData: IPresentValueFormData): PresentValueReportProps => {
	const { startingBalance, discountRate, duration, durationMultiplier } = formData;

	// PV = FV * (1 / (1 + r) ^ n)
	const FV = startingBalance;
	const r = discountRate / 100;
	const n = (duration * durationMultiplier) / 12;
	const PV = FV * (1 / (1 + r) ** n);

	return { startingBalance, discountRate, duration, durationMultiplier, presentValue: PV };
};

export const calculateAnnualizedReturn = (
	formData: IAnnualizedReturnFormData
): AnnualizedReturnReportProps => {
	const { startingBalance, endingBalance, duration, durationMultiplier } = formData;

	// Time in years
	const t = (duration * durationMultiplier) / 12;
	const annualizedReturn = ((endingBalance / startingBalance) ** (1 / t) - 1) * 100;
	const percentReturn = ((endingBalance - startingBalance) / startingBalance) * 100;

	return {
		startingBalance,
		endingBalance,
		duration,
		durationMultiplier,
		annualizedReturn,
		percentReturn,
	};
};

export const calcualteCoumpoundInterest = (
	formData: ICompoundInterestFormData
): CompoundInterestReportProps => {
	const {
		startingBalance,
		contribution,
		contributionMultiplier,
		contributionFrequency,
		interestRate,
		compoundFrequency,
		duration,
		durationMultiplier,
	} = formData;

	// Compounded Interest for Principal
	// CI = P(1 + r/n)^(nt)

	// Future Value of a Series
	// FV = PMT * (((1 + r / n) ** (n * t) - 1) / (r / n))

	// Total amount
	// T = CI + FV

	// Where:
	// PMT = addition freq / compound freq
	// CI = the future value of the investment/loan, including interest
	// P = Principal investment amount (the initial deposit or loan amount)
	// r = Annual interest rate (decimal)
	// n = Compound frequency per year
	// t = Investment time in years

	const depositting = contributionMultiplier > -1;

	const PMT = contributionMultiplier * contribution * (contributionFrequency / compoundFrequency);
	const P = startingBalance;
	const r = interestRate / 100;
	const n = compoundFrequency;
	const t = (duration * durationMultiplier) / 12;

	const CI = P * (1 + r / n) ** (n * t);
	const FV = PMT * (((1 + r / n) ** (n * t) - 1) / (r / n));
	const T = CI + FV;
	const APY = ((1 + r / n) ** n - 1) * 100;

	const additionalContributions =
		contributionMultiplier * contribution * contributionFrequency * t;

	const totalContribution = additionalContributions + P;

	// If no rate is provides show the future future value of investment
	const noRateT = additionalContributions + P;

	const totalProfit = (r !== 0 ? T : noRateT) - totalContribution;

	const totalReturnPercent =
		(totalProfit / (Math.abs(depositting ? additionalContributions : 0) + startingBalance)) *
		100;

	return {
		startingBalance,
		compoundFrequency,
		contribution,
		contributionFrequency,
		contributionMultiplier,
		interestRate,
		duration,
		durationMultiplier,
		totalContribution,
		futureValue: r !== 0 ? T : noRateT,
		totalProfit,
		totalReturn: APY,
		principal: P,
		additionalContributions,
		depositting,
		totalReturnPercent,
	};
};

export const calculateEventProbability = (
	formData: IEventProbabilityFormData
): EventProbabilityReportProps => {
	// At least once probability
	// AOP = 1 - ( ( 1 - P ) ^ T )
	// P = Odds of event occurring in a single trial
	// T = Number of trials

	// More than once probability
	// MOP = AOP - EOP

	// Exactly once probability
	// EOP = T * P * (1 - P) ^ (T - 1)

	const { eventProbabilityPercent, eventTries: T } = formData;
	const P = eventProbabilityPercent / 100;

	const AOP = 1 - (1 - P) ** T;
	const EOP = T === 0 ? 0 : T * P * (1 - P) ** (T - 1);
	const MOP = AOP - EOP;

	return {
		...formData,
		atLeastOnceProbabilityPercent: AOP * 100,
		neverOccuresProbabilityPercent: (1 - AOP) * 100,
		moreThanOnceProbabilityPercent: MOP * 100,
		exactlyOnceProbabilityPercent: EOP * 100,
	};
};

export const calculateEarningsPerShare = (
	formData: IPriceToEarningsRatioFormData
): PriceToEarningsRatioReportProps => {
	const { sharePrice, earningsPerShare } = formData;

	const peRatio = sharePrice / earningsPerShare;

	return { sharePrice, earningsPerShare, peRatio };
};

export const calculateDollarCostAverage = (
	formData: IDollarCostAverageFormData
): DollarCostAverageReportProps => {
	const {
		compoundFrequency,
		deposit,
		depositFrequency,
		duration,
		durationMultiplier,
		initialInvestment,
		interestRate,
		sharePrice,
	} = formData;

	// r = Annual interest rate (decimal)
	// n = Compound frequency per year

	const duationInDays = duration * durationMultiplier * (365 / 12);
	const depositCount = Math.floor(duationInDays / depositFrequency);
	const r = interestRate / 100;
	const n = compoundFrequency;

	let newSharePrice = sharePrice;
	let totalShares = initialInvestment / sharePrice;
	let dollarCostAverage = initialInvestment / totalShares;
	let totalInvested = initialInvestment;
	let endingValue = initialInvestment;

	// Loop through each deposit
	for (let i = 0; i < depositCount; i++) {
		newSharePrice = newSharePrice * (1 + r / n) ** (n * (depositFrequency / 365));

		totalShares += deposit / newSharePrice;
		dollarCostAverage = (initialInvestment + deposit * (i + 1)) / totalShares;
		totalInvested = initialInvestment + deposit * (i + 1);
		endingValue = newSharePrice * totalShares;
	}

	return {
		...formData,
		sharePrice: sharePrice,
		newSharePrice: newSharePrice,
		totalShares,
		dollarCostAverage,
		totalInvested,
		endingValue,
		totalReturnPercent: ((endingValue - totalInvested) / totalInvested) * 100,
		totalReturn: endingValue - totalInvested,
		AbosluteReturnPercent: ((newSharePrice - sharePrice) / sharePrice) * 100,
	};
};

export const calculateEnterpriseValue = (
	formData: IEnterpriseValueFormData
): EnterpriseValueReportProps => {
	const { sharePrice, sharesOutstanding, cash, debt } = formData;

	const marketCap = sharePrice * sharesOutstanding;
	const enterpriseValue = marketCap + debt - cash;

	return { sharePrice, sharesOutstanding, cash, debt, marketCap, enterpriseValue };
};

export const calculateLiquidationPrice = (
	formData: ILiquidationPriceFormData
): LiquidationPriceReportProps => {
	const { entryPrice, leverageRatio } = formData;

	//  liquidation price = entry price – (1/leverage ratio) * entry price
	const liquidationPrice = entryPrice - (1 / leverageRatio) * entryPrice;
	const priceChangePercent = ((liquidationPrice - entryPrice) / entryPrice) * 100;

	return { entryPrice, leverageRatio, liquidationPrice, priceChangePercent };
};

export const calculateDividendYield = (
	formData: IDividendYieldFormData
): DividendYieldReportProps => {
	const { distributionFrequency, dividendAmount, sharePrice } = formData;

	const dividendYieldPercent = ((dividendAmount * distributionFrequency) / sharePrice) * 100;

	const annualizedDividend = dividendAmount * distributionFrequency;

	return {
		distributionFrequency,
		dividendAmount,
		sharePrice,
		annualizedDividend,
		dividendYieldPercent,
	};
};

export const calculateCrosswind = (formData: ICrosswindFormData): CrosswindReportProps => {
	const { runwayHeading, windDirection, windSpeed, gustSpeed } = formData;

	// Wind components (FAA PHAK, FAA-H-8083-25, Aircraft Performance): XW = V·sin θ, HW = V·cos θ
	const windAngle = signedAngleDifference(windDirection, runwayHeading);
	const sin = Math.sin(toRadians(windAngle));
	const cos = Math.cos(toRadians(windAngle));
	const hasGust = gustSpeed !== undefined && gustSpeed !== null;

	return {
		...formData,
		windAngle,
		crosswind: windSpeed * sin,
		headwind: windSpeed * cos,
		gustCrosswind: hasGust ? gustSpeed * sin : undefined,
		gustHeadwind: hasGust ? gustSpeed * cos : undefined,
	};
};

export const calculateWindTriangle = (formData: IWindTriangleFormData): WindTriangleReportProps => {
	const { trueCourse, trueAirspeed, windDirection, windSpeed } = formData;

	// Wind triangle (FAA PHAK, FAA-H-8083-25, Navigation; Ed Williams, Aviation Formulary)
	const windAngle = toRadians(signedAngleDifference(windDirection, trueCourse));
	// Clamped against unit-conversion noise at the crosswind = TAS limit.
	const sinCorrection = Math.max(
		-1,
		Math.min(1, (windSpeed * Math.sin(windAngle)) / trueAirspeed)
	);
	const windCorrectionAngle = (Math.asin(sinCorrection) * 180) / Math.PI;

	return {
		...formData,
		windCorrectionAngle,
		trueHeading: normalizeDegrees(trueCourse + windCorrectionAngle),
		groundspeed:
			trueAirspeed * Math.sqrt(1 - sinCorrection ** 2) - windSpeed * Math.cos(windAngle),
	};
};

// ICAO Standard Atmosphere (Doc 7488/3), troposphere constants.
const ISA_SEA_LEVEL_TEMPERATURE_C = 15;
const ISA_SEA_LEVEL_TEMPERATURE_K = 288.15;
const ISA_SEA_LEVEL_PRESSURE_HPA = 1013.25;
const ISA_LAPSE_RATE_K_PER_M = 0.0065;
const STANDARD_GRAVITY = 9.80665;
const DRY_AIR_GAS_CONSTANT = 287.05287;
const CELSIUS_TO_KELVIN = 273.15;
const ISA_PRESSURE_EXPONENT = STANDARD_GRAVITY / (DRY_AIR_GAS_CONSTANT * ISA_LAPSE_RATE_K_PER_M);
const ISA_SEA_LEVEL_DENSITY =
	(ISA_SEA_LEVEL_PRESSURE_HPA * 100) / (DRY_AIR_GAS_CONSTANT * ISA_SEA_LEVEL_TEMPERATURE_K);
const ISA_SCALE_HEIGHT_M = ISA_SEA_LEVEL_TEMPERATURE_K / ISA_LAPSE_RATE_K_PER_M;
export const ISA_TROPOPAUSE_ALTITUDE_M = 11000;
// Ratio of specific heats of dry air.
const AIR_ADIABATIC_INDEX = 1.4;

const isaPressureAtAltitude = (
	altitudeM: number,
	referencePressure: number = ISA_SEA_LEVEL_PRESSURE_HPA
) => referencePressure * (1 - altitudeM / ISA_SCALE_HEIGHT_M) ** ISA_PRESSURE_EXPONENT;

const densityAltitudeFromDensity = (density: number) =>
	ISA_SCALE_HEIGHT_M *
	(1 - (density / ISA_SEA_LEVEL_DENSITY) ** (1 / (ISA_PRESSURE_EXPONENT - 1)));

const airDensity = (pressureHpa: number, temperatureC: number) =>
	(pressureHpa * 100) / (DRY_AIR_GAS_CONSTANT * (temperatureC + CELSIUS_TO_KELVIN));

const speedOfSound = (temperatureK: number) =>
	Math.sqrt(AIR_ADIABATIC_INDEX * DRY_AIR_GAS_CONSTANT * temperatureK);

const ISA_SEA_LEVEL_SPEED_OF_SOUND = speedOfSound(ISA_SEA_LEVEL_TEMPERATURE_K);

// Subsonic pitot relations (Aviation Formulary V1.47, "Mach numbers"), valid for M < 1.
const machFromPressure = (calibratedAirspeed: number, pressureHpa: number) => {
	const casRatio = fromBaseUnit(calibratedAirspeed, 'speed', 'ms') / ISA_SEA_LEVEL_SPEED_OF_SOUND;
	const impactPressure = ISA_SEA_LEVEL_PRESSURE_HPA * ((1 + 0.2 * casRatio ** 2) ** 3.5 - 1);

	return Math.sqrt(5 * ((impactPressure / pressureHpa + 1) ** (2 / 7) - 1));
};

export const calculateMach = (calibratedAirspeed: number, pressureAltitude: number): number =>
	machFromPressure(
		calibratedAirspeed,
		isaPressureAtAltitude(fromBaseUnit(pressureAltitude, 'altitude', 'm'))
	);

export const calculateDensityAltitude = (
	formData: IDensityAltitudeFormData
): DensityAltitudeReportProps => {
	const { fieldElevation, qnh, outsideAirTemperature } = formData;

	// ISA barometric relations: an altimeter set to QNH reads the field elevation.
	const elevationM = fromBaseUnit(fieldElevation, 'altitude', 'm');
	const stationPressure = isaPressureAtAltitude(elevationM, qnh);
	const pressureAltitudeM =
		ISA_SCALE_HEIGHT_M *
		(1 - (stationPressure / ISA_SEA_LEVEL_PRESSURE_HPA) ** (1 / ISA_PRESSURE_EXPONENT));
	const isaTemperature = ISA_SEA_LEVEL_TEMPERATURE_C - ISA_LAPSE_RATE_K_PER_M * pressureAltitudeM;
	const densityAltitudeM = densityAltitudeFromDensity(
		airDensity(stationPressure, outsideAirTemperature)
	);

	return {
		...formData,
		pressureAltitude: toBaseUnit(pressureAltitudeM, 'altitude', 'm'),
		isaTemperature,
		isaDeviation: outsideAirTemperature - isaTemperature,
		densityAltitude: toBaseUnit(densityAltitudeM, 'altitude', 'm'),
	};
};

export const calculateTrueAirspeed = (formData: ITrueAirspeedFormData): TrueAirspeedReportProps => {
	const { calibratedAirspeed, pressureAltitude, outsideAirTemperature } = formData;

	const pressure = isaPressureAtAltitude(fromBaseUnit(pressureAltitude, 'altitude', 'm'));
	const mach = machFromPressure(calibratedAirspeed, pressure);
	const trueAirspeedMs = mach * speedOfSound(outsideAirTemperature + CELSIUS_TO_KELVIN);
	const densityAltitudeM = densityAltitudeFromDensity(
		airDensity(pressure, outsideAirTemperature)
	);

	return {
		...formData,
		mach,
		trueAirspeed: toBaseUnit(trueAirspeedMs, 'speed', 'ms'),
		// The ISA formulas only hold in the troposphere.
		densityAltitude:
			densityAltitudeM > ISA_TROPOPAUSE_ALTITUDE_M
				? null
				: toBaseUnit(densityAltitudeM, 'altitude', 'm'),
	};
};

export const calculateFuelPlanning = (formData: IFuelPlanningFormData): FuelPlanningReportProps => {
	const { fuelBurnRate, flightTime, reserveTime, taxiFuel, extraFuel, fuelType } = formData;

	// Fuel = burn rate × time (FAA PHAK, FAA-H-8083-25C, ch. 16 Basic Calculations); mass = L × kg/L.
	const fuelDensity = getFuelDensity(fuelType) ?? NaN;
	const tripFuel = (fuelBurnRate * flightTime) / 60;
	const reserveFuel = (fuelBurnRate * reserveTime) / 60;
	const totalFuel = tripFuel + reserveFuel + (taxiFuel ?? 0) + (extraFuel ?? 0);

	return {
		...formData,
		fuelDensity,
		tripFuel,
		reserveFuel,
		totalFuel,
		totalFuelMass: totalFuel * fuelDensity,
	};
};

export const calculateTimeSpeedDistance = (
	formData: ITimeSpeedDistanceFormData
): TimeSpeedDistanceReportProps => {
	const { solveFor } = formData;
	const distance = formData.distance ?? NaN;
	const groundspeed = formData.groundspeed ?? NaN;
	const time = formData.time ?? NaN;

	// T = D / GS, D = GS × T, GS = D / T, T in hours (FAA PHAK, FAA-H-8083-25C, p. 16-11).
	switch (solveFor) {
		case 'distance':
			return { solveFor, distance: (groundspeed * time) / 60, groundspeed, time };
		case 'groundspeed':
			return { solveFor, distance, groundspeed: (60 * distance) / time, time };
		case 'time':
			return { solveFor, distance, groundspeed, time: (60 * distance) / groundspeed };
	}
};

export const calculateHeading = (formData: IHeadingFormData): HeadingReportProps => {
	const { trueHeading, variation, variationDirection, deviationCorrection } = formData;

	// TH − E / + W variation = MH; MH + card correction = CH (FAA PHAK, FAA-H-8083-25C, p. 16-7 to 16-9).
	const magneticHeading = normalizeDegrees(
		variationDirection === 'east' ? trueHeading - variation : trueHeading + variation
	);

	return {
		...formData,
		magneticHeading,
		compassHeading:
			deviationCorrection == null
				? null
				: normalizeDegrees(magneticHeading + deviationCorrection),
	};
};

// Temperature and dew point converge at 4.4 °F per 1,000 ft (FAA PHAK, FAA-H-8083-25C, p. 12-14).
const CLOUD_BASE_CONVERGENCE_F_PER_1000_FT = 4.4;

export const calculateCloudBase = (formData: ICloudBaseFormData): CloudBaseReportProps => {
	const { temperature, dewPoint, elevation } = formData;

	// The schema allows the dew point a float tolerance above the temperature.
	const spread = Math.max(0, temperature - dewPoint);
	const cloudBaseAgl = ((spread * 9) / 5 / CLOUD_BASE_CONVERGENCE_F_PER_1000_FT) * 1000;

	return {
		...formData,
		spread,
		cloudBaseAgl,
		cloudBaseMsl: elevation == null ? null : cloudBaseAgl + elevation,
	};
};

const NAUTICAL_MILE_IN_FEET = NAUTICAL_MILE_IN_METRES / FOOT_IN_METRES;

export const calculateGlideDistance = (
	formData: IGlideDistanceFormData
): GlideDistanceReportProps => {
	const { altitude, terrainElevation, glideRatio, glideTrueAirspeed, windSpeed, windType } =
		formData;

	// Distance = height × glide ratio, scaled by groundspeed / TAS (FAA AFH 3-21, 3-23; GFH 5-4).
	const height = altitude - terrainElevation;
	const stillAirDistance = (height * glideRatio) / NAUTICAL_MILE_IN_FEET;

	if (glideTrueAirspeed == null) {
		return {
			...formData,
			height,
			glideDistance: stillAirDistance,
			groundspeed: null,
			glideTime: null,
		};
	}

	const wind = windSpeed ?? 0;
	const groundspeed =
		windType === 'tailwind' ? glideTrueAirspeed + wind : glideTrueAirspeed - wind;

	return {
		...formData,
		height,
		glideDistance: (stillAirDistance * groundspeed) / glideTrueAirspeed,
		groundspeed,
		// The wind changes the distance, not the time aloft (GFH 5-5).
		glideTime: (stillAirDistance / glideTrueAirspeed) * 60,
	};
};

const STANDARD_RATE_DEG_PER_S = 3;

export const calculateTurnPerformance = (
	formData: ITurnPerformanceFormData
): TurnPerformanceReportProps => {
	const { trueAirspeed, bankAngle, stallSpeed } = formData;

	// Coordinated level turn: tan(bank) = V² / (R g), V = ω R (Aviation Formulary; PHAK 5-38..5-40).
	const speed = (trueAirspeed * NAUTICAL_MILE_IN_METRES) / 3600;
	const bank = toRadians(bankAngle);
	const rateOfTurn = (((STANDARD_GRAVITY * Math.tan(bank)) / speed) * 180) / Math.PI;
	const loadFactor = 1 / Math.cos(bank);
	const standardRateBankAngle =
		(Math.atan((speed * toRadians(STANDARD_RATE_DEG_PER_S)) / STANDARD_GRAVITY) * 180) /
		Math.PI;

	return {
		...formData,
		rateOfTurn,
		turnRadius: speed ** 2 / (STANDARD_GRAVITY * Math.tan(bank)) / FOOT_IN_METRES,
		loadFactor,
		fullTurnTime: 360 / rateOfTurn,
		standardRateBankAngle,
		// Stall speed rises with the square root of the load factor (PHAK 5-35).
		stallSpeedInTurn: stallSpeed == null ? null : stallSpeed * Math.sqrt(loadFactor),
	};
};

export const calculateDescentPlanning = (
	formData: IDescentPlanningFormData
): DescentPlanningReportProps => {
	const { solveFor, descentInput, currentAltitude, targetAltitude, groundspeed } = formData;

	// Flat earth: distance = Δh / gradient, VS = gradient × GS / 60 (FAA IPH, FAA-H-8083-16B, ch. 3).
	const height = currentAltitude - targetAltitude;
	let distance: number;
	let verticalSpeed: number;

	if (solveFor === 'verticalSpeed') {
		distance = formData.distance ?? NaN;
		verticalSpeed = (height * groundspeed) / (60 * distance);
	} else if (descentInput === 'angle') {
		const gradient = Math.tan(toRadians(formData.descentAngle ?? NaN)) * NAUTICAL_MILE_IN_FEET;

		distance = height / gradient;
		verticalSpeed = (gradient * groundspeed) / 60;
	} else {
		verticalSpeed = formData.verticalSpeed ?? NaN;
		distance = (height * groundspeed) / (60 * verticalSpeed);
	}

	const gradientFeetPerNm = height / distance;

	return {
		solveFor,
		descentInput,
		currentAltitude,
		targetAltitude,
		groundspeed,
		distance,
		verticalSpeed,
		descentAngle: (Math.atan(gradientFeetPerNm / NAUTICAL_MILE_IN_FEET) * 180) / Math.PI,
		descentTime: height / verticalSpeed,
		gradientPercent: (gradientFeetPerNm / NAUTICAL_MILE_IN_FEET) * 100,
		gradientFeetPerNm,
	};
};
