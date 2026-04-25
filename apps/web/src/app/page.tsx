import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { HomeClient } from "./page-client";

export default function Home() {
	return (
		<AuthenticatedLayout>
			<HomeClient />
		</AuthenticatedLayout>
	);
}
