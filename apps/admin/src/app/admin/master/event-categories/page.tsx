"use client";

import MasterDataList from "@/components/MasterDataList";

export default function EventCategoriesPage() {
	return (
		<MasterDataList
			title="Event Categories"
			endpoint="/api/admin/master/event-categories"
			newItemPath="/admin/master/event-categories/new"
			editItemPath={(id) => `/admin/master/event-categories/${id}/edit`}
			dataKey="categories"
		/>
	);
}
