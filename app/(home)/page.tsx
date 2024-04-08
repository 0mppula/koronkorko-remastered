import Link from 'next/link';
import { calculators } from './calculators';
import { ExternalLink } from 'lucide-react';
import TypographyH1 from '@/components/TypographyH1';
import { Card } from '@/components/ui/card';

const featuredApps = [
	{
		name: 'CoinCaps',
		url: 'https://coincaps.netlify.app/',
		description:
			'A web-application where the user can view the 1000 most valuable cryptocurrencies by market capitalization.',
	},
	{
		name: 'WSB-Tickers',
		url: 'https://wsb-tickers.netlify.app/',
		description:
			'App that displays the top 50 stocks discussed on reddit.com/r/wallstreetbets/',
	},
];

export default function Home() {
	return (
		<>
			<TypographyH1 className="mb-4">Home</TypographyH1>

			<div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 bg-test">
				{calculators.map((calculator, i) => (
					<Card key={`calculator-${i}`} className="p-4">
						<Link className="" href={`/${calculator.url}`}>
							<div>
								<h2>{calculator.name}</h2>
								<hr />
								<p>{calculator.description}</p>
							</div>
						</Link>
					</Card>
				))}
			</div>

			<div className="flex justify-center items-center my-4 gap-8 w-full">
				<div className="bg-border h-[2px] grow-1 w-full" />
				<h2 className="scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
					Featured
				</h2>
				<div className="bg-border h-[2px] grow-1 w-full" />
			</div>

			<div className="">
				{featuredApps.map((app, i) => (
					<a
						key={`app-${i}`}
						className=""
						href={`${app.url}`}
						rel="noreferrer"
						target="_blank"
					>
						<h2>{app.name}</h2>
						<div className="">
							<ExternalLink />
						</div>
						<hr />
						<p>{app.description}</p>
					</a>
				))}
			</div>
		</>
	);
}
