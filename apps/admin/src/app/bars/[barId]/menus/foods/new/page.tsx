import { redirect } from "next/navigation";

export default async function NewFoodMenuPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const { barId } = await params;
	redirect(`/bars/${barId}/menus/new`);
}
