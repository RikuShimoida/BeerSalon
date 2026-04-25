"use client";

import MasterDataList from "@/components/MasterDataList";

export default function FoodCategoriesPage() {
	return (
		<MasterDataList
			title="Food Categories"
			endpoint="/api/admin/master/food-categories"
			newItemPath="/admin/master/food-categories/new"
			editItemPath={(id) => `/admin/master/food-categories/${id}/edit`}
			dataKey="categories"
		/>
	);
}
