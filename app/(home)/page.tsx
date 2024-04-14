import TypographyH1 from '@/components/TypographyH1';
import TypographyH2 from '@/components/TypographyH2';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { calculators, featuredApps } from '@/constants';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
	return (
		<>
			<TypographyH1 className="mb-6">Home</TypographyH1>

			<div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2">
				{calculators.map((calculator, i) => (
					<Link
						key={`calculator-${i}`}
						href={`/${calculator.url}`}
						className="p-4 hover:bg-muted focus-visible:bg-muted transition-all border-2 relative rounded-lg bg-card group"
					>
						<Card className="border-none group-hover:bg-muted group-focus-visible:bg-muted transition-all">
							<TypographyH2 className="mb-2">{calculator.name}</TypographyH2>

							<Separator />

							<p className="mt-4 text-neutral-700 dark:text-neutral-300">
								{calculator.description}
							</p>
						</Card>
					</Link>
				))}
			</div>

			<div className="flex justify-center items-center my-4 gap-8 w-full">
				<div className="bg-neutral-300 dark:bg-neutral-700 h-[2px] grow-1 w-full" />
				<TypographyH2>Featured</TypographyH2>
				<div className="bg-neutral-300 dark:bg-neutral-700 h-[2px] grow-1 w-full" />
			</div>

			<div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2">
				{featuredApps.map((app, i) => (
					<a
						key={`app-${i}`}
						className="p-4 hover:bg-muted focus-visible:bg-muted transition-all border-2 rounded-lg bg-card group relative"
						href={`${app.url}`}
						rel="noreferrer"
						target="_blank"
					>
						<TypographyH2 className="mb-2">{app.name}</TypographyH2>
						<div className="absolute top-[26px] right-[20px]">
							<ExternalLink className="w-[1.25rem] h-[1.25rem]" />
						</div>

						<Separator />

						<p className="mt-4 text-neutral-700 dark:text-neutral-300">
							{app.description}
						</p>
					</a>
				))}
			</div>
		</>
	);
}
