"use client";

import { useEffect, useState } from "react";
import type {
	BarSubscription,
	Invoice,
	SubscriptionPlan,
} from "@/types/database";

interface BillingContentProps {
	barId: number | null;
}

export default function BillingContent({ barId }: BillingContentProps) {
	const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
	const [subscription, setSubscription] = useState<
		(BarSubscription & { subscription_plans: SubscriptionPlan }) | null
	>(null);
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();
	}, [barId]);

	const fetchData = async () => {
		const [plansRes, subRes, invoicesRes] = await Promise.all([
			fetch("/api/subscriptions/plans"),
			barId ? fetch(`/api/bars/${barId}/subscription`) : Promise.resolve(null),
			barId ? fetch(`/api/bars/${barId}/invoices`) : Promise.resolve(null),
		]);

		const plansData = await plansRes.json();
		setPlans(plansData.plans || []);

		if (subRes) {
			const subData = await subRes.json();
			setSubscription(subData.subscription);
		}

		if (invoicesRes) {
			const invoicesData = await invoicesRes.json();
			setInvoices(invoicesData.invoices || []);
		}

		setLoading(false);
	};

	const handleSubscribe = async (priceId: string) => {
		if (!barId) {
			alert("Please select a bar first");
			return;
		}

		const res = await fetch("/api/subscriptions/create-checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ barId, priceId }),
		});

		const data = await res.json();
		if (data.url) {
			window.location.href = data.url;
		}
	};

	if (loading) return <div className="p-6">Loading...</div>;

	return (
		<div className="p-6 space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">Billing & Subscription</h1>
				<p className="text-gray-600">
					Manage your subscription and billing information
				</p>
			</div>

			{subscription ? (
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
					<div className="space-y-2">
						<p>
							<strong>Plan:</strong> {subscription.subscription_plans.name}
						</p>
						<p>
							<strong>Price:</strong> ¥
							{subscription.subscription_plans.price.toLocaleString()}/
							{subscription.subscription_plans.interval === "month"
								? "月"
								: "年"}
						</p>
						<p>
							<strong>Status:</strong>{" "}
							<span
								className={`px-2 py-1 text-xs rounded ${subscription.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
							>
								{subscription.status}
							</span>
						</p>
						<p>
							<strong>Current Period:</strong>{" "}
							{new Date(subscription.current_period_start).toLocaleDateString()}{" "}
							- {new Date(subscription.current_period_end).toLocaleDateString()}
						</p>
						{subscription.subscription_plans.features && (
							<div>
								<strong>Features:</strong>
								<ul className="list-disc list-inside mt-2">
									{(
										subscription.subscription_plans
											.features as unknown as string[]
									).map((feature: string, i: number) => (
										<li key={i}>{feature}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			) : (
				<div>
					<h2 className="text-xl font-semibold mb-4">Available Plans</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{plans.map((plan) => (
							<div key={plan.id} className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
								<p className="text-3xl font-bold mb-4">
									¥{plan.price.toLocaleString()}
									<span className="text-sm font-normal">
										/{plan.interval === "month" ? "月" : "年"}
									</span>
								</p>
								{plan.features && (
									<ul className="space-y-2 mb-6">
										{(plan.features as unknown as string[]).map(
											(feature: string, i: number) => (
												<li key={i} className="text-sm">
													✓ {feature}
												</li>
											),
										)}
									</ul>
								)}
								<button
									onClick={() => handleSubscribe(plan.stripe_price_id)}
									className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
									disabled={!barId}
								>
									Subscribe
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{invoices.length > 0 && (
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Invoice History</h2>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{invoices.map((invoice) => (
									<tr key={invoice.id}>
										<td className="px-6 py-4 whitespace-nowrap">
											{new Date(invoice.created_at).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											¥{invoice.amount_paid.toLocaleString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 py-1 text-xs rounded ${invoice.status === "paid" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
											>
												{invoice.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{invoice.invoice_pdf && (
												<a
													href={invoice.invoice_pdf}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
												>
													Download PDF
												</a>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
