export const calculatorCategories = [
	{ value: 'finance', label: 'Finance' },
	{ value: 'aviation', label: 'Aviation' },
] as const;

export type CalculatorCategory = (typeof calculatorCategories)[number]['value'];

export const calculators = [
	{
		name: 'Compound Interest Calculator',
		url: 'compound-interest-calculator',
		category: 'finance',
		description:
			'Calculate the compound interest of an investment or determine how long your invested money can last. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Annualized Return Calculator',
		url: 'annualized-return-calculator',
		category: 'finance',
		description:
			'Calculate the annualized return (CAGR), total percent return, and total profit of an investment. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Present Value Calculator',
		url: 'present-value-calculator',
		category: 'finance',
		description:
			'Calculate the present value of an investment with a specified discount rate. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Investment Time Calculator',
		url: 'investment-time-calculator',
		category: 'finance',
		description:
			'Calculate the amount of time needed to grow an investment to a certain future value given an annual interest rate. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Break Even Point Calculator',
		url: 'break-even-point-calculator',
		category: 'finance',
		description:
			'Calculate the point at which total cost equals total revenue, indicating neither profit nor loss for your business. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Markup Calculator',
		url: 'markup-calculator',
		category: 'finance',
		description:
			'Calculate the difference between the cost and the selling price of your product. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Event Probability Calculator',
		url: 'event-probability-calculator',
		category: 'finance',
		description:
			'Calculate the probability of an event occurring at least once, more than once, or exactly once in a given number of attempts. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Price to Earnings Ratio Calculator',
		url: 'price-to-earnings-ratio-calculator',
		category: 'finance',
		description:
			'Calculate the price-to-earnings (P/E) ratio of a company to determine if its stock is overvalued or undervalued. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Dollar Cost Average Calculator',
		url: 'dollar-cost-average-calculator',
		category: 'finance',
		description:
			'Calculate the average cost of an investment over a time period, given an interest rate, initial investment amount and a series of periodic investments. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Enterprise Value Calculator',
		url: 'enterprise-value-calculator',
		category: 'finance',
		description:
			'Calculate the enterprise value of a company, given its market capitalization, total debt, and total cash. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Liquidation Price Calculator',
		url: 'liquidation-price-calculator',
		category: 'finance',
		description:
			'Calculate the liquidation price of an asset, given its entry price and the leverage ratio of the investment. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Dividend Yield Calculator',
		url: 'dividend-yield-calculator',
		category: 'finance',
		description:
			'Calculate the dividend yield of a stock, given its dividend amount, frequency, and share price. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Crosswind Calculator',
		url: 'crosswind-calculator',
		category: 'aviation',
		description:
			'Calculate the crosswind and headwind or tailwind components for a runway, given the runway heading and the wind direction and speed. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Wind Triangle Calculator',
		url: 'wind-triangle-calculator',
		category: 'aviation',
		description:
			'Calculate the true heading, wind correction angle and groundspeed, given the true course, true airspeed and the wind direction and speed. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Density Altitude Calculator',
		url: 'density-altitude-calculator',
		category: 'aviation',
		description:
			'Calculate the pressure altitude, ISA temperature deviation and density altitude, given the field elevation, QNH and outside air temperature. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Fuel Planning Calculator',
		url: 'fuel-planning-calculator',
		category: 'aviation',
		description:
			'Calculate the trip fuel, reserve fuel and total fuel by volume or mass, given the fuel burn rate, flight time, reserve time, optional taxi and extra fuel, and fuel type. Additionally, logged in users can save their calculations.',
	},
] as const;
