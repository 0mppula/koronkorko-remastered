import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is the Liquidation Price?">
			<p>
				The liquidation price is the price at which the broker forcibly closes out a
				trader&apos;s position to prevent further losses. First, there&apos;s usually a
				warning in the form of a margin call to deposit more funds that haven&apos;t been
				met. The broker determines the threshold before a client begins trading in a margin
				account.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The liquidation level, normally expressed as a percentage, is the point
						that, once reached, will start the automatic closure of positions.
					</li>

					<li>The liquidation level is usually predetermined by the brokerage firm.</li>

					<li>
						Liquidation levels are typically associated with margin accounts for foreign
						exchange (forex) and cryptocurrency trading, but they apply to any
						securities traded on margin, including stocks and other securities.
					</li>

					<li>
						The liquidation level is a fail-safe or risk management feature that
						protects traders and dealers from taking on significant losses beyond a
						specific point.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/l/liquidationlevel.asp"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
