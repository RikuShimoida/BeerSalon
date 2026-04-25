import MasterDataForm from "@/components/MasterDataForm";

export default async function EditBreweryPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Edit Brewery</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<MasterDataForm
					endpoint="/api/admin/master/breweries"
					itemId={id}
					dataKey="brewery"
					listPath="/admin/master/breweries"
					fields={[
						{ name: "name", label: "Name", type: "text", required: true },
						{ name: "country", label: "Country", type: "text" },
						{ name: "description", label: "Description", type: "textarea" },
					]}
				/>
			</div>
		</div>
	);
}
