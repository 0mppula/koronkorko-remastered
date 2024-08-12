import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';

const Info = () => {
	return (
		<ReportSection title="What Is a Markup?" className="mt-10">
			<p>
				In finance, markup refers to the difference between the cost of a product or service
				and its selling price. It&apos;s essentially the amount added to the cost price of
				goods or services to cover expenses and generate profit.
			</p>

			<p>
				Markup can also be used to define the difference between an investment&apos;s lowest
				current offering price among broker-dealers and the price charged to the customer
				for said investment. Markups occur when brokers act as principals, buying and
				selling securities from their own accounts at their own risk rather than receiving a
				fee for facilitating a transaction. Most dealers are brokers, and vice versa, and so
				the term broker-dealer is common.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Takeaways</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Markup is the difference between the cost of a product or service and its
						selling price.
					</li>

					<li>The markup is usually expressed as a percentage of the cost price.</li>

					<li>
						In retail settings, markups occur when retailers increase the selling price
						of merchandise by a certain amount or percentage in order to earn a profit.
					</li>

					<li>
						A markup is the difference between the market price of a security personally
						held by a broker-dealer and the price paid by a customer.
					</li>

					<li>
						Markups are a legitimate way for broker-dealers to make a profit on the sale
						of securities.
					</li>

					<li>
						Dealers, however, are not always required to disclose the markup to
						customers.
					</li>
				</ul>
			</div>

			<ReportSource
				href="https://www.investopedia.com/terms/m/markup.asp"
				text="Investopedia"
			/>
		</ReportSection>
	);
};

export default Info;
