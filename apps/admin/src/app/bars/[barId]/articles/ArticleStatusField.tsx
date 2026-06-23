"use client";

import { ARTICLE_STATUS_LABELS } from "@/lib/article-status";
import { ARTICLE_STATUSES, type ArticleStatus } from "@/lib/validators";

interface ArticleStatusFieldProps {
	status: ArticleStatus;
	onStatusChange: (status: ArticleStatus) => void;
	publishedAt: string;
	onPublishedAtChange: (value: string) => void;
}

export default function ArticleStatusField({
	status,
	onStatusChange,
	publishedAt,
	onPublishedAtChange,
}: ArticleStatusFieldProps) {
	return (
		<div className="space-y-3">
			<fieldset>
				<legend className="block text-sm font-medium text-gray-700">
					公開ステータス
				</legend>
				<div className="mt-2 flex flex-wrap gap-4">
					{ARTICLE_STATUSES.map((value) => (
						<label
							key={value}
							className="inline-flex items-center gap-2 text-sm text-gray-700"
						>
							<input
								type="radio"
								name="article-status"
								value={value}
								checked={status === value}
								onChange={() => onStatusChange(value)}
								className="text-black focus:ring-black"
							/>
							{ARTICLE_STATUS_LABELS[value]}
						</label>
					))}
				</div>
			</fieldset>

			{status === "scheduled" && (
				<div>
					<label
						htmlFor="article-published-at"
						className="block text-sm font-medium text-gray-700"
					>
						公開日時 <span className="text-red-500">*</span>
					</label>
					<input
						type="datetime-local"
						id="article-published-at"
						value={publishedAt}
						onChange={(e) => onPublishedAtChange(e.target.value)}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
					/>
				</div>
			)}
		</div>
	);
}
