"use client";

import MasterDataList from "@/components/MasterDataList";

export default function BeerStylesPage() {
	return (
		<MasterDataList
			title="Beer Styles"
			endpoint="/api/admin/master/beer-styles"
			newItemPath="/admin/master/beer-styles/new"
			editItemPath={(id) => `/admin/master/beer-styles/${id}/edit`}
			dataKey="styles"
		/>
	);
}
