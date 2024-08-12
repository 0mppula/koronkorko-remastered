import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is Compound Interest?">
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
					<li>Compounding multiplies savings or debt at an accelerated rate.</li>
					<li>
						Compound interest is interest calculated on both the initial principal and
						all of the previously accumulated interest.
					</li>
					<li>
						Generating &quot;interest on interest&quot; (koronkorko in Finnish) is known
						as the power of compound interest.
					</li>
					<li>
						Interest can be compounded on a variety of frequencies, such as daily,
						monthly, quarterly, or annually.
					</li>
					<li>
						The higher the number of compounding periods, the larger the effect of
						compounding.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/c/compoundinterest.asp#toc-what-is-compound-interest"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
