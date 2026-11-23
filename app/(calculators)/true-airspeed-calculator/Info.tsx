import ReportSection from '@/components/Report/ReportSection';
import ReportSource from '@/components/Report/ReportSource';
import TypographyH3 from '@/components/TypographyH3';
import { buttonVariants } from '@/components/ui/button';
import { calculatorDisclaimers } from '@/constants/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const Info = () => {
	return (
		<ReportSection title="What Is True Airspeed?">
			<p>
				True airspeed (TAS) is the speed of the aircraft relative to the air it is flying
				in. It is the speed used for flight planning. Because the air gets thinner with
				altitude, the airspeed indicator reads less than the true airspeed at altitude, and
				the difference grows the higher and warmer the air is.
			</p>

			<div className="mt-4">
				<TypographyH3>Key Terms</TypographyH3>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>Indicated airspeed (IAS) is the speed shown on the airspeed indicator.</li>

					<li>
						Calibrated airspeed (CAS) is IAS corrected for instrument and position
						errors. Find it in the airspeed calibration table in the aircraft&apos;s
						Pilot&apos;s Operating Handbook (POH). According to the FAA Pilot&apos;s
						Handbook of Aeronautical Knowledge, IAS and CAS are about the same at cruise
						speeds, but may differ by several knots at low speeds. Entering IAS instead
						of CAS is only an approximation.
					</li>

					<li>
						The pressure altitude is the altitude shown by an altimeter set to 1013.25
						hPa (29.92 inHg). If you don&apos;t know it, the{' '}
						<Link
							href="/density-altitude-calculator"
							className={cn(
								buttonVariants({ variant: 'link', size: 'sm' }),
								'p-0 h-auto transition-none'
							)}
						>
							Density Altitude Calculator
						</Link>{' '}
						calculates it from the field elevation and QNH.
					</li>

					<li>
						The outside air temperature (OAT) is the static, or true, air temperature.
						At speed, the outside air temperature gauge reads high because the air heats
						up as it is compressed against the probe (ram rise). The Aviation Formulary
						gives the indicated temperature as about OAT + K × TAS² / 7592 (°C and kt),
						where the recovery factor K is usually 0.95 to 1.0.
					</li>
				</ul>
			</div>

			<div className="mt-4">
				<TypographyH3>How It Is Calculated</TypographyH3>

				<p className="mt-4">
					The calculator uses the exact compressible-flow formulas of the Aviation
					Formulary with the ICAO Standard Atmosphere:
				</p>

				<ul className="my-4 ml-6 list-disc [&>li]:mt-2">
					<li>
						The static pressure follows from the pressure altitude, and the impact
						pressure on the pitot tube follows from the CAS.
					</li>
					<li>
						The Mach number follows from the ratio of these two pressures. Only subsonic
						speeds (below Mach 1) are supported.
					</li>
					<li>
						The true airspeed is the Mach number times the speed of sound at the outside
						air temperature.
					</li>
					<li>
						The density altitude is the standard atmosphere altitude with the same air
						density. It is not calculated above the tropopause (36,089 ft, or 11,000 m),
						where the troposphere formulas don&apos;t apply.
					</li>
				</ul>

				<p>
					At low speeds (below about Mach 0.3), compressibility can be ignored and the
					true airspeed is approximately TAS = CAS × √(ρ₀ / ρ), where ρ is the air density
					and ρ₀ the standard sea level density.
				</p>

				<p className="mt-4">
					Two rules of thumb give quick estimates: the FAA Pilot&apos;s Handbook of
					Aeronautical Knowledge suggests adding 2 % of the CAS for every 1,000 ft of
					altitude, and the Aviation Formulary says TAS increases roughly 1.5 % per 1,000
					ft. They are useful mental checks, but the calculator doesn&apos;t use them, so
					its results differ from them.
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
