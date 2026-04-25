import MasterDataForm from "@/components/MasterDataForm";

export default function NewEventCategoryPage() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Add Event Category</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<MasterDataForm
					endpoint="/api/admin/master/event-categories"
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
