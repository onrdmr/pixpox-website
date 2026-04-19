import { Hono } from "hono";
import { getNeon } from "../lib/db.js";

const stream = new Hono();

stream.get("/status", async (c) => {
  try {
    const sql = getNeon(c.env.DATABASE_URL);
    const status = await sql`SELECT * FROM stream_status WHERE id = 1`;
    if (status.length === 0) {
      return c.json({
        success: true,
        data: { is_live: false, viewer_count: 0, stream_title: null, game_name: null, started_at: null },
      });
    }
    return c.json({ success: true, data: status[0] });
  } catch (error) {
    console.error("Error fetching stream status:", error);
    return c.json({ success: false, error: "Failed to fetch stream status" }, 500);
  }
});

stream.post("/status", async (c) => {
  try {
    const body = await c.req.json();
    const { is_live, viewer_count, stream_title, game_name } = body;

    const apiKey = c.req.header("x-api-key");
    if (c.env.STREAM_API_KEY && apiKey !== c.env.STREAM_API_KEY) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const sql = getNeon(c.env.DATABASE_URL);

    if (is_live) {
      await sql`
        UPDATE stream_status
        SET is_live = true,
            viewer_count = ${viewer_count || 0},
            stream_title = ${stream_title || null},
            game_name = ${game_name || null},
            started_at = COALESCE(started_at, NOW()),
            updated_at = NOW()
        WHERE id = 1
      `;
      await sql`
        INSERT INTO stream_history (started_at, stream_title, game_name)
        VALUES (NOW(), ${stream_title || null}, ${game_name || null})
        ON CONFLICT DO NOTHING
      `;
    } else {
      const currentStream = await sql`
        SELECT started_at, stream_title, game_name, peak_viewers
        FROM stream_status WHERE id = 1 AND is_live = true
      `;
      if (currentStream.length > 0 && currentStream[0].started_at) {
        await sql`
          UPDATE stream_history
          SET ended_at = NOW(),
              peak_viewers = ${currentStream[0].peak_viewers || viewer_count || 0}
          WHERE started_at = ${currentStream[0].started_at}
        `;
      }
      await sql`
        UPDATE stream_status
        SET is_live = false, viewer_count = 0, started_at = NULL, updated_at = NOW()
        WHERE id = 1
      `;
    }

    return c.json({ success: true, message: is_live ? "Stream is now live" : "Stream is now offline" });
  } catch (error) {
    console.error("Error updating stream status:", error);
    return c.json({ success: false, error: "Failed to update stream status" }, 500);
  }
});

stream.patch("/status", async (c) => {
  try {
    const { viewer_count } = await c.req.json();
    const sql = getNeon(c.env.DATABASE_URL);
    await sql`
      UPDATE stream_status
      SET viewer_count = ${viewer_count || 0},
          peak_viewers = GREATEST(COALESCE(peak_viewers, 0), ${viewer_count || 0}),
          updated_at = NOW()
      WHERE id = 1 AND is_live = true
    `;
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating viewer count:", error);
    return c.json({ success: false, error: "Failed to update viewer count" }, 500);
  }
});

export default stream;
