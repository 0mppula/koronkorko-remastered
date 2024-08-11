import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import TypographyH3 from '@/components/TypographyH3';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Info = () => {
	return (
		<ReportSummaryContainer title="What Is Compound Interest?" className="mt-12">
			<p>
				Compound interest is interest that applies not only to the initial principal of an
				investment or a loan, but also to the accumulated interest from previous periods. In
				other words, compound interest involves earning, or owing, interest on your
				interest.
			</p>
			<p>
				The power of compounding helps a sum of money grow faster than if just simple
				interest were calculated on the principal alone. And the greater the number of
				compounding periods, the greater the compound interest growth will be. For savings
				and investments, compound interest is your friend, as it multiplies your money at an
				accelerated rate. But if you have debt, compounding of the interest you owe can make
				it increasingly difficult to pay off.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Compounding multiplies savings or debt at an accelerated rate. Compound
						interest is
					</li>
					<li>
						interest calculated on both the initial principal and all of the previously
						accumulated
					</li>
					<li>
						interest. Generating "interest on interest" is known as the power of
						compound interest.
					</li>
					<li>
						Interest can be compounded on a variety of frequencies, such as daily,
						monthly,
					</li>
					<li>
						quarterly, or annually. The higher the number of compounding periods, the
						larger the effect of compounding.
					</li>
				</ul>
			</div>

			<p className="ml-auto">
				Source:{' '}
				<a
					className={cn(
						buttonVariants({
							variant: 'link',
							size: 'sm',
						}),
						'p-0 h-auto'
					)}
					href="https://www.investopedia.com/terms/c/compoundinterest.asp#toc-what-is-compound-interest"
					target="_blank"
					rel="noopener noreferrer"
				>
					Investopedia
				</a>
			</p>
		</ReportSummaryContainer>
	);
};

export default Info;
