import { redirect } from "next/navigation";

export default async function BeerMenusPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const { barId } = await params;
	redirect(`/bars/${barId}/menus`);
}
