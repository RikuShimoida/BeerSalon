import MasterDataForm from "@/components/MasterDataForm";

export default async function EditEventCategoryPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Edit Event Category</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<MasterDataForm
					endpoint="/api/admin/master/event-categories"
					itemId={id}
					dataKey="category"
					listPath="/admin/master/event-categories"
					fields={[
						{ name: "name", label: "Name", type: "text", required: true },
						{ name: "description", label: "Description", type: "textarea" },
					]}
				/>
			</div>
		</div>
	);
}
