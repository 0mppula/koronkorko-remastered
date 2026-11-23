import TypographyH1 from '@/components/TypographyH1';
import TypographyH2 from '@/components/TypographyH2';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
	type CalculatorCategory,
	calculatorCategories,
	calculators,
} from '@/constants/calculators';
import { featuredApps } from '@/constants/data';
import { filterCalculators, parseCategory, splitHighlight } from '@/lib/filterCalculators';
import { cn } from '@/lib/utils';
import { Coins, ExternalLink, Plane, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import CalculatorSearch from './CalculatorSearch';

const categoryIcons: Record<CalculatorCategory, LucideIcon> = {
	finance: Coins,
	aviation: Plane,
};

const SectionHeading = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex justify-center items-center my-6 gap-8 w-full">
			<div className="bg-primary-neutral h-[2px] grow w-full shrink" />
			<TypographyH2 className="whitespace-nowrap">{children}</TypographyH2>
			<div className="bg-primary-neutral h-[2px] grow w-full" />
		</div>
	);
};

export default function page({
	searchParams,
}: {
	searchParams: { q?: string; category?: string };
}) {
	const query = searchParams.q?.toLowerCase() || '';
	const selectedCategory = parseCategory(searchParams.category);

	const filteredCalculators = filterCalculators(calculators, query, selectedCategory);

	const highlightText = (
		content: string,
		query: string,
		Wrapper: React.ElementType,
		className?: string,
		highlightClassName?: string
	) => {
		return (
			<Wrapper className={className}>
				{splitHighlight(content, query).map((part, index) =>
					part.match ? (
						<span
							key={part.text + index}
							className={cn(
								'bg-primary text-secondary-foreground',
								highlightClassName
							)}
						>
							{part.text}
						</span>
					) : (
						part.text
					)
				)}
			</Wrapper>
		);
	};

	return (
		<>
			<TypographyH1 className="mb-6">Choose a Calculator</TypographyH1>

			<CalculatorSearch filteredCound={filteredCalculators.length} />

			{calculatorCategories.map((category) => {
				const categoryCalculators = filteredCalculators.filter(
					(c) => c.category === category.value
				);

				if (categoryCalculators.length === 0) return null;

				return (
					<section key={category.value} className="w-full">
						<SectionHeading>{category.label}</SectionHeading>

						<div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2">
							{categoryCalculators.map((calculator) => {
								const Icon = categoryIcons[calculator.category];

								return (
									<Link
										key={`calculator-${calculator.url}`}
										href={`/${calculator.url}`}
										className="p-4 hover:bg-muted focus-visible:bg-muted transition-all border-2 relative rounded-lg bg-card group"
									>
										<Card className="border-none group-hover:bg-muted group-focus-visible:bg-muted transition-all">
											{highlightText(
												calculator.name,
												query,
												TypographyH2,
												'mb-2 pr-10'
											)}

											<div className="absolute top-[20px] right-[20px]">
												<Icon
													className="w-[1.25rem] h-[1.25rem]"
													aria-hidden="true"
												/>
												<span className="sr-only">
													{category.label} calculator
												</span>
											</div>

											<Separator className="h-[2px]" />

											{highlightText(
												calculator.description,
												query,
												'p',
												'mt-4 text-neutral-700 dark:text-neutral-300',
												'font-semibold'
											)}
										</Card>
									</Link>
								);
							})}
						</div>
					</section>
				);
			})}

			<SectionHeading>Featured Apps</SectionHeading>

			<div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2">
				{featuredApps.map((app, i) => (
					<a
						key={`app-${i}`}
						className="p-4 hover:bg-muted focus-visible:bg-muted transition-all border-2 rounded-lg bg-card relative"
						href={`${app.url}`}
						rel="noreferrer"
						target="_blank"
					>
						<TypographyH2 className="mb-2 pr-10">{app.name}</TypographyH2>

						<div className="absolute top-[20px] right-[20px]">
							<ExternalLink className="w-[1.25rem] h-[1.25rem]" />
						</div>

						<Separator className="h-[2px]" />

						<p className="mt-4 text-neutral-700 dark:text-neutral-300">
							{app.description}
						</p>
					</a>
				))}
			</div>
		</>
	);
}
