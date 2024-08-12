import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is Enterprise Value?">
			<p>
				Enterprise value (EV) measures a company’s total value, often used as a more
				comprehensive alternative to market capitalization. EV includes in its calculation
				not only the market capitalization of a company but also short-term and long-term
				debt and any cash or cash equivalents on the company’s balance sheet.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Enterprise value (EV) measures a company’s total value, often used as a more
						comprehensive alternative to equity market capitalization.
					</li>

					<li>
						Enterprise value includes in its calculation not only the market
						capitalization of a company but also short-term and long-term debt and any
						cash on the company’s balance sheet.
					</li>

					<li>
						Enterprise value is used as the basis for many financial ratios that measure
						a company’s performance.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/e/enterprisevalue.asp#toc-what-is-enterprise-value-ev"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
