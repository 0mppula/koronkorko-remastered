import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { buttonVariants } from '@/components/ui/button';
import { calculatorDisclaimers } from '@/constants/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const Info = () => {
	return (
		<ReportSection title="How Is the Descent Planned?">
			<p>
				To arrive at a target altitude at the right place, a pilot works out where to start
				the descent (the top of descent) or the vertical speed needed to lose the altitude
				within a given distance. The calculator uses the altitude to lose, the groundspeed
				and a constant descent, and also shows the time to descend and the descent gradient.
			</p>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					With the altitude to lose (Δh) in feet, the groundspeed (GS) in knots and the
					vertical speed (VS) in feet per minute:
				</p>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>Top of descent by vertical speed: distance = Δh × GS / (60 × VS).</li>

					<li>
						Top of descent by angle: the gradient in feet per nautical mile is the
						tangent of the angle times 6,076.12 ft (1 NM); distance = Δh / gradient and
						VS = gradient × GS / 60.
					</li>

					<li>Required vertical speed: VS = Δh × GS / (60 × distance).</li>

					<li>
						Time to descend = Δh / VS. Gradient = Δh / distance, shown in ft/NM, in
						percent and in degrees.
					</li>
				</ul>

				<p>
					The descent is treated as a straight line over a flat earth, without
					deceleration or level-off segments.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Examples From the FAA Instrument Procedures Handbook</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Losing 6,000 ft at 120 knots and 600 fpm: start the descent 20 NM out; the
						descent takes 10 minutes (p. 3-4).
					</li>

					<li>
						From 12,000 ft to 6,000 ft at 180 knots and 500 fpm: start the descent 36 NM
						out (p. 3-20).
					</li>

					<li>
						From 12,000 ft to 6,000 ft within 23 NM at 180 knots: the handbook rounds
						the time up to 8 minutes and asks for at least 750 fpm; the exact value is
						783 fpm in 7.7 minutes (p. 3-20).
					</li>
				</ul>
			</div>

			<div className="mt-4">
				<TypographyH3>Rules of Thumb</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						Distance to start the descent: divide the altitude to lose by 300. 6,000 ft
						÷ 300 = 20 NM (p. 3-4).
					</li>

					<li>
						Vertical speed for a 3° path: multiply the groundspeed by 5. 120 knots × 5 =
						600 fpm (p. 3-4).
					</li>

					<li>A 3° path is about 318 ft/NM (p. 3-12).</li>
				</ul>

				<p>
					These are approximations. The exact 3° path is 318.4 ft/NM, so losing 6,000 ft
					at 120 knots on a 3° path takes 18.84 NM at 637 fpm.
				</p>
			</div>

			<div className="mt-4">
				<TypographyH3>Groundspeed, Not Airspeed</TypographyH3>

				<p className="mt-4">
					The distance covered during the descent depends on the groundspeed: the true
					airspeed corrected for the wind. A tailwind makes the descent cover more ground,
					so it must start earlier or use a higher vertical speed; a headwind does the
					opposite. The wind often changes during a descent, so use the expected average
					groundspeed. The{' '}
					<Link
						href="/time-speed-distance-calculator"
						className={cn(
							buttonVariants({ variant: 'link', size: 'sm' }),
							'p-0 h-auto transition-none'
						)}
					>
						Time Speed Distance Calculator
					</Link>{' '}
					relates the groundspeed, distance and time.
				</p>
			</div>

			<p>{calculatorDisclaimers.aviation}</p>

			<ReportSource
				href="https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook"
				text="FAA Instrument Procedures Handbook"
			/>
		</ReportSection>
	);
};

export default Info;
