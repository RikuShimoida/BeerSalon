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
			alert("先にバーを選択してください");
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

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/3"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					<div className="h-48 bg-gray-200 rounded"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					課金情報・サブスクリプション
				</h1>
				<p className="text-sm text-gray-600">
					サブスクリプションと請求情報を管理します
				</p>
			</div>

			{subscription ? (
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">
						現在のプラン
					</h2>
					<div className="space-y-3">
						<div className="flex items-center">
							<span className="text-sm font-medium text-gray-500 w-32">
								プラン:
							</span>
							<span className="text-sm text-gray-900">
								{subscription.subscription_plans.name}
							</span>
						</div>
						<div className="flex items-center">
							<span className="text-sm font-medium text-gray-500 w-32">
								料金:
							</span>
							<span className="text-sm text-gray-900">
								¥{subscription.subscription_plans.price.toLocaleString()}/
								{subscription.subscription_plans.interval === "month"
									? "月"
									: "年"}
							</span>
						</div>
						<div className="flex items-center">
							<span className="text-sm font-medium text-gray-500 w-32">
								ステータス:
							</span>
							<span
								className={`px-2 py-1 text-xs rounded ${subscription.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
							>
								{subscription.status}
							</span>
						</div>
						<div className="flex items-center">
							<span className="text-sm font-medium text-gray-500 w-32">
								現在の課金期間:
							</span>
							<span className="text-sm text-gray-900">
								{new Date(
									subscription.current_period_start,
								).toLocaleDateString()}{" "}
								-{" "}
								{new Date(subscription.current_period_end).toLocaleDateString()}
							</span>
						</div>
						{subscription.subscription_plans.features && (
							<div>
								<span className="text-sm font-medium text-gray-500">
									含まれる機能:
								</span>
								<ul className="list-disc list-inside mt-2">
									{(
										subscription.subscription_plans
											.features as unknown as string[]
									).map((feature: string, i: number) => (
										<li key={i} className="text-sm text-gray-700">
											{feature}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			) : (
				<div>
					<h2 className="text-xl font-semibold text-gray-900 mb-4">
						利用可能なプラン
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{plans.map((plan) => (
							<div key={plan.id} className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{plan.name}
								</h3>
								<p className="text-3xl font-bold text-gray-900 mb-4">
									¥{plan.price.toLocaleString()}
									<span className="text-sm font-normal text-gray-500">
										/{plan.interval === "month" ? "月" : "年"}
									</span>
								</p>
								{plan.features && (
									<ul className="space-y-2 mb-6">
										{(plan.features as unknown as string[]).map(
											(feature: string, i: number) => (
												<li key={i} className="text-sm text-gray-700">
													✓ {feature}
												</li>
											),
										)}
									</ul>
								)}
								<button
									onClick={() => handleSubscribe(plan.stripe_price_id)}
									className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={!barId}
								>
									このプランに申し込む
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{invoices.length > 0 && (
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">請求履歴</h2>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
										日付
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
										金額
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
										ステータス
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
										操作
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{invoices.map((invoice) => (
									<tr key={invoice.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{new Date(invoice.created_at).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
													className="text-blue-600 hover:underline text-sm"
												>
													PDFダウンロード
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
