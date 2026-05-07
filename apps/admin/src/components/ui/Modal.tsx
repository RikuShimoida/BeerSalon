"use client";

import type React from "react";
import { useEffect } from "react";

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
	showCloseButton?: boolean;
}

export default function Modal({
	isOpen,
	onClose,
	title,
	children,
	size = "md",
	showCloseButton = true,
}: ModalProps) {
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const sizeStyles = {
		sm: "max-w-md",
		md: "max-w-lg",
		lg: "max-w-2xl",
		xl: "max-w-4xl",
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>
			<div
				className={`relative bg-white rounded-lg shadow-xl ${sizeStyles[size]} w-full mx-4 max-h-[90vh] flex flex-col`}
			>
				{(title || showCloseButton) && (
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
						{title && (
							<h2 className="text-xl font-semibold text-gray-900">{title}</h2>
						)}
						{showCloseButton && (
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600 transition-colors"
								aria-label="Close modal"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						)}
					</div>
				)}
				<div className="px-6 py-4 overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
