import MasterDataForm from "@/components/MasterDataForm";

export default function NewBreweryPage() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Add Brewery</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<MasterDataForm
					endpoint="/api/admin/master/breweries"
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
