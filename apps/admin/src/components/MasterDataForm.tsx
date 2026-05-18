"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MasterDataFormProps {
	endpoint: string;
	itemId?: string;
	dataKey: string;
	listPath: string;
	fields: {
		name: string;
		label: string;
		type: "text" | "textarea" | "checkbox";
		required?: boolean;
	}[];
}

export default function MasterDataForm({
	endpoint,
	itemId,
	dataKey,
	listPath,
	fields,
}: MasterDataFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState<Record<string, string | boolean>>({
		is_active: true,
	});

	useEffect(() => {
		if (itemId) fetchItem();
	}, [itemId]);

	const fetchItem = async () => {
		const res = await fetch(`${endpoint}/${itemId}`);
		const data = await res.json();
		const item = data[dataKey];
		const newFormData: Record<string, string | boolean> = {
			is_active: item.is_active,
		};
		fields.forEach((field) => {
			if (field.type === "checkbox") {
				newFormData[field.name] = item[field.name] || false;
			} else {
				newFormData[field.name] = item[field.name] || "";
			}
		});
		setFormData(newFormData);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		const url = itemId ? `${endpoint}/${itemId}` : endpoint;
		await fetch(url, {
			method: itemId ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(formData),
		});
		router.push(listPath);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value, type } = e.target;
		const val =
			type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
		setFormData((prev) => ({ ...prev, [name]: val }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{fields.map((field) => (
				<div key={field.name}>
					<label htmlFor={field.name} className="block text-sm font-medium">
						{field.label} {field.required && "*"}
					</label>
					{field.type === "textarea" ? (
						<textarea
							id={field.name}
							name={field.name}
							required={field.required}
							value={formData[field.name] as string}
							onChange={handleChange}
							rows={4}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
						/>
					) : field.type === "checkbox" ? (
						<input
							type="checkbox"
							id={field.name}
							name={field.name}
							checked={formData[field.name] as boolean}
							onChange={handleChange}
							className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
					) : (
						<input
							type="text"
							id={field.name}
							name={field.name}
							required={field.required}
							value={formData[field.name] as string}
							onChange={handleChange}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
						/>
					)}
				</div>
			))}
			<div className="flex items-center">
				<input
					type="checkbox"
					id="is_active"
					name="is_active"
					checked={formData.is_active as boolean}
					onChange={handleChange}
					className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label htmlFor="is_active" className="ml-2 text-sm">
					有効
				</label>
			</div>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={loading}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "保存中..." : itemId ? "更新" : "作成"}
				</button>
			</div>
		</form>
	);
}
