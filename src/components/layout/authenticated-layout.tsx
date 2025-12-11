import { Header } from "./header";
import { Footer } from "./footer";

export function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="pt-16 pb-16">{children}</main>
			<Footer />
		</div>
	);
}
