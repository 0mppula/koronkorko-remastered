import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="How Is the Turn Performance Calculated?">
			<p>
				In a coordinated level turn, the bank angle and the true airspeed decide how fast
				the airplane turns, how much space the turn takes and how much load the wings carry.
				The calculator uses the exact physics of the turn with standard gravity (g = 9.80665
				m/s²); wind, climbs, descents and uncoordinated turns aren&apos;t included.
			</p>

			<div className="mt-4">
				<TypographyH3>Rate and Radius of Turn</TypographyH3>

				<p className="mt-4">
					The FAA Pilot&apos;s Handbook of Aeronautical Knowledge (PHAK) gives the rate of
					turn as 1,091 times the tangent of the bank angle divided by the true airspeed
					in knots, and the radius as the true airspeed squared divided by 11.26 times the
					tangent of the bank angle. At 120 knots and 30° of bank, its examples give 5.25°
					per second, 68.6 seconds for a full circle and a radius of 2,215 ft; at 240
					knots, the rate halves and the radius quadruples.
				</p>

				<p className="mt-4">
					The constants 1,091 and 11.26 are rounded; the exact values with standard
					gravity are 1,092.2 and 11.294. The calculator therefore shows 5.25° per second,
					1 min 9 s and 2,208 ft for the PHAK example. The time for 360° is 360° divided
					by the rate of turn.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Standard-Rate Turn</TypographyH3>

				<p className="mt-4">
					A standard-rate turn is 3° per second, so a full 360° turn takes 2 minutes. The
					bank angle it needs grows with the true airspeed. The calculator gives the exact
					value, and there are rules of thumb for estimating it in flight:
				</p>

				<ul className="mt-4 list-disc pl-6 space-y-2">
					<li>
						The Aviation Formulary: the true airspeed in knots divided by 7,
						&quot;accurate to ~1 degree for speeds less than 250 knots&quot;. At 120
						knots that is about 17°.
					</li>
					<li>
						The FAA Instrument Flying Handbook (p. 4-11): &quot;divide the airspeed by
						ten and add 7&quot;. At 120 knots that is 19°.
					</li>
					<li>
						The FAA Instrument Flying Handbook (p. 7-19): &quot;15 percent of the true
						airspeed&quot;. At 120 knots that is 18°.
					</li>
				</ul>

				<p className="mt-4">The exact value at 120 knots is 18.2°.</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Load Factor and Stall Speed</TypographyH3>

				<p className="mt-4">
					In a level turn the wings must carry more than the airplane&apos;s weight: the
					load factor is 1 divided by the cosine of the bank angle. The PHAK notes that
					the load factor at 60° of bank is 2 G, and that the stall speed increases with
					the square root of the load factor, so an airplane that stalls at 50 knots in
					level flight can be stalled at 100 knots at 4 G.
				</p>

				<p className="mt-4">
					Enter the stall speed from the Pilot&apos;s Operating Handbook (POH) to get the
					stall speed in the turn. POH stall speeds are indicated or calibrated airspeeds,
					so compare the stall speed in the turn with the indicated airspeed, not with the
					true airspeed entered above: at altitude the true airspeed is higher than the
					indicated airspeed, and the comparison would miss a stall.
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
