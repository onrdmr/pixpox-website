import { Hono } from "hono";
import { cors } from 'hono/cors'; // istersen CORS middleware de ekleyebilirsin
import postgres from "postgres";
// import booksRouter from "./routes/books";
import videosRouter from "./routes/videos.js";
import mangaRouter from "./routes/manga.js";
import videoProxy from './routes/videoProxy.js';
// import bookRelatedRouter from "./routes/book-related";
// import { mockBooks } from "./lib/mockData";

const app = new Hono();

// SQL bağlantısını kuran yardımcı fonksiyon
const getSQL = (connectionString) => {
    return postgres(connectionString, {
        max: 3,
        //ssl: "require",
    });
};

// Global CORS (isteğe bağlı)
app.use('/*', cors());
// Middleware: SQL bağlantısı veya mock veri
app.use("*", async (c, next) => {
	try {

		// PostgreSQL bağlantısı
		const sql = postgres(
			c.env.HYPERDRIVE.connectionString,
			{
				max: 3//,
				//ssl: "require",
			}
		);
		

		c.env.SQL = sql;
		c.env.DB_AVAILABLE = true;

		await next();

		// Miniflare ortamında `c.executionCtx` olmayabilir, o yüzden kontrol ekledik
		if (c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
			c.executionCtx.waitUntil(sql.end());
		} else {
			await sql.end();
		}
	} catch (err) {
		console.error("⚠️ Database connection error:", err);
		c.env.DB_AVAILABLE = false;
		c.env.MOCK_DATA = mockBooks;
		await next();
	}
});

// Rotalar
// app.route("/api/books", booksRouter);
app.route("/api/videos", videosRouter);
// app.route("/api/books/:id/related", bookRelatedRouter);
app.route('/api/video-proxy', videoProxy);
app.route('/api/manga', mangaRouter);

// Statik dosyalar (frontend)
app.all("*", async (c) => {
	if (c.env.ASSETS) {
		return c.env.ASSETS.fetch(c.req.raw);
	}
	return new Response("Not Found", { status: 404 });
});


export default {
	fetch: app.fetch,
	// 🔹 Yeni eklenecek CRON handler'ı
  async scheduled(event, env, ctx) {
        // ⚠️ ÖNEMLİ: Middleware çalışmadığı için SQL'i burada manuel başlatıyoruz
        const sql = getSQL(c.env.HYPERDRIVE.connectionString);
        
        for (let i = 0; i < 6; i++) {
            try {
                await sql`
                    INSERT INTO public."VideoSeed" (id, video_id, updated_at)
                    SELECT 
                        '00000000-0000-0000-0000-000000000001'::uuid, 
                        v.id, 
                        NOW()
                    FROM public."Video" v
                    INNER JOIN "Beatmap" b ON v.id = b.id
                    WHERE v.is_active = true AND v.is_deleted = false
                    ORDER BY RANDOM()
                    LIMIT 1
                    ON CONFLICT (id) DO UPDATE SET 
                        video_id = EXCLUDED.video_id, 
                        updated_at = EXCLUDED.updated_at;
                `;
                console.log(`Video güncellendi (Tur: ${i + 1})`);
            } catch (err) {
                console.error("Cron hatası:", err);
                break; // Hata varsa döngüyü kır ki boşuna beklemesin
            }

            if (i < 5) await new Promise(r => setTimeout(r, 10000));
        }
        
        // Bağlantıyı kapatmayı unutma
        ctx.waitUntil(sql.end());
    }
};
