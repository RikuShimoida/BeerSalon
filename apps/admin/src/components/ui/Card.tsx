import React from "react";

export interface CardProps {
	children: React.ReactNode;
	title?: string;
	subtitle?: string;
	footer?: React.ReactNode;
	className?: string;
	noPadding?: boolean;
}

export default function Card({
	children,
	title,
	subtitle,
	footer,
	className = "",
	noPadding = false,
}: CardProps) {
	return (
		<div className={`bg-white rounded-lg shadow ${className}`}>
			{(title || subtitle) && (
				<div className="px-6 py-4 border-b border-gray-200">
					{title && (
						<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
					)}
					{subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
				</div>
			)}
			<div className={noPadding ? "" : "px-6 py-4"}>{children}</div>
			{footer && (
				<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
					{footer}
				</div>
			)}
		</div>
	);
}
