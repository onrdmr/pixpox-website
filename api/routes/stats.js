import { Hono } from "hono";
import { getNeon } from "../lib/db.js";

const stats = new Hono();

stats.get("/live", async (c) => {
  try {
    const sql = getNeon(c.env.DATABASE_URL);

    const onlineViewers = await sql`SELECT COUNT(*) as count FROM users WHERE is_online = true`;
    const totalStaked = await sql`SELECT COALESCE(SUM(rp_balance), 0) as total FROM users`;
    const activeBets = await sql`SELECT COUNT(*) as count FROM active_bets WHERE status = 'open'`;
    const totalUsers = await sql`SELECT COUNT(*) as count FROM users WHERE message_count > 0 OR total_bets > 0`;
    const streamStatus = await sql`SELECT is_live, viewer_count, stream_title FROM stream_status WHERE id = 1`;

    const isLive = streamStatus[0]?.is_live === true;
    const broadcasterViewerCount = Number(streamStatus[0]?.viewer_count || 0);
    const streamTitle = streamStatus[0]?.stream_title || null;

    return c.json({
      success: true,
      data: {
        aiCharacters: Number(totalUsers[0]?.count || 0),
        liveViewers: isLive ? broadcasterViewerCount : Number(onlineViewers[0]?.count || 0),
        reisStaked: Number(totalStaked[0]?.total || 0),
        activeBets: Number(activeBets[0]?.count || 0),
        isLive,
        streamTitle,
      },
    });
  } catch (error) {
    console.error("Error fetching live stats:", error);
    return c.json({
      success: false,
      data: { aiCharacters: 0, liveViewers: 0, reisStaked: 0, activeBets: 0, isLive: false },
    });
  }
});

export default stats;
