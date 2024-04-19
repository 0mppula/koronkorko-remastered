import { FaCode, FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';

export const appName = 'KoronKorko';

export const calculators = [
	{
		name: 'Compound Interest Calculator',
		url: 'compound-interest-calculator',
		description:
			'Calculate the compound interest of your investment or for how long can your invested money last with this calculator. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Annualized Return Calculator',
		url: 'annualized-return-calculator',
		description:
			'Calculate the annualized return (CAGR) and or the the total percent return of your investment with this calculator. Additionally, logged in users can save their calculations.',
	},
	{
		name: 'Present Value Calculator',
		url: 'present-value-calculator',
		description:
			'Calculate the present value of your future investment with a specified discount rate with this calculator. Additionally, logged in users can save their calculations.',
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
			'Calculate the point at which total cost and total revenue are equal, meaning there is no loss or gain for your business. Additionally, logged in users can save their calculations.',
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
];

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
];

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
		url: 'https://github.com/0mppula/money-mapper',
		Icon: FaCode,
	},
];

export const currencies = [
	{ name: 'United States dollar', value: 'usd', symbol: '$', locale: 'en-US' },
	{ name: 'Euro', value: 'eur', symbol: '€', locale: 'fi-FI' },
	{ name: 'British Pound Sterling ', value: 'gbp', symbol: '£', locale: 'en-US' },
	{ name: 'Japanese Yen', value: 'jpy', symbol: '¥', locale: 'en-US' },
	{ name: 'Indian Rupee', value: 'inr', symbol: '₹', locale: 'en-US' },
] as const;

export const USER_QUERY_KEY = 'user';
export const MARKUP_CALCULATIONS_QUERY_KEY = 'markup-calculations';
