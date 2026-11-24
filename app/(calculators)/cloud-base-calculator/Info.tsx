import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="How Is the Cloud Base Estimated?">
			<p>
				When unsaturated air rises, it cools faster than its dew point falls. At the height
				where the temperature reaches the dew point, the air is saturated and clouds start
				to form. That height is the cloud base, and it can be estimated from the surface
				temperature and dew point reported in a METAR.
			</p>

			<div className="mt-4">
				<TypographyH3>The Rule</TypographyH3>

				<p className="mt-4">
					As the FAA Pilot&apos;s Handbook of Aeronautical Knowledge explains, lifted
					unsaturated air cools at about 5.4 °F per 1,000 ft, while its dew point falls at
					about 1 °F per 1,000 ft. The two converge at 4.4 °F per 1,000 ft, so the cloud
					base above ground level is the temperature/dew point spread in °F divided by
					4.4, times 1,000 ft.
				</p>

				<p className="mt-4">
					The handbook&apos;s example: with a temperature of 85 °F and a dew point of 71
					°F, the spread is 14 °F, 14 ÷ 4.4 = 3.18 and the cloud base is about 3,180 ft
					AGL. The calculator doesn&apos;t round the quotient, so it shows 3,182 ft.
				</p>

				<p className="mt-4">
					The spread is a temperature difference, so it is converted without the 32°
					offset: a spread of 10 °C is 18 °F. The result is the same in every temperature
					unit.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>When It Applies</TypographyH3>

				<p className="mt-4">
					The rule estimates the base of convective (cumulus) clouds, which form in
					rising, unstable air. It doesn&apos;t apply to stratus, fog or frontal clouds,
					which form in other ways. A spread of zero or only a few degrees means fog or
					very low clouds are likely.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>AGL and MSL</TypographyH3>

				<p className="mt-4">
					The rule gives the cloud base above ground level (AGL), measured from where the
					temperature and dew point were reported. Charts, altimeters and cruising
					altitudes use heights above mean sea level (MSL), so when a field elevation is
					given, the calculator adds it to give the cloud base MSL.
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
