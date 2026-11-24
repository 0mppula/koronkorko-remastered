import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { buttonVariants } from '@/components/ui/button';
import { calculatorDisclaimers } from '@/constants/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const linkClassName = cn(
	buttonVariants({ variant: 'link', size: 'sm' }),
	'p-0 h-auto transition-none'
);

const Info = () => {
	return (
		<ReportSection title="What Are True, Magnetic and Compass Headings?">
			<p>
				Charts are drawn with meridians that point to the geographic North Pole, so a course
				measured on a chart is a true direction. The magnetic compass points to the magnetic
				North Pole, which is not in the same place, and it is also pulled off by magnetic
				fields inside the aircraft. To fly a true heading by the compass, a pilot converts
				it to a magnetic heading and then to a compass heading.
			</p>

			<div className="mt-4">
				<TypographyH3>Start With the True Heading</TypographyH3>

				<p className="mt-4">
					The true heading is the true course corrected for the wind. The{' '}
					<Link href="/wind-triangle-calculator" className={linkClassName}>
						Wind Triangle Calculator
					</Link>{' '}
					calculates it from the true course, the true airspeed and the wind.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Variation: True to Magnetic</TypographyH3>

				<p className="mt-4">
					Variation is the angle between true north and magnetic north. Aeronautical
					charts show it with isogonic lines, which connect points of equal variation.
					Along the agonic line the variation is zero. Variation depends on where you are,
					not on the heading.
				</p>

				<p className="mt-4">
					To get the magnetic heading, subtract an easterly variation and add a westerly
					one: &quot;east is least, west is best&quot;. With a variation of 9° E, a true
					heading of 360° becomes a magnetic heading of 351°, 090° becomes 081°, 180°
					becomes 171° and 270° becomes 261°. Near Washington, D.C., where the variation
					is 10° W, a true heading of 180° becomes 190° magnetic.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Deviation: Magnetic to Compass</TypographyH3>

				<p className="mt-4">
					Deviation is the compass error caused by the aircraft itself: electrical
					equipment, radios and magnetized metal parts. Unlike variation, it changes with
					the heading. After the compass is checked on a compass rose, the remaining
					corrections are written on a compass card mounted near the compass, usually
					every 30°.
				</p>

				<p className="mt-4">
					Enter the correction as it is printed on the card, with its sign, for the
					magnetic heading you are flying. It is added to the magnetic heading: a magnetic
					heading of 190° with a correction of -2° gives a compass heading of 188°.
					Without a correction the calculator gives the magnetic heading only.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Wind Direction for Runways</TypographyH3>

				<p className="mt-4">
					Winds in METAR and TAF reports are given relative to true north, while runway
					numbers are magnetic. Converting a reported wind direction to magnetic here lets
					you use it in the{' '}
					<Link href="/crosswind-calculator" className={linkClassName}>
						Crosswind Calculator
					</Link>
					.
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
