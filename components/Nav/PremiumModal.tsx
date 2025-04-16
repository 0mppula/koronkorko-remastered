'use client';

import { getUsersSubscriptionData } from '@/app/actions/subscription';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { SUBSCRIPTION_QUERY_KEY } from '@/constants/api';
import { plans } from '@/constants/data';
import useLoginModal from '@/hooks/useLoginModal';
import usePremiumModal from '@/hooks/usePremiumModal';
import { Subscription } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const PremiumModal = () => {
	const { isOpen: isPremiumModalOpen, setIsOpen: setIsPremiumModalOpen } = usePremiumModal();
	const { setIsOpen: setIsLoginModalOpen } = useLoginModal();
	const { status: sessionStatus, data: sessionData } = useSession();

	const { data: subData } = useQuery<Subscription | null>({
		queryKey: [SUBSCRIPTION_QUERY_KEY, { sessionStatus }],
		queryFn: () => getUsersSubscriptionData(),
		enabled: sessionStatus === 'authenticated',
		refetchOnWindowFocus: false,
	});

	return (
		<Dialog open={isPremiumModalOpen} onOpenChange={(state) => setIsPremiumModalOpen(state)}>
			<DialogTrigger asChild className="hidden md:block">
				<Button variant="link">Pricing</Button>
			</DialogTrigger>

			<DialogContent className="md:max-w-4xl p-0 h-[80svh] md:h-auto">
				<DialogHeader className="p-6 pb-0">
					<DialogTitle className="mb-2">
						{sessionData?.user.plan === 'premium'
							? 'Premium Pricing'
							: 'Upgrade to Premium'}
					</DialogTitle>
				</DialogHeader>

				<ScrollArea className="w-full h-full md:max-h-[min(66svh,512px)] p-6 pt-0">
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
											<li
												key={feature}
												className="flex gap-3 text-neutral-700 dark:text-neutral-300"
											>
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
									{sessionStatus === 'authenticated' ? (
										sessionData?.user.plan === 'premium' &&
										subData?.period === plan.period ? (
											<Button disabled className="w-full" variant="secondary">
												Current Plan
											</Button>
										) : (
											<Button className="w-full" asChild disabled={true}>
												<Link
													href={
														sessionData?.user.plan === 'premium'
															? process.env
																	.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL!
															: plan.paymentLink
															? `${plan.paymentLink}?prefilled_email=${sessionData.user.email}`
															: '#'
													}
												>
													{sessionData?.user.plan === 'premium'
														? 'Switch to this Plan'
														: plan.actionLabel}
												</Link>
											</Button>
										)
									) : (
										<Button
											className="w-full"
											onClick={() => {
												setIsPremiumModalOpen(false);
												localStorage.setItem(
													'stripePaymentLink',
													plan.paymentLink || ''
												);
												setIsLoginModalOpen(true);
											}}
										>
											{plan.actionLabel}
										</Button>
									)}
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
