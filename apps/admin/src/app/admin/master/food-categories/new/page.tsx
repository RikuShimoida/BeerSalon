import MasterDataForm from "@/components/MasterDataForm";

export default function NewFoodCategoryPage() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Add Food Category</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<MasterDataForm
					endpoint="/api/admin/master/food-categories"
					dataKey="category"
					listPath="/admin/master/food-categories"
					fields={[
						{ name: "name", label: "Name", type: "text", required: true },
						{ name: "description", label: "Description", type: "textarea" },
					]}
				/>
			</div>
		</div>
	);
}
