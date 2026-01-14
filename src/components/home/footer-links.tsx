import Link from "next/link";

export function FooterLinks() {
	return (
		<footer className="w-full border-t border-gray-200 pt-8">
			<div className="flex flex-wrap gap-4 md:gap-6 justify-center text-sm text-gray-600">
				<Link href="/terms" className="hover:text-amber-600 transition-colors">
					利用規約
				</Link>
				<Link
					href="/privacy"
					className="hover:text-amber-600 transition-colors"
				>
					プライバシーポリシー
				</Link>
				<Link
					href="/contact"
					className="hover:text-amber-600 transition-colors"
				>
					お問い合わせ
				</Link>
			</div>
			<p className="text-center text-xs text-gray-500 mt-4">
				© 2026 Beer Salon. All rights reserved.
			</p>
		</footer>
	);
}
