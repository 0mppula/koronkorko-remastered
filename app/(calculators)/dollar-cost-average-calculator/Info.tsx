import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is Dollar-Cost Averaging?">
			<p>
				Investing can be challenging. Even experienced investors who try to time the market
				to buy at the most opportune moments can come up short.
			</p>

			<p>
				Dollar-cost averaging is a strategy that can make it easier to deal with uncertain
				markets by making purchases automatic. It also supports an investor's effort to
				invest regularly.
			</p>

			<p>
				Dollar-cost averaging involves investing the same amount of money in a target
				security at regular intervals over a certain period of time, regardless of price. By
				using dollar-cost averaging, investors may lower their average cost per share and
				reduce the impact of volatility on the their portfolios.
			</p>

			<p>
				In effect, this strategy eliminates the effort required to attempt to time the
				market to buy at the best prices.
			</p>

			<p>Dollar-cost averaging is also known as the constant dollar plan.</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Dollar-cost averaging is the practice of systematically investing equal
						amounts of money at regular intervals, regardless of the price of a
						security.
					</li>

					<li>
						Dollar-cost averaging can reduce the overall impact of price volatility and
						lower the average cost per share.
					</li>

					<li>
						By buying regularly in up and down markets, investors buy more shares at
						lower prices and fewer shares at higher prices.
					</li>

					<li>
						Dollar-cost averaging aims to prevent a poorly timed lump sum investment at
						a potentially higher price.
					</li>

					<li>
						Beginning and long-time investors can both benefit from dollar-cost
						averaging.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/d/dollarcostaveraging.asp#toc-what-is-dollar-cost-averaging"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
