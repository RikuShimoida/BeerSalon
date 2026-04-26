"use client";

import MasterDataList from "@/components/MasterDataList";

export default function BreweriesPage() {
	return (
		<MasterDataList
			title="Breweries"
			endpoint="/api/admin/master/breweries"
			newItemPath="/admin/master/breweries/new"
			editItemPath={(id) => `/admin/master/breweries/${id}/edit`}
			dataKey="breweries"
		/>
	);
}
