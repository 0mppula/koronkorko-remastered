import db from '@/lib/db';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
	const body = await req.text();

	const sig = req.headers.get('stripe-signature')!;
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
	} catch (error: any) {
		console.error('Webhook signature verification failed.', error.message);

		return new Response(`Webhook Error: ${error.message}`, { status: 400 });
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed':
				const session = await stripe.checkout.sessions.retrieve(
					(event.data.object as Stripe.Checkout.Session).id,
					{ expand: ['line_items'] }
				);

				const customerId = session.customer as string;
				const customerDetails = session.customer_details;

				if (customerDetails?.email) {
					const user = await db.user.findUnique({
						where: { email: customerDetails.email },
					});

					if (!user) {
						throw new Error('User not found');
					}

					if (!user.customerId) {
						await db.user.update({
							where: { id: user.id },
							data: { customerId },
						});
					}

					const lineItems = session.line_items?.data || [];

					for (const item of lineItems) {
						const priceId = item.price?.id;
						const isSubscription = item.price?.type === 'recurring';

						if (isSubscription) {
							let endDate = new Date();
							let period: 'weekly' | 'monthly' | 'yearly';

							if (priceId == process.env.STRIPE_YEARLY_PREMIUM_PRICE_ID!) {
								// 1 year from now
								period = 'yearly';
								endDate.setFullYear(endDate.getFullYear() + 1);
							} else if (priceId == process.env.STRIPE_MONTHLY_PREMIUM_PRICE_ID!) {
								// 1 month from now
								period = 'monthly';
								endDate.setMonth(endDate.getMonth() + 1);
							} else if (priceId == process.env.STRIPE_WEEKLY_PREMIUM_PRICE_ID!) {
								// 1 week from now
								period = 'weekly';
								endDate.setDate(endDate.getDate() + 7);
							} else {
								throw new Error('Invalid price ID');
							}

							await db.subscription.upsert({
								where: { userId: user.id },
								create: {
									userId: user.id,
									plan: 'premium',
									startDate: new Date(),
									endDate,
									period,
								},
								update: {
									plan: 'premium',
									startDate: new Date(),
									endDate,
									period,
								},
							});

							await db.user.update({
								where: { id: user.id },
								data: { plan: 'premium' },
							});
						} else {
							// One-time purchase
						}
					}
				}
				break;

			// case ''

			default:
				console.error(`Unhandled event type: ${event.type}`);
		}
	} catch (error) {
		console.error('Error handling event', error);
		return new Response('Webhook Error', { status: 400 });
	}

	return new Response('Webhook received', { status: 200 });
}
