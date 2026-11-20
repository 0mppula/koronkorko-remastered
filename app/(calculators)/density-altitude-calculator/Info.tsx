import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="What Is Density Altitude?">
			<p>
				Density altitude is the altitude in the standard atmosphere where the air has the
				same density as the air the aircraft is actually flying in. Wings, propellers and
				engines respond to air density, so the aircraft performs as if it were at its
				density altitude, not at the field elevation.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Terms</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The pressure altitude is the altitude shown by an altimeter set to the
						standard pressure of 1013.25 hPa (29.92 inHg). It equals the field elevation
						only when the QNH is standard.
					</li>

					<li>
						The QNH, or altimeter setting, is the pressure setting that makes the
						altimeter read the field elevation on the ground.
					</li>

					<li>
						The ISA temperature is the temperature of the International Standard
						Atmosphere at the pressure altitude: 15 °C at sea level, falling by 6.5 °C
						per 1,000 m (about 2 °C per 1,000 ft). The ISA deviation is the outside air
						temperature minus the ISA temperature.
					</li>
				</ul>
			</div>

			<div className="mt-4">
				<TypographyH3>Why It Matters</TypographyH3>

				<p className="mt-4">
					As the FAA Pilot&apos;s Handbook of Aeronautical Knowledge explains, a high
					density altitude means thinner air: the engine produces less power, the
					propeller produces less thrust and the wing produces less lift at the same
					indicated airspeed. Takeoff runs get longer and climb rates get lower. High, hot
					and humid conditions are the most demanding.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					The calculator uses the exact formulas of the ICAO Standard Atmosphere for the
					troposphere:
				</p>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The station pressure follows from the QNH and the field elevation, because
						an altimeter set to the QNH reads the field elevation.
					</li>
					<li>
						The pressure altitude is the standard atmosphere altitude with that
						pressure.
					</li>
					<li>
						The air density follows from the station pressure and the outside air
						temperature (ideal gas law), and the density altitude is the standard
						atmosphere altitude with that density.
					</li>
				</ul>

				<p>
					A common rule of thumb is that the density altitude rises by about 120 ft for
					every 1 °C the temperature is above ISA, and falls when it is below. It is a
					useful mental check, but the calculator doesn&apos;t use it, so its results
					differ slightly from the rule of thumb.
				</p>

				<p className="mt-4">
					The calculation assumes dry air. Humid air is less dense than dry air, so
					humidity raises the density altitude slightly above the calculated value.
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
