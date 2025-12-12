import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function BarDetailPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const { barId } = await params;

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white p-8 rounded-lg shadow-md">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						店舗詳細ページ
					</h1>
					<p className="text-gray-600 mb-2">店舗ID: {barId}</p>
					<p className="text-gray-500">
						このページは後で実装されます。
						<br />
						店舗の詳細情報、メニュー、クーポン、投稿などを表示する予定です。
					</p>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
