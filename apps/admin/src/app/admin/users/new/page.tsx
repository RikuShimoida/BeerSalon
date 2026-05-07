"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewUserPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		name: "",
		role: "bar_owner" as "bar_owner" | "admin",
		is_active: true,
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		try {
			await fetch("/api/admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			router.push("/admin/users");
		} catch (_error) {
			alert("Failed to create user");
			setLoading(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target;
		const val =
			type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
		setFormData((prev) => ({ ...prev, [name]: val }));
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Add Admin User</h1>
			<div className="bg-white rounded-lg shadow p-6 max-w-2xl">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-sm font-medium">Name *</label>
						<input
							type="text"
							name="name"
							required
							value={formData.name}
							onChange={handleChange}
							className="mt-1 block w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium">Email *</label>
						<input
							type="email"
							name="email"
							required
							value={formData.email}
							onChange={handleChange}
							className="mt-1 block w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium">Password *</label>
						<input
							type="password"
							name="password"
							required
							value={formData.password}
							onChange={handleChange}
							className="mt-1 block w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium">Role *</label>
						<select
							name="role"
							value={formData.role}
							onChange={handleChange}
							className="mt-1 block w-full px-3 py-2 border rounded"
						>
							<option value="bar_owner">Bar Owner</option>
							<option value="admin">Admin</option>
						</select>
					</div>
					<div className="flex items-center">
						<input
							type="checkbox"
							name="is_active"
							checked={formData.is_active}
							onChange={handleChange}
							className="h-4 w-4"
						/>
						<label className="ml-2 text-sm">Active</label>
					</div>
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => router.back()}
							className="px-4 py-2 border rounded"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 bg-blue-600 text-white rounded"
						>
							{loading ? "Creating..." : "Create User"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
