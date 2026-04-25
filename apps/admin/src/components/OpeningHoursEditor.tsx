"use client";

import { useState } from "react";

interface OpeningHourInput {
	day_of_week: number;
	open_time: string;
	close_time: string;
	sort_order: number;
	is_closed: boolean;
}

interface OpeningHoursEditorProps {
	value: OpeningHourInput[];
	onChange: (hours: OpeningHourInput[]) => void;
	errors?: { [key: string]: string };
}

const DAY_NAMES = [
	"月曜日",
	"火曜日",
	"水曜日",
	"木曜日",
	"金曜日",
	"土曜日",
	"日曜日",
];

export default function OpeningHoursEditor({
	value,
	onChange,
	errors = {},
}: OpeningHoursEditorProps) {
	const getDayHours = (day: number): OpeningHourInput[] => {
		return value
			.filter((h) => h.day_of_week === day)
			.sort((a, b) => a.sort_order - b.sort_order);
	};

	const isDayClosed = (day: number): boolean => {
		const dayHours = getDayHours(day);
		return dayHours.length > 0 && dayHours[0].is_closed;
	};

	const toggleClosed = (day: number) => {
		const dayHours = getDayHours(day);
		const isClosed = isDayClosed(day);

		const newHours = value.map((h) => {
			if (h.day_of_week === day) {
				return { ...h, is_closed: !isClosed };
			}
			return h;
		});

		onChange(newHours);
	};

	const addTimeSlot = (day: number) => {
		const dayHours = getDayHours(day);
		const nextSortOrder = dayHours.length;

		const newHours = [
			...value,
			{
				day_of_week: day,
				open_time: "",
				close_time: "",
				sort_order: nextSortOrder,
				is_closed: false,
			},
		];
		onChange(newHours);
	};

	const removeTimeSlot = (day: number, sortOrder: number) => {
		const newHours = value.filter(
			(h) => !(h.day_of_week === day && h.sort_order === sortOrder),
		);

		const reorderedHours = newHours.map((h) => {
			if (h.day_of_week === day && h.sort_order > sortOrder) {
				return { ...h, sort_order: h.sort_order - 1 };
			}
			return h;
		});

		onChange(reorderedHours);
	};

	const updateTimeSlot = (
		day: number,
		sortOrder: number,
		field: "open_time" | "close_time",
		newValue: string,
	) => {
		const newHours = value.map((h) => {
			if (h.day_of_week === day && h.sort_order === sortOrder) {
				return { ...h, [field]: newValue };
			}
			return h;
		});
		onChange(newHours);
	};

	return (
		<div className="space-y-4">
			<label className="block text-sm font-medium text-gray-700">
				営業時間
			</label>

			{DAY_NAMES.map((dayName, day) => {
				const dayHours = getDayHours(day);
				const isClosed = isDayClosed(day);

				return (
					<div key={day} className="border border-gray-300 rounded-md">
						<div className="px-4 py-3 bg-gray-50">
							<h4 className="text-sm font-medium text-gray-900">{dayName}</h4>
						</div>

						<div className="px-4 py-3 space-y-3">
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={isClosed}
									onChange={() => toggleClosed(day)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<span className="ml-2 text-sm text-gray-700">定休日</span>
							</label>

							{!isClosed && (
								<div className="space-y-2">
									{dayHours.map((hour) => {
										const errorKey = `${day}_${hour.sort_order}`;
										const hasError = errors[errorKey];

										return (
											<div key={hour.sort_order}>
												<div className="flex items-center gap-2">
													<input
														type="time"
														value={hour.open_time}
														onChange={(e) =>
															updateTimeSlot(
																day,
																hour.sort_order,
																"open_time",
																e.target.value,
															)
														}
														className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
															hasError ? "border-red-500" : "border-gray-300"
														}`}
													/>
													<span className="text-sm text-gray-700">〜</span>
													<input
														type="time"
														value={hour.close_time}
														onChange={(e) =>
															updateTimeSlot(
																day,
																hour.sort_order,
																"close_time",
																e.target.value,
															)
														}
														className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
															hasError ? "border-red-500" : "border-gray-300"
														}`}
													/>
													<button
														type="button"
														onClick={() => removeTimeSlot(day, hour.sort_order)}
														className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
													>
														削除
													</button>
												</div>
												{hasError && (
													<p className="mt-1 text-sm text-red-600">
														{errors[errorKey]}
													</p>
												)}
											</div>
										);
									})}

									<button
										type="button"
										onClick={() => addTimeSlot(day)}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										+ 時間帯を追加
									</button>
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
