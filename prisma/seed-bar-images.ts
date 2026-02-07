import { prisma } from "../src/lib/prisma";

async function main() {
	console.log("Start seeding bar images...");

	const bars = await prisma.bar.findMany({
		take: 3,
		orderBy: { id: "asc" },
	});

	if (bars.length === 0) {
		console.log("No bars found. Please run seed-test-bars first.");
		return;
	}

	const unsplashImages = [
		"https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800",
		"https://images.unsplash.com/photo-1532634993-15f421e42ec0?w=800",
		"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800",
		"https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800",
		"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800",
	];

	const pexelsVideos = [
		"https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4",
		"https://videos.pexels.com/video-files/5803361/5803361-uhd_2560_1440_25fps.mp4",
	];

	for (const bar of bars) {
		console.log(`Adding images for bar: ${bar.name} (ID: ${bar.id})`);

		for (let i = 0; i < 3; i++) {
			const isVideo = i === 2;
			await prisma.barImage.create({
				data: {
					barId: bar.id,
					mediaType: isVideo ? "video" : "image",
					imageType: i === 0 ? "exterior" : i === 1 ? "interior" : "beer",
					imageUrl: isVideo
						? pexelsVideos[Number(bar.id) % pexelsVideos.length]
						: unsplashImages[(i + Number(bar.id)) % unsplashImages.length],
					sortOrder: i,
				},
			});
		}

		console.log(`  Added 3 media items (2 images, 1 video)`);
	}

	console.log("Seeding completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
