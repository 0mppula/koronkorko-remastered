import { FaCode, FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';

export const appName = 'KoronKorko';

export const XsScreen = 480;
export const SmScreen = 640;
export const MdScreen = 768;
export const LgScreen = 1024;
export const XlScreen = 1280;
export const XxlScreen = 1536;

export const FREE_PLAN_CALCULATION_LIMIT = 3;

export const featuredApps = [
	{
		name: 'Money Mapper',
		url: 'https://moneymapper.vercel.app/',
		description:
			'An all-in-one personal finance tracker. Users can track and visualize their money, income, net worth, debts, and everything in between.',
	},
	{
		name: 'CoinCaps',
		url: 'https://coincaps.netlify.app/',
		description:
			'A web-application allowing the user to view the 250 most valuable cryptocurrencies by market capitalization.',
	},
	{
		name: 'KoronKorko (MERN)',
		url: 'https://koronkorko.herokuapp.com/',
		description:
			'An earlier version of KoronKorko built with the MERN stack. It mirrors the current functionality, enabling users to utilize various financial calculators and save their results. However, the current version boasts slight improvements.',
	},
	{
		name: 'WSB-Tickers',
		url: 'https://wsb-tickers.netlify.app/',
		description:
			'View the sentiment of the top 50 stocks mentioned on reddit.com/r/wallstreetbets before the closing of its API on October 14, 2023.',
	},
] as const;

export const footerLinks = [
	{
		title: 'Technologies',
		links: [
			{ url: 'https://nextjs.org/', text: 'Next.js' },
			{ url: 'https://reactjs.org/', text: 'React.js' },
			{ url: 'https://www.typescriptlang.org/', text: 'TypeScript' },
			{ url: 'https://www.mongodb.com/', text: 'MongoDB' },
			{ url: 'https://www.prisma.io/', text: 'Prisma' },
			{ url: 'https://tanstack.com/query/latest', text: 'TanStack Query' },
			{ url: 'https://next-auth.js.org/', text: 'NextAuth' },

			{
				url: 'https://github.com/pacocoursey/next-themes',
				text: 'next-themes',
			},
			{
				url: 'https://axios-http.com/',
				text: 'Axios',
			},
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
			{ url: 'https://react-hook-form.com/', text: 'React Hook Form' },
			{ url: 'https://zustand-demo.pmnd.rs/', text: 'Zustand' },
			{ url: 'https://zod.dev/', text: 'Zod' },
			{ url: 'https://recharts.org/', text: 'Recharts' },
			{
				url: 'https://sonner.emilkowal.ski/',
				text: 'Sonner',
			},
			{
				url: 'https://lucide.dev/',
				text: 'Lucide',
			},
			{
				url: 'https://react-icons.github.io/react-icons/',
				text: 'React Icons',
			},

			{ url: 'https://github.com/LuisEnMarroquin/json-as-xlsx', text: 'json-as-xlsx' },
		],
	},
	{
		title: 'Developer',
		links: [
			{ url: 'https://www.omarkraidie.com/', text: 'Omar Kraidié Portfolio' },
			{ url: 'https://github.com/0mppula', text: 'Omar Kraidié GitHub' },
			{ url: 'https://moneymapper.vercel.app/', text: 'Project: Money Mapper' },
			{ url: 'https://coincaps.netlify.app/', text: 'Project: CoinCaps' },
			{ url: 'https://koronkorko.herokuapp.com/', text: 'Project: KoronKorko (MERN)' },
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
		url: 'https://github.com/0mppula/koronkorko-remastered',
		Icon: FaCode,
	},
] as const;

export const currencies = [
	{
		name: 'United States dollar',
		value: 'usd',
		symbol: '$',
		locale: 'en-US',
		pluralName: 'United States dollars',
	},
	{ name: 'Euro', value: 'eur', symbol: '€', locale: 'fi-FI', pluralName: 'Euros' },
	{
		name: 'British Pound Sterling ',
		value: 'gbp',
		symbol: '£',
		locale: 'en-US',
		pluralName: 'British Pounds Sterling',
	},
	{
		name: 'Japanese Yen',
		value: 'jpy',
		symbol: '¥',
		locale: 'en-US',
		pluralName: 'Japanese Yen',
	},
	{
		name: 'Indian Rupee',
		value: 'inr',
		symbol: '₹',
		locale: 'en-US',
		pluralName: 'Indian Rupees',
	},
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

export const depositFrequencies = [
	{ value: 7, label: 'Weekly', shortLabel: 'w' },
	{ value: 30.416666666666666666666666666667, label: 'Monthly', shortLabel: 'm' },
	{ value: 91.25, label: 'Quarterly', shortLabel: 'q' },
	{ value: 365, label: 'Yearly', shortLabel: 'y' },
] as const;

export const compoundFrequencies = [
	// The value represents the compound frequency per year in given option
	{ value: 1, label: 'Annualy' },
	{ value: 12, label: 'Monthly' },
] as const;

export const plans = [
	{
		title: 'Weekly Plan',
		interval: 'week',
		period: 'weekly',
		price: 5,
		features: ['Unlimited calculations', 'Priority support', 'Cancel anytime'],
		actionLabel: 'Get Started',
		paymentLink: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PREMIUM_LINK,
	},
	{
		title: 'Monthly Plan',
		interval: 'month',
		period: 'monthly',
		price: 10,
		features: ['Unlimited calculations', 'Priority support', 'Save 50%', 'Cancel anytime'],
		actionLabel: 'Get Started',
		paymentLink: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PREMIUM_LINK,
	},
	{
		title: 'Yearly Plan',
		interval: 'year',
		period: 'yearly',
		price: 90,
		features: ['Unlimited calculations', 'Priority support', 'Save 65%', 'Cancel anytime'],
		actionLabel: 'Get Started',
		paymentLink: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PREMIUM_LINK,
	},
];
