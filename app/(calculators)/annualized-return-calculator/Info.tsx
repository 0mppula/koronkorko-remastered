import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is Annualized Return?">
			<p>
				An annualized total return is the geometric average amount of money an investment
				earns each year over a given period. The annualized return formula is calculated as
				a geometric average to show what an investor would earn over some time if the annual
				return were compounded.
			</p>

			<p>
				An annualized total return provides only a snapshot of an investment&apos;s
				performance and does not give investors any indication of its volatility or price
				fluctuations.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						An annualized total return is the geometric average amount of money an
						investment earns each year over a given period.
					</li>

					<li>
						The annualized return formula shows what an investor would earn over a
						period of time if the annual return were compounded.
					</li>

					<li>
						Calculating the annualized rate of return needs only two variables: the
						returns (Initial Value - Ending Value) for a given period and the time the
						investment was held.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/a/annualized-total-return.asp#toc-what-is-annualized-total-return"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
