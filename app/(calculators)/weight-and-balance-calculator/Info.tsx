import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="What Is Weight and Balance?">
			<p>
				Weight and balance is checking, before a flight, that the aircraft is not too heavy
				and that its center of gravity (CG) is within the limits set by the manufacturer. An
				aircraft loaded beyond its maximum weight or with its CG outside the limits may be
				hard or impossible to control and performs worse than its handbook shows.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Terms</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The datum is an imaginary vertical plane from which all distances are
						measured. Its location is set by the manufacturer and is given in the
						aircraft&apos;s documents.
					</li>

					<li>
						The arm is the horizontal distance from the datum to an item. Arms aft of
						the datum are positive; arms forward of the datum are negative (FAA
						Pilot&apos;s Handbook of Aeronautical Knowledge, FAA-H-8083-25C, p. 10-6).
					</li>

					<li>
						A station is a location in the aircraft given by its arm, such as a seat
						row, a baggage area or a fuel tank.
					</li>

					<li>
						The moment is the weight of an item multiplied by its arm. A moment index is
						a moment divided by a constant such as 100 or 1,000, which keeps the numbers
						small (p. 10-5). The calculator shows the total moment divided by 1,000.
					</li>
				</ul>
			</div>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					Each station&apos;s moment is its weight multiplied by its arm. The total weight
					is the sum of the station weights, the total moment is the sum of the station
					moments, and the CG is the total moment divided by the total weight (p. 10-7).
				</p>

				<p className="mt-4">
					For example, in the handbook&apos;s computational method (Figure 10-5, p. 10-7)
					an aircraft with an empty weight of 2,100 lb at 78.3 in, 340 lb of front seat
					occupants at 85.0 in, 350 lb of rear seat occupants at 121.0 in, 75 gallons of
					AVGAS (450 lb) at 75.0 in and 80 lb of baggage at 150.0 in weighs 3,320 lb, with
					a total moment of 281,430 lb-in. Its CG is 281,430 ÷ 3,320 = 84.8 in. These
					values are the calculator&apos;s default stations.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Fuel and Standard Weights</TypographyH3>

				<p className="mt-4">
					Fuel stations take the fuel quantity in the fuel unit, converted to weight with
					the density of the selected fuel type: 6.0 lb per US gallon for AVGAS and 6.68
					lb per US gallon for Jet A (FAA Aircraft Weight and Balance Handbook,
					FAA-H-8083-1B). The Pilot&apos;s Handbook of Aeronautical Knowledge lists 6.8 lb
					per US gallon for Jet A as a standard weight (p. 10-5).
				</p>

				<p className="mt-4">
					Use actual weights of people and baggage where possible, and the empty weight,
					arms and fuel densities from the aircraft&apos;s weight and balance records and
					its flight manual (AFM/POH). They take precedence over the values in this
					calculator.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Checking the CG Limits</TypographyH3>

				<p className="mt-4">
					The calculator checks the total weight against an optional maximum takeoff
					weight, but it doesn&apos;t check the CG limits. The CG envelope of many
					aircraft is not a simple range: the forward limit often moves aft at higher
					weights, so a single pair of forward and aft limits could show a loading as
					within limits when it is not. Compare the total weight with the CG, or with the
					moment/1000, on the envelope chart in your aircraft&apos;s flight manual.
				</p>
			</div>

			<p>{calculatorDisclaimers.aviation}</p>

			<ReportSource
				href="https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak"
				text="FAA Pilot's Handbook of Aeronautical Knowledge"
			/>
		</ReportSection>
	);
};

export default Info;
