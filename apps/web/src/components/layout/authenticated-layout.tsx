import { Footer } from "./footer";
import { Header } from "./header";

export function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="pt-16 pb-16">{children}</main>
			<Footer />
		</div>
	);
}
