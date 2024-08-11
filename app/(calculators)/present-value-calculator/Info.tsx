import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is Present Value?" className="mt-10">
			<p>
				Present value (PV) is the current value of a future sum of money or stream of cash
				flows. It is determined by discounting the future value by the estimated rate of
				return that the money could earn if invested. Present value calculations can be
				useful in investing and in strategic planning for businesses.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Present value (PV) is based on the concept that a particular sum of money
						today is likely to be worth more than the same sum in the future because it
						can be invested and earn a return in the meantime.
					</li>

					<li>
						Present value calculations require an estimate of that potential rate of
						return, known as the discount rate.
					</li>

					<li>
						Because the discount rate can only be estimated, if it is inaccurate, the
						present value calculation will be off as well.
					</li>

					<li>
						Investors can also calculate future value (FV) by applying an estimated rate
						of return to a sum of money's value today.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/p/presentvalue.asp#toc-what-is-present-value"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
