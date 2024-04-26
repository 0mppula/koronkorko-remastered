import { FaCode, FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';

export const appName = 'KoronKorko';

export const calculators = [
	{
		name: 'Compound Interest Calculator',
		url: 'compound-interest-calculator',
		description:
			'Calculate the compound interest of an investment or determine how long your invested money can last. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Annualized Return Calculator',
		url: 'annualized-return-calculator',
		description:
			'Calculate the annualized return (CAGR), total percent return, and total profit of an investment. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Present Value Calculator',
		url: 'present-value-calculator',
		description:
			'Calculate the present value of an investment with a specified discount rate. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Investment Time Calculator',
		url: 'investment-time-calculator',
		description:
			'Calculate the amount of time needed to grow an investment to a certain future value given an annual interest rate. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Break Even Point Calculator',
		url: 'break-even-point-calculator',
		description:
			'Calculate the point at which total cost equals total revenue, indicating neither profit nor loss for your business. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Markup Calculator',
		url: 'markup-calculator',
		description:
			'Calculate the difference between the cost and the selling price of your product. Additionally, logged in users can save their calculations.',
	},
] as const;

export const featuredApps = [
	{
		name: 'CoinCaps',
		url: 'https://coincaps.netlify.app/',
		description:
			'A web-application allowing the user to view the 250 most valuable cryptocurrencies by market capitalization.',
	},
	{
		name: 'Money Mapper',
		url: 'https://moneymapper.vercel.app/',
		description:
			'An all-in-one personal finance tracker. Users can track their money, income, net worth, debts, and everything in between.',
	},
] as const;

export const footerLinks = [
	{
		title: 'Technologies',
		links: [
			{ url: 'https://nextjs.org/', text: 'Next.js' },
			{ url: 'https://reactjs.org/', text: 'React.js' },
			{ url: 'https://www.mongodb.com/', text: 'MongoDB' },
			{ url: 'https://www.prisma.io/', text: 'Prisma' },
			{ url: 'https://zustand-demo.pmnd.rs/', text: 'Zustand' },
			{ url: 'https://tanstack.com/query/latest', text: 'TanStack Query' },
		],
	},
	{
		title: 'Resources',
		links: [
			{
				url: 'https://tailwindcss.com/',
				text: 'Tailwind CSS',
			},
			{
				url: 'https://ui.shadcn.com/',
				text: 'shadcn/ui',
			},
			{ url: 'https://github.com/reactchartjs/react-chartjs-2', text: 'React Chartjs 2' },
			{
				url: 'https://lucide.dev/',
				text: 'Lucide',
			},
		],
	},
	{
		title: 'Developer',
		links: [
			{ url: 'https://www.omarkraidie.com/', text: 'Omar Kraidié Portfolio' },
			{ url: 'https://moneymapper.vercel.app/', text: 'Project: Money Mapper' },
			{ url: 'https://coincaps.netlify.app/', text: 'Project: CoinCaps' },
			{
				url: 'https://www.goodreads.com/review/list/135003326-0mppu?ref=nav_mybooks&shelf=programming',
				text: 'Technology Books',
			},
		],
	},
	{
		title: 'Other',
		links: [
			{
				url: 'https://en.wikipedia.org/wiki/Compound_interest',
				text: 'Compound Interest (Wikipedia)',
			},
			{ url: 'https://www.investopedia.com/', text: 'Investopedia' },
		],
	},
] as const;

export const footerSocialMedia = [
	{
		name: 'GitHub',
		url: 'https://github.com/0mppula',
		Icon: FaGithub,
	},
	{
		name: 'LinkedIn',
		url: 'https://www.linkedin.com/in/omarkraidie/',
		Icon: FaLinkedin,
	},
	{
		name: 'Email',
		url: 'mailto:devomarkraidie@gmail.com',
		Icon: FaEnvelope,
	},
	{
		name: 'Source Code',
		url: 'https://github.com/0mppula/next-koronkorko',
		Icon: FaCode,
	},
] as const;

export const currencies = [
	{ name: 'United States dollar', value: 'usd', symbol: '$', locale: 'en-US' },
	{ name: 'Euro', value: 'eur', symbol: '€', locale: 'fi-FI' },
	{ name: 'British Pound Sterling ', value: 'gbp', symbol: '£', locale: 'en-US' },
	{ name: 'Japanese Yen', value: 'jpy', symbol: '¥', locale: 'en-US' },
	{ name: 'Indian Rupee', value: 'inr', symbol: '₹', locale: 'en-US' },
] as const;

export const durationMultipliers = [
	// The value represents the amount of months in given option
	{ value: 12, label: 'Years' },
	{ value: 3, label: 'Quarters' },
	{ value: 1, label: 'Months' },
] as const;

export const contributionFrequencies = [
	// The value represents the contribution frequency per year in given option
	{ value: 1, label: 'Annualy', shortLabel: 'y' },
	{ value: 12, label: 'Monthly', shortLabel: 'm' },
] as const;

export const compoundFrequencies = [
	// The value represents the compound frequency per year in given option
	{ value: 1, label: 'Annualy' },
	{ value: 12, label: 'Monthly' },
] as const;
