import { Hono } from "hono";
import { cors } from 'hono/cors'; // istersen CORS middleware de ekleyebilirsin
import postgres from "postgres";
// import booksRouter from "./routes/books";
import videosRouter from "./routes/videos.js";
import videoProxy from './routes/videoProxy.js';
// import bookRelatedRouter from "./routes/book-related";
// import { mockBooks } from "./lib/mockData";

const app = new Hono();
// Global CORS (isteğe bağlı)
app.use('/*', cors());
// Middleware: SQL bağlantısı veya mock veri
app.use("*", async (c, next) => {
	try {

		// PostgreSQL bağlantısı
		const sql = postgres(
			c.env.HYPERDRIVE.connectionString,
			{
				max: 3,
				ssl: "require",
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

// Statik dosyalar (frontend)
app.all("*", async (c) => {
	if (c.env.ASSETS) {
		return c.env.ASSETS.fetch(c.req.raw);
	}
	return new Response("Not Found", { status: 404 });
});

export default {
	fetch: app.fetch,
};
