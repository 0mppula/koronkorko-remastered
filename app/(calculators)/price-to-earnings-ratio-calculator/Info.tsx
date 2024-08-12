import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is the Price to Earnings Ratio?">
			<p>
				The price-to-earnings (P/E) ratio measures a company&apos;s share price relative to
				its earnings per share (EPS). Often called the price or earnings multiple, the P/E
				ratio helps assess the relative value of a company&apos;s stock. It&apos;s handy for
				comparing a company&apos;s valuation against its historical performance, against
				other firms within its industry, or the overall market.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The price-to-earnings (P/E) ratio is the proportion of a company&apos;s
						share price to its earnings per share.
					</li>

					<li>
						A high P/E ratio could mean that a company&apos;s stock is overvalued or
						that investors expect high growth rates.
					</li>

					<li>
						Companies with no earnings or are losing money don&apos;t have a P/E ratio
						because there&apos;s nothing to put in the denominator.
					</li>

					<li>The two most used P/E ratios are forward and trailing P/E.</li>

					<li>
						P/E ratios are most valuable when comparing similar companies in the same
						industry or for a single company over time.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/p/price-earningsratio.asp#toc-what-is-the-price-to-earnings-pe-ratio"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
