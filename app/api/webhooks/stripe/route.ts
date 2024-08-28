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
			case 'checkout.session.completed': {
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
			}

			case 'customer.subscription.deleted': {
				const subscription = await stripe.subscriptions.retrieve(event.data.object.id);

				const user = await db.user.findFirst({
					where: { customerId: subscription.customer as string },
				});

				if (user) {
					await db.user.update({
						where: { id: user.id },
						data: { plan: 'free', customerId: null },
					});

					const subscription = await db.subscription.findFirst({
						where: { userId: user.id },
					});

					if (subscription) {
						await db.subscription.update({
							where: { userId: user.id },
							data: { endDate: new Date() },
						});
					} else {
						console.error(
							'Subscription not found for the subscription deletion event.'
						);
						throw new Error(
							'Subscription not found for the subscription deletion event.'
						);
					}
				} else {
					console.error('User not found for the subscription deletion event.');
					throw new Error('User not found for the subscription deletion event.');
				}

				break;
			}

			case 'customer.subscription.updated': {
				const subscription = await stripe.subscriptions.retrieve(event.data.object.id);

				const user = await db.user.findFirst({
					where: { customerId: subscription.customer as string },
				});

				if (user) {
					await db.user.update({
						where: { id: user.id },
						data: { plan: 'premium' },
					});

					const dbSub = await db.subscription.findFirst({
						where: { userId: user.id },
					});

					if (dbSub) {
						const line_items = subscription.items.data;

						for (const item of line_items) {
							const priceId = item.price.id;
							const isSubscription = item.price.type === 'recurring';

							if (isSubscription) {
								let endDate =
									new Date(subscription.billing_cycle_anchor * 1000) ||
									new Date();
								let period: 'weekly' | 'monthly' | 'yearly';

								if (priceId == process.env.STRIPE_YEARLY_PREMIUM_PRICE_ID!) {
									// 1 year from now
									period = 'yearly';
									endDate.setFullYear(endDate.getFullYear() + 1);
								} else if (
									priceId == process.env.STRIPE_MONTHLY_PREMIUM_PRICE_ID!
								) {
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
					} else {
						console.error('Subscription not found for the subscription update event.');
						throw new Error(
							'Subscription not found for the subscription update event.'
						);
					}
				} else {
					console.error('User not found for the subscription update event.');
					throw new Error('User not found for the subscription update event.');
				}

				break;
			}

			default:
				console.error(`Unhandled event type: ${event.type}`);
		}
	} catch (error) {
		console.error('Error handling event', error);
		return new Response('Webhook Error', { status: 400 });
	}

	return new Response('Webhook received', { status: 200 });
}
