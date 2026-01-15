import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("Missing Supabase environment variables");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadFile(filePath: string, storagePath: string) {
	try {
		const fileBuffer = readFileSync(filePath);
		const { error } = await supabase.storage
			.from("content-images")
			.upload(storagePath, fileBuffer, {
				contentType: "image/svg+xml",
				upsert: true,
			});

		if (error) {
			console.error(`Error uploading ${storagePath}:`, error.message);
			return false;
		}

		console.log(`✅ Uploaded: ${storagePath}`);
		return true;
	} catch (err) {
		console.error(`Failed to upload ${filePath}:`, err);
		return false;
	}
}

async function uploadDirectory(localDir: string, storagePrefix: string) {
	const items = readdirSync(localDir);

	for (const item of items) {
		const localPath = join(localDir, item);
		const stat = statSync(localPath);

		if (stat.isDirectory()) {
			await uploadDirectory(localPath, `${storagePrefix}/${item}`);
		} else if (item.endsWith(".svg")) {
			const storagePath = `${storagePrefix}/${item}`;
			await uploadFile(localPath, storagePath);
		}
	}
}

async function main() {
	console.log("Starting upload of content images to Supabase Storage...\n");

	const tempImagesDir = join(process.cwd(), "public", "temp-images");

	// Upload learn-about-craft-beer.svg
	await uploadFile(
		join(tempImagesDir, "learn-about-craft-beer.svg"),
		"learn-about-craft-beer.svg",
	);

	// Upload popular-bars
	await uploadDirectory(join(tempImagesDir, "popular-bars"), "popular-bars");

	// Upload popular-cities
	await uploadDirectory(
		join(tempImagesDir, "popular-cities"),
		"popular-cities",
	);

	// Upload popular-categories
	await uploadDirectory(
		join(tempImagesDir, "popular-categories"),
		"popular-categories",
	);

	// Upload popular-regions
	await uploadDirectory(
		join(tempImagesDir, "popular-regions"),
		"popular-regions",
	);

	console.log("\n✅ All content images uploaded successfully!");
}

main().catch(console.error);
