import type React from "react";

export interface SelectOption {
	value: string | number;
	label: string;
}

export interface SelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
	fullWidth?: boolean;
	options: SelectOption[];
	placeholder?: string;
}

export default function Select({
	label,
	error,
	helperText,
	fullWidth = false,
	options,
	placeholder,
	className = "",
	id,
	...props
}: SelectProps) {
	const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
	const widthStyles = fullWidth ? "w-full" : "";

	return (
		<div className={`${widthStyles}`}>
			{label && (
				<label
					htmlFor={selectId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					{label}
					{props.required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}
			<select
				id={selectId}
				className={`
          block rounded-md shadow-sm
          border-gray-300 focus:border-blue-500 focus:ring-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
				{...props}
			>
				{placeholder && <option value="">{placeholder}</option>}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
			{helperText && !error && (
				<p className="mt-1 text-sm text-gray-500">{helperText}</p>
			)}
		</div>
	);
}
