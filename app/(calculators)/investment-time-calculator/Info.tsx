import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is an Investment Time Horizon?" className="mt-10">
			<p>
				An investment time horizon, or just time horizon, is the period of time one expects
				to hold an investment until they need the money back or want to rach a certain
				financial goal. Time horizons are largely dictated by investment goals and
				strategies. For example, saving for a down payment on a house, for maybe two years,
				would be considered a short-term time horizon while saving for college would be a
				medium-term time horizon, and investing for retirement, a long-term time horizon.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Time horizons are periods where investments are held until they are needed.
					</li>

					<li>Time horizons vary according to the investment goal, short or long.</li>

					<li>
						Time horizons also vary according to the time by which you begin investing.
					</li>

					<li>
						The longer the time horizon, the longer the power of compounding has to
						work.
					</li>

					<li>
						Generally speaking, the longer the time horizon, the more aggressive an
						investor can be in their portfolio, and vice versa.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/t/timehorizon.asp#toc-what-is-an-investment-time-horizon"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
