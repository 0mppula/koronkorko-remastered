import {
	AnnualizedReturnReportProps,
	BreakEvenPointReportProps,
	CompoundInterestReportProps,
	DollarCostAverageReportProps,
	EnterpriseValueReportProps,
	EventProbabilityReportProps,
	IAnnualizedReturnFormData,
	IBreakEvenPointFormData,
	ICompoundInterestFormData,
	IDollarCostAverageFormData,
	IEnterpriseValueFormData,
	IEventProbabilityFormData,
	IInvestmentTimeFormData,
	IMarkupFormData,
	IPresentValueFormData,
	IPriceToEarningsRatioFormData,
	InvestmentTimeReportProps,
	MarkupReportProps,
	PresentValueReportProps,
	PriceToEarningsRatioReportProps,
} from '@/types/calculations';

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
	const totalProfit = T - totalContribution;

	// If no rate is provides show the future future value of investment
	const noRateT = additionalContributions + P;

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
	const EOP = T * P * (1 - P) ** (T - 1);
	const MOP = AOP - EOP;

	return {
		...formData,
		atLeastOnceProbabilityPercent: AOP * 100,
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
		totalInvested = initialInvestment + deposit * i;
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
