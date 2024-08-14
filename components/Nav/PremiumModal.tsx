'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import usePremiumModal from '@/hooks/usePremiumModal';
import { CircleCheck } from 'lucide-react';
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
	},
	{
		title: 'Monthly Plan',
		interval: 'month',
		price: 10,
		features: ['Unlimited calculations', 'Priority support', 'Save 50%', 'Cancel anytime'],
		actionLabel: 'Get Started',
	},
	{
		title: 'Yearly Plan',
		interval: 'year',
		price: 90,
		features: ['Unlimited calculations', 'Priority support', 'Save 65%', 'Cancel anytime'],
		actionLabel: 'Get Started',
	},
];

const PremiumModal = () => {
	const { isOpen, setIsOpen } = usePremiumModal();

	return (
		<Dialog open={isOpen} onOpenChange={(state) => setIsOpen(state)}>
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
									<Button className="w-full">{plan.actionLabel}</Button>
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
