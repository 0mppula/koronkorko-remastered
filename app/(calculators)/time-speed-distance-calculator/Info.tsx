import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { buttonVariants } from '@/components/ui/button';
import { calculatorDisclaimers } from '@/constants/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const Info = () => {
	return (
		<ReportSection title="What Are Time, Speed and Distance Calculations?">
			<p>
				Before a cross-country flight, a pilot works out how long each leg takes, how far
				the aircraft flies in a given time, or what groundspeed it makes. Distance,
				groundspeed and time are linked, so any two of them give the third.
			</p>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					The FAA Pilot&apos;s Handbook of Aeronautical Knowledge gives three relations,
					with the time (T) in hours, the distance (D) in nautical miles and the
					groundspeed (GS) in knots:
				</p>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Time: T = D / GS. The time to fly 210 NM at a groundspeed of 140 knots is
						210 ÷ 140 = 1.5 hours, or 1 h 30 min.
					</li>

					<li>
						Distance: D = GS × T. The distance flown in 1 hour 45 minutes at a
						groundspeed of 120 knots is 120 × 1.75 = 210 NM.
					</li>

					<li>
						Groundspeed: GS = D / T. If an aircraft flies 270 NM in 3 hours, its
						groundspeed is 270 ÷ 3 = 90 knots.
					</li>
				</ul>

				<p>
					To use minutes in these formulas, divide them by 60 to get hours: 45 minutes is
					45 ÷ 60 = 0.75 hours. The calculator does this for you and works the same in
					kilometres and statute miles, as long as the speed is in the matching unit.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Groundspeed</TypographyH3>

				<p className="mt-4">
					The groundspeed is the speed of the aircraft over the ground: the true airspeed
					corrected for the wind. A headwind makes it lower than the true airspeed and a
					tailwind higher. The{' '}
					<Link
						href="/wind-triangle-calculator"
						className={cn(
							buttonVariants({ variant: 'link', size: 'sm' }),
							'p-0 h-auto transition-none'
						)}
					>
						Wind Triangle Calculator
					</Link>{' '}
					calculates the groundspeed from the true airspeed and the wind.
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
