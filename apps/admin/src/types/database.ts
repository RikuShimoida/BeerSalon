export interface AdminUser {
	id: string;
	bar_manage_id: string;
	password_hash: string;
	name: string;
	role: "bar_owner" | "admin";
	bar_id: number | null;
	contact_email: string | null;
	contact_phone: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Session {
	user: {
		id: string;
		barManageId: string;
		name: string;
		role: "bar_owner" | "admin";
		barId: number | null;
	};
	expires: string;
}

export interface BarOpeningHour {
	id: number;
	bar_id: number;
	day_of_week: number;
	open_time: string;
	close_time: string;
	sort_order: number;
	is_closed: boolean;
	created_at: string;
	updated_at: string;
}

export interface Bar {
	id: number;
	name: string;
	prefecture: string | null;
	city: string | null;
	address_line1: string | null;
	address_line2: string | null;
	phone_number: string | null;
	access: string | null;
	website_url: string | null;
	instagram_url: string | null;
	x_url: string | null;
	facebook_url: string | null;
	description: string | null;
	preview_image_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	payment_method_ids?: string[];
	opening_hours?: BarOpeningHour[];
}

export interface BeerCategory {
	id: number;
	name: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Country {
	id: number;
	name: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Region {
	id: number;
	name: string;
	country_id: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Brewery {
	id: number;
	name: string;
	country_id: number;
	region_id: number | null;
	website_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Beer {
	id: number;
	name: string;
	beer_category_id: number;
	brewery_id: number | null;
	region_id: number | null;
	abv: number | null;
	ibu: number | null;
	description: string | null;
	image_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface BarBeerMenu {
	id: number;
	bar_id: number;
	beer_id: number;
	price: number | null;
	size: string | null;
	description: string | null;
	image_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// ビールメニュー詳細表示用（JOIN結果）
export interface BarBeerMenuDetail extends BarBeerMenu {
	beer: Beer & {
		category: BeerCategory;
		brewery: Brewery | null;
		region: Region | null;
	};
}

export interface BarFoodMenu {
	id: number;
	bar_id: number;
	name: string;
	price: number | null;
	description: string | null;
	image_url: string | null;
	category: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface BarEvent {
	id: number;
	bar_id: number;
	title: string;
	description: string | null;
	start_date: string;
	end_date: string | null;
	image_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface BarCoupon {
	id: number;
	bar_id: number;
	title: string;
	description: string | null;
	discount_type: "percentage" | "fixed_amount";
	discount_value: number;
	code: string | null;
	usage_limit: number | null;
	used_count: number;
	valid_from: string | null;
	valid_until: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MasterBeerStyle {
	id: number;
	name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MasterBrewery {
	id: number;
	name: string;
	country: string | null;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MasterFoodCategory {
	id: number;
	name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MasterEventCategory {
	id: number;
	name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface SubscriptionPlan {
	id: number;
	name: string;
	stripe_price_id: string;
	price: number;
	currency: string;
	interval: "month" | "year";
	features: string[] | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface BarSubscription {
	id: number;
	bar_id: number;
	subscription_plan_id: number;
	stripe_customer_id: string;
	stripe_subscription_id: string;
	status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
	current_period_start: string;
	current_period_end: string;
	cancel_at_period_end: boolean;
	canceled_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface Invoice {
	id: number;
	bar_id: number;
	bar_subscription_id: number | null;
	stripe_invoice_id: string;
	amount_paid: number;
	amount_due: number;
	currency: string;
	status: "paid" | "open" | "void" | "uncollectible";
	invoice_pdf: string | null;
	paid_at: string | null;
	created_at: string;
}
