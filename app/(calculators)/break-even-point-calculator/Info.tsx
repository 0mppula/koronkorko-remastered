import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is the Breakeven Point?" className="mt-10">
			<p>
				In corporate accounting, the breakeven point (BEP) is the moment a company&apos;s
				operations stop being unprofitable and starts to earn a profit. The breakeven point
				is the production level at which total revenues for a product equal total expenses.
				The breakeven point can also be used in other ways across finance such as in
				trading.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						In accounting, the breakeven point is calculated by dividing the fixed costs
						of production by the price per unit minus the variable costs of production.
					</li>

					<li>
						The breakeven point is the level of production at which the costs of
						production equal the revenues for a product.
					</li>

					<li>
						In investing, the breakeven point is said to be achieved when the market
						price of an asset is the same as its original cost.
					</li>

					<li>
						A breakeven analysis can help with finding missing expenses, limiting
						decisions based on emotions, establishing goals, securing funding, and
						setting appropriate prices.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/b/breakevenpoint.asp#toc-what-is-the-breakeven-point-bep"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
