"use client";

import type { BarProfileFields as BarProfileFieldsValue } from "@/lib/bar-form";
import {
	SHIZUOKA_MUNICIPALITIES,
	SHIZUOKA_PREFECTURE,
} from "@/lib/shizuoka-cities";

interface BarProfileFieldsProps {
	fields: BarProfileFieldsValue;
	onChange: (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => void;
}

/**
 * 店舗新規登録・編集フォームで共有する住所系・SNS 系の入力フィールド群。
 *
 * name / description は各フォームで placeholder 等の微差があり冒頭に単独配置されるため対象外とし、
 * access 以降の住所・座標・SNS 入力（両フォームで完全一致）だけを共通化する。
 */
export default function BarProfileFields({
	fields,
	onChange,
}: BarProfileFieldsProps) {
	return (
		<>
			<div>
				<label
					htmlFor="access"
					className="block text-sm font-medium text-gray-700"
				>
					アクセス
				</label>
				<input
					type="text"
					id="access"
					name="access"
					value={fields.access}
					onChange={onChange}
					placeholder="JR静岡駅北口から徒歩5分"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="phone_number"
					className="block text-sm font-medium text-gray-700"
				>
					電話番号
				</label>
				<input
					type="tel"
					id="phone_number"
					name="phone_number"
					value={fields.phone_number}
					onChange={onChange}
					placeholder="054-123-4567"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="prefecture"
					className="block text-sm font-medium text-gray-700"
				>
					都道府県
				</label>
				<select
					id="prefecture"
					name="prefecture"
					value={fields.prefecture}
					onChange={onChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				>
					<option value="">選択してください</option>
					<option value={SHIZUOKA_PREFECTURE}>{SHIZUOKA_PREFECTURE}</option>
				</select>
			</div>

			<div>
				<label
					htmlFor="city"
					className="block text-sm font-medium text-gray-700"
				>
					市区町村
				</label>
				<select
					id="city"
					name="city"
					value={fields.city}
					onChange={onChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				>
					<option value="">選択してください</option>
					{SHIZUOKA_MUNICIPALITIES.map((city) => (
						<option key={city} value={city}>
							{city}
						</option>
					))}
				</select>
			</div>

			<div>
				<label
					htmlFor="address_line1"
					className="block text-sm font-medium text-gray-700"
				>
					住所1
				</label>
				<input
					type="text"
					id="address_line1"
					name="address_line1"
					value={fields.address_line1}
					onChange={onChange}
					placeholder="番地等"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="address_line2"
					className="block text-sm font-medium text-gray-700"
				>
					住所2
				</label>
				<input
					type="text"
					id="address_line2"
					name="address_line2"
					value={fields.address_line2}
					onChange={onChange}
					placeholder="建物名・部屋番号"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="latitude"
					className="block text-sm font-medium text-gray-700"
				>
					緯度
				</label>
				<input
					type="number"
					step="any"
					id="latitude"
					name="latitude"
					value={fields.latitude}
					onChange={onChange}
					placeholder="35.0116"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					-90〜90（マップ表示用・任意）
				</p>
			</div>

			<div>
				<label
					htmlFor="longitude"
					className="block text-sm font-medium text-gray-700"
				>
					経度
				</label>
				<input
					type="number"
					step="any"
					id="longitude"
					name="longitude"
					value={fields.longitude}
					onChange={onChange}
					placeholder="135.7681"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					-180〜180（マップ表示用・任意）
				</p>
			</div>

			<div>
				<label
					htmlFor="website_url"
					className="block text-sm font-medium text-gray-700"
				>
					ホームページ
				</label>
				<input
					type="url"
					id="website_url"
					name="website_url"
					value={fields.website_url}
					onChange={onChange}
					placeholder="https://example.com"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="instagram_url"
					className="block text-sm font-medium text-gray-700"
				>
					Instagram
				</label>
				<input
					type="url"
					id="instagram_url"
					name="instagram_url"
					value={fields.instagram_url}
					onChange={onChange}
					placeholder="https://www.instagram.com/your_account"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="x_url"
					className="block text-sm font-medium text-gray-700"
				>
					X（Twitter）
				</label>
				<input
					type="url"
					id="x_url"
					name="x_url"
					value={fields.x_url}
					onChange={onChange}
					placeholder="https://x.com/example"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="facebook_url"
					className="block text-sm font-medium text-gray-700"
				>
					Facebook
				</label>
				<input
					type="url"
					id="facebook_url"
					name="facebook_url"
					value={fields.facebook_url}
					onChange={onChange}
					placeholder="https://www.facebook.com/yourpage"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="line_url"
					className="block text-sm font-medium text-gray-700"
				>
					LINE
				</label>
				<input
					type="url"
					id="line_url"
					name="line_url"
					value={fields.line_url}
					onChange={onChange}
					placeholder="https://line.me/R/ti/p/@example"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
				/>
			</div>
		</>
	);
}
