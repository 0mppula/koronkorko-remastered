import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="What Is Fuel Planning?">
			<p>
				Fuel planning is working out, before a flight, how much fuel the aircraft needs to
				carry. The basic calculation is the same for every aircraft: the fuel used is the
				fuel burn rate multiplied by the time it is burned.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Terms</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The trip fuel is the fuel burned during the flight: the burn rate multiplied
						by the flight time.
					</li>

					<li>
						The reserve fuel is the fuel for flying on for the reserve time at the same
						burn rate, for example when the destination is busy or the weather is worse
						than forecast.
					</li>

					<li>
						The taxi fuel is the fuel used on the ground for starting, taxiing and
						run-ups before takeoff.
					</li>

					<li>
						The extra fuel is any fuel added at the pilot&apos;s discretion, for example
						for an expected hold or a possible diversion.
					</li>
				</ul>

				<p>The total fuel is the trip fuel, reserve fuel, taxi fuel and extra fuel.</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Reserve Fuel</TypographyH3>

				<p className="mt-4">
					Typical minimum reserves are 30 minutes for flights in daylight under visual
					flight rules and 45 minutes at night or under instrument flight rules. The
					required reserve depends on the country, the type of operation and the aircraft,
					so always check the rules that apply to your flight. The calculator doesn&apos;t
					check the reserve time against any regulation.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Volume and Mass</TypographyH3>

				<p className="mt-4">
					Fuel is loaded by volume, in litres or gallons, but weight and balance
					calculations need its mass. The calculator converts between them with the fuel
					density. It uses fixed weights from the FAA Aircraft Weight and Balance Handbook
					(FAA-H-8083-1B): 6.0 lb per US gallon (about 0.719 kg/L) for AVGAS, also used in
					the FAA Pilot&apos;s Handbook of Aeronautical Knowledge, and 6.68 lb per US
					gallon (about 0.800 kg/L) for Jet A, the handbook&apos;s value at 15 °C (59 °F).
					The Jet A value is often rounded to 6.7 lb per US gallon.
				</p>

				<p className="mt-4">
					The actual density varies with temperature and with the fuel batch: cold fuel is
					denser than warm fuel, so the same volume weighs more. Use the aircraft&apos;s
					documents or the measured density when the exact mass matters.
				</p>

				<p className="mt-4">
					When the fuel unit is a mass unit (kg or lb), the entered amounts are converted
					to volume with the density of the selected fuel type, so changing the fuel type
					keeps the entered masses and changes their volume.
				</p>
			</div>

			<p>{calculatorDisclaimers.aviation}</p>

			<ReportSource
				href="https://www.faa.gov/regulations_policies/handbooks_manuals/aviation"
				text="FAA Aviation Handbooks & Manuals"
			/>
		</ReportSection>
	);
};

export default Info;
