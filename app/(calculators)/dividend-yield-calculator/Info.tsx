import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is the Dividend Yield?">
			<p>
				A stock&apos;s dividend yield is a ratio showing how much a company pays out in
				dividends each year relative to its stock price. The reciprocal of the dividend
				yield is the dividend payout ratio.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The dividend yield is the amount of money a company pays shareholders for
						owning a share of its stock divided by its current stock price.
					</li>

					<li>Mature companies are the most likely to pay dividends.</li>

					<li>
						Companies in the utility and consumer staple industries often have
						relatively higher dividend yields.
					</li>

					<li>
						Real estate investment trusts, master limited partnerships, and business
						development companies pay higher-than-average dividends; however, the
						dividends from these companies are taxed at a higher rate.
					</li>

					<li>
						Higher dividend yields don&apos;t always indicate attractive investment
						opportunities because the dividend yield of a stock may be elevated as a
						result of a declining stock price.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/d/dividendyield.asp#toc-what-is-the-dividend-yield"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
