'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import useLoginModal from '@/hooks/useLoginModal';
import usePremiumModal from '@/hooks/usePremiumModal';
import { CircleCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const plans = [
	{
		title: 'Weekly Plan',
		interval: 'week',
		price: 5,
		features: ['Unlimited calculations', 'Priority support', 'Cancel anytime'],
		actionLabel: 'Get Started',
		paymentLink: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PREMIUM_LINK,
	},
	{
		title: 'Monthly Plan',
		interval: 'month',
		price: 10,
		features: ['Unlimited calculations', 'Priority support', 'Save 50%', 'Cancel anytime'],
		actionLabel: 'Get Started',
		paymentLink: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PREMIUM_LINK,
	},
	{
		title: 'Yearly Plan',
		interval: 'year',
		price: 90,
		features: ['Unlimited calculations', 'Priority support', 'Save 65%', 'Cancel anytime'],
		actionLabel: 'Get Started',
		paymentLink: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PREMIUM_LINK,
	},
];

const PremiumModal = () => {
	const { isOpen: isPremiumModalOpen, setIsOpen: setIsPremiumModalOpen } = usePremiumModal();
	const { setIsOpen: setIsLoginModalOpen } = useLoginModal();
	const { status: sessionStatus, data: userData } = useSession();

	return (
		<Dialog open={isPremiumModalOpen} onOpenChange={(state) => setIsPremiumModalOpen(state)}>
			<DialogTrigger asChild className="hidden md:block">
				<Button variant="link">Premium</Button>
			</DialogTrigger>

			<DialogContent className="md:max-w-4xl p-0 h-[80svh] md:h-auto">
				<DialogHeader className="p-6 pb-0">
					<DialogTitle>Upgrade to Premium</DialogTitle>
				</DialogHeader>

				<ScrollArea className="w-full h-full md:max-h-[min(66svh,512px)] p-6 pt-0 ">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{plans.map((plan) => (
							<Card key={plan.title} className="flex flex-col">
								<CardHeader className="text-center space-y-0">
									<CardTitle>{plan.title}</CardTitle>

									<Separator className="!my-3" />

									<h4 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
										${plan.price} / {plan.interval}
									</h4>
								</CardHeader>

								<CardContent className="grow">
									<ul className="flex flex-col gap-2">
										{plan.features.map((feature) => (
											<li key={feature} className="flex gap-3">
												<CircleCheck
													aria-hidden
													className="text-success size-5 min-w-5 min-h-5 mt-0.5"
												/>
												{feature}
											</li>
										))}
									</ul>
								</CardContent>

								<CardFooter>
									<Button
										className="w-full"
										asChild={sessionStatus === 'authenticated'}
										onClick={
											sessionStatus === 'authenticated'
												? undefined
												: () => {
														setIsPremiumModalOpen(false);
														localStorage.setItem(
															'stripePaymentLink',
															plan.paymentLink || ''
														);
														setIsLoginModalOpen(true);
												  }
										}
									>
										{sessionStatus === 'authenticated' ? (
											<Link
												href={
													plan.paymentLink
														? `${plan.paymentLink}?prefilled_email=${userData.user.email}`
														: '#'
												}
											>
												{plan.actionLabel}
											</Link>
										) : (
											<>{plan.actionLabel}</>
										)}
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};

export default PremiumModal;
