import React from "react";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	fullWidth?: boolean;
}

export default function Input({
	label,
	error,
	helperText,
	fullWidth = false,
	className = "",
	id,
	...props
}: InputProps) {
	const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
	const widthStyles = fullWidth ? "w-full" : "";

	return (
		<div className={`${widthStyles}`}>
			{label && (
				<label
					htmlFor={inputId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					{label}
					{props.required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}
			<input
				id={inputId}
				className={`
          block rounded-md shadow-sm
          border-gray-300 focus:border-blue-500 focus:ring-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
				{...props}
			/>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
			{helperText && !error && (
				<p className="mt-1 text-sm text-gray-500">{helperText}</p>
			)}
		</div>
	);
}
