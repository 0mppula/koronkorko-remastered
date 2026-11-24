import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="How Is the Glide Distance Calculated?">
			<p>
				If the engine fails, the distance an airplane can glide decides which landing sites
				are within reach. The calculator estimates that distance from the height above the
				terrain and the glide ratio, and optionally the effect of a headwind or tailwind.
			</p>

			<div className="mt-4">
				<TypographyH3>Glide Ratio</TypographyH3>

				<p className="mt-4">
					As the FAA Airplane Flying Handbook explains, the glide ratio is the distance an
					airplane travels in relation to the altitude it loses: an airplane that travels
					10,000 ft forward while descending 1,000 ft has a glide ratio of 10:1. The glide
					ratio is best at the best glide speed, which is given in the Pilot&apos;s
					Operating Handbook (POH), and both should be taken from there.
				</p>

				<p className="mt-4">
					The height is the altitude minus the terrain elevation. In still air, the glide
					distance is the height times the glide ratio, converted from feet to nautical
					miles (1 NM = 1,852 m = 6,076.12 ft).
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Wind</TypographyH3>

				<p className="mt-4">
					With a tailwind the airplane glides farther because of the higher groundspeed,
					and with a headwind it doesn&apos;t glide as far. The FAA Glider Flying Handbook
					gives the example of a glider flying at 60 knots true airspeed: into a 25 knot
					headwind its groundspeed is only 35 knots, and with a 25 knot tailwind it is 85
					knots.
				</p>

				<p className="mt-4">
					The airplane descends at the same rate whatever the wind, so the time aloft is
					the still-air distance divided by the glide true airspeed. The wind only changes
					how far the airplane moves over the ground in that time: the glide distance is
					the still-air distance times the groundspeed divided by the true airspeed. A
					wind therefore needs the glide true airspeed, and a headwind must be lower than
					it. A wind speed of 0 is the same as no wind. Enter the headwind or tailwind
					component; the Crosswind Calculator gives it from a reported wind.
				</p>

				<p className="mt-4">
					In a headwind, pilots fly slightly faster than the best glide speed to get the
					most distance (Airplane Flying Handbook; the Glider Flying Handbook suggests
					adding half the headwind component). This calculator doesn&apos;t model that: it
					keeps the glide ratio and true airspeed as entered.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>What Isn&apos;t Included</TypographyH3>

				<p className="mt-4">
					Turns, extended flaps or gear, a windmilling propeller and rising terrain all
					shorten the glide. The result is a straight-line estimate over flat terrain at
					the given elevation.
				</p>
			</div>

			<p>{calculatorDisclaimers.aviation}</p>

			<ReportSource
				href="https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook"
				text="FAA Airplane Flying Handbook"
			/>
		</ReportSection>
	);
};

export default Info;
