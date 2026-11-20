import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { calculatorDisclaimers } from '@/constants/data';

const Info = () => {
	return (
		<ReportSection title="What Is the Wind Triangle?">
			<p>
				An aircraft moves through the air, and the air itself moves with the wind. To fly a
				planned course over the ground, the pilot points the aircraft slightly into the
				wind. The wind triangle connects the three vectors involved: the aircraft&apos;s
				heading and true airspeed, the wind, and the resulting course and groundspeed.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Terms</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The true course is the planned path over the ground. The true heading is
						where the nose of the aircraft points to stay on that course.
					</li>

					<li>
						The true airspeed (TAS) is the speed through the air. The groundspeed is the
						speed over the ground, which decides the time en route.
					</li>

					<li>
						The wind correction angle (WCA) is the difference between the heading and
						the course. A wind from the right needs a correction to the right, and a
						wind from the left a correction to the left.
					</li>
				</ul>
			</div>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					The wind angle is the difference between the wind direction and the true course.
					Then:
				</p>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>WCA = asin(wind speed × sin(wind angle) / TAS)</li>
					<li>True heading = true course + WCA</li>
					<li>Groundspeed = TAS × cos(WCA) − wind speed × cos(wind angle)</li>
				</ul>

				<p>
					This is the closed-form solution of the wind triangle that the wind side of the
					E6B flight computer solves graphically, as described in the Navigation chapter
					of the FAA Pilot&apos;s Handbook of Aeronautical Knowledge and in Ed
					Williams&apos; Aviation Formulary.
				</p>

				<p className="mt-4">
					If the wind blowing across the course is stronger than the true airspeed, no
					heading can hold the course. If the wind leaves no forward groundspeed, the
					aircraft can&apos;t make progress along the course. Both cases are shown as an
					error instead of a result.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Entering the Inputs</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						All directions are true. The true course is measured from the chart, and
						winds aloft forecasts give the wind direction as true, so the result is a
						true heading. Converting it to a magnetic heading with the local magnetic
						variation is up to the pilot.
					</li>

					<li>
						The wind direction is the direction the wind blows from. North is entered as
						360.
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
