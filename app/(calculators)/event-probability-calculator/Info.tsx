import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What is Probability?">
			<p>
				Probability measures the likelihood that a possible, but not guaranteed event, will
				happen.
			</p>

			<p>
				The probability theory is a branch of mathematics that focuses on the analysis of
				random events. According to Britannica, the outcome of a random occurrence cannot be
				predicted before it occurs. However, it may be any one of possible outcomes. The
				actual outcome is deemed to be determined by chance.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>Probability is the likelihood of an event occurring.</li>

					<li>
						The probability of an event can be expressed in a percentage or a fraction.
					</li>

					<li>
						The outcome of a random occurrence cannot be predicted before it occurs.
					</li>
				</ul>
			</div>

			<ReportSource href="https://en.wikipedia.org/wiki/Probability" text="Wikipedia" />
		</ReportSection>
	);
};

export default Info;
