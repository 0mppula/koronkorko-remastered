import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="What Are Crosswind and Headwind Components?">
			<p>
				Wind rarely blows straight down a runway. The crosswind component is the part of the
				wind blowing across the runway, and the headwind component is the part blowing along
				it, against the direction of travel. A negative headwind is a tailwind.
			</p>

			<div className="mt-4">
				<TypographyH3>Why They Matter</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Every aircraft has a maximum demonstrated crosswind component, and pilots
						have their own personal limits. The crosswind decides whether a runway is
						usable.
					</li>

					<li>
						A headwind shortens the takeoff and landing distance, while a tailwind
						lengthens it considerably. This is why pilots usually take off and land into
						the wind.
					</li>

					<li>
						Gusts make the wind stronger for short moments. The gust components show the
						crosswind and headwind at the gust speed, assuming the same wind direction.
					</li>
				</ul>
			</div>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					The wind angle is the difference between the wind direction and the runway
					heading. The components are then:
				</p>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>Crosswind = wind speed × sin(wind angle)</li>
					<li>Headwind = wind speed × cos(wind angle)</li>
				</ul>

				<p>
					This is the same vector decomposition that the crosswind component chart in the
					FAA Pilot&apos;s Handbook of Aeronautical Knowledge and the E6B flight computer
					solve graphically.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Entering the Inputs</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The runway input is the runway heading, not the runway number. The runway
						number is roughly the magnetic heading divided by 10, so runway 09 is
						roughly 090°. The published runway heading is more precise.
					</li>

					<li>
						The wind direction is the direction the wind blows from. North is entered as
						360.
					</li>

					<li>
						The wind direction and runway heading must both be magnetic. Winds from the
						tower and ATIS are magnetic, like runway headings. Winds in a METAR or TAF
						are true and must first be converted to magnetic with the local magnetic
						variation (subtract easterly variation, add westerly variation).
					</li>
				</ul>
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
