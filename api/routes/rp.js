import { Hono } from "hono";
import {
  getNeon,
  getActiveBets,
  createBet,
  placeBet,
  resolveBet,
  lockBet,
  cancelBet,
  getUserByUsername,
  getOrCreateUser,
  claimDailyBonus,
  transferRP,
  getUserRank,
} from "../lib/db.js";

const rp = new Hono();

// =====================================================
// GET /api/rp/leaderboard
// =====================================================
rp.get("/leaderboard", async (c) => {
  try {
    const sql = getNeon(c.env.DATABASE_URL);

    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
    const sortBy = c.req.query("sortBy") || "rp_balance";
    const sortOrder = c.req.query("sortOrder") || "desc";
    const offset = (page - 1) * limit;

    const allowedSortFields = ["rp_balance", "total_bets", "message_count", "total_wins", "total_earned"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "rp_balance";
    const safeSortOrder = sortOrder === "asc" ? "ASC" : "DESC";

    // Use sql.unsafe for safe whitelisted dynamic identifiers (safeSortBy/safeSortOrder are validated above)
    const orderClause =
      safeSortBy === "total_bets" ? sql`u.total_bets`
      : safeSortBy === "message_count" ? sql`u.message_count`
      : safeSortBy === "total_wins" ? sql`u.total_wins`
      : safeSortBy === "total_earned" ? sql`u.total_earned`
      : sql`u.rp_balance`;
    const dirClause = safeSortOrder === "DESC" ? sql`DESC` : sql`ASC`;

    const users = await sql`
      SELECT
        u.id, u.kick_id, u.username, u.display_name, u.rp_balance,
        u.total_earned, u.total_spent, u.total_bets, u.total_wins,
        u.message_count, u.is_online, u.is_subscriber, u.is_follower,
        u.last_seen, u.rank_id, u.created_at,
        r.name as rank_name, r.color as rank_color, r.min_rp as rank_min_rp, r.badge_emoji
      FROM users u
      LEFT JOIN ranks r ON u.rank_id = r.id
      ORDER BY ${orderClause} ${dirClause}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`SELECT COUNT(*) as total FROM users`;
    const total = parseInt(countResult[0]?.total || "0");

    const statsResult = await sql`
      SELECT
        COALESCE(SUM(rp_balance), 0) as total_rp,
        COUNT(*) FILTER (WHERE is_online = true) as online_viewers
      FROM users
    `;
    const betsResult = await sql`SELECT COUNT(*) as active_bets FROM active_bets WHERE status = 'open'`;

    return c.json({
      users,
      total,
      stats: {
        totalRP: parseInt(statsResult[0]?.total_rp || "0"),
        activeBets: parseInt(betsResult[0]?.active_bets || "0"),
        onlineViewers: parseInt(statsResult[0]?.online_viewers || "0"),
      },
    });
  } catch (error) {
    console.error("[Leaderboard API Error]", error);
    return c.json(
      { users: [], total: 0, stats: { totalRP: 0, activeBets: 0, onlineViewers: 0 }, error: "Failed to fetch leaderboard" },
      500
    );
  }
});

// =====================================================
// POST /api/rp/daily — claim daily bonus
// =====================================================
rp.post("/daily", async (c) => {
  try {
    const { username } = await c.req.json();
    if (!username) return c.json({ success: false, error: "Username is required" }, 400);

    const sql = getNeon(c.env.DATABASE_URL);
    const user = await getOrCreateUser(sql, username);
    const result = await claimDailyBonus(sql, user.id);

    if (!result.success) {
      return c.json({ success: false, error: result.message }, 400);
    }
    return c.json({ success: true, amount: result.amount, message: result.message });
  } catch (error) {
    console.error("Daily bonus error:", error);
    return c.json({ success: false, error: "Failed to claim daily bonus" }, 500);
  }
});

// =====================================================
// POST /api/rp/transfer
// =====================================================
rp.post("/transfer", async (c) => {
  try {
    const { from, to, amount } = await c.req.json();
    if (!from || !to || !amount) {
      return c.json({ success: false, error: "Missing required fields: from, to, amount" }, 400);
    }
    if (typeof amount !== "number" || amount <= 0) {
      return c.json({ success: false, error: "Amount must be a positive number" }, 400);
    }
    if (from.toLowerCase() === to.toLowerCase()) {
      return c.json({ success: false, error: "Cannot transfer to yourself" }, 400);
    }

    const sql = getNeon(c.env.DATABASE_URL);
    const result = await transferRP(sql, from, to, amount);
    if (!result.success) return c.json({ success: false, error: result.message }, 400);
    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Transfer error:", error);
    return c.json({ success: false, error: "Failed to transfer RP" }, 500);
  }
});

// =====================================================
// GET /api/rp/viewer/:username
// =====================================================
rp.get("/viewer/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const sql = getNeon(c.env.DATABASE_URL);
    const user = await getUserByUsername(sql, username);
    if (!user) return c.json({ success: false, error: "User not found" }, 404);

    const rank = await getUserRank(sql, user.id);
    return c.json({ success: true, data: { ...user, rank } });
  } catch (error) {
    console.error("Viewer API error:", error);
    return c.json({ success: false, error: "Failed to fetch viewer" }, 500);
  }
});

// =====================================================
// GET /api/rp/bets
// =====================================================
rp.get("/bets", async (c) => {
  try {
    const sql = getNeon(c.env.DATABASE_URL);
    const includeResolved = c.req.query("all") === "true";

    const bets = includeResolved
      ? await sql`SELECT * FROM active_bets ORDER BY created_at DESC LIMIT 20`
      : await getActiveBets(sql);

    const betsWithStats = await Promise.all(
      bets.map(async (bet) => {
        const entries = await sql`
          SELECT
            COUNT(*) as total_entries,
            COUNT(*) FILTER (WHERE option_selected = 'A') as entries_a,
            COUNT(*) FILTER (WHERE option_selected = 'B') as entries_b
          FROM bet_entries WHERE bet_id = ${bet.id}
        `;
        return {
          id: bet.id,
          title: bet.title,
          description: bet.description,
          option_a: { label: bet.option_a, pool: bet.option_a_pool },
          option_b: { label: bet.option_b, pool: bet.option_b_pool },
          total_pool: bet.option_a_pool + bet.option_b_pool,
          total_entries: Number(entries[0]?.total_entries || 0),
          entries_a: Number(entries[0]?.entries_a || 0),
          entries_b: Number(entries[0]?.entries_b || 0),
          status: bet.status,
          winning_option: bet.winning_option,
          min_bet: bet.min_bet,
          max_bet: bet.max_bet,
          created_by: bet.created_by,
          created_at: bet.created_at,
          locked_at: bet.locked_at,
          resolved_at: bet.resolved_at,
        };
      })
    );

    return c.json({ success: true, data: betsWithStats });
  } catch (error) {
    console.error("[Bets API Error]", error);
    return c.json({ success: false, error: "Failed to fetch bets" }, 500);
  }
});

// =====================================================
// POST /api/rp/bets — create / place / lock / resolve / cancel
// =====================================================
rp.post("/bets", async (c) => {
  try {
    const body = await c.req.json();
    const { action } = body;
    const sql = getNeon(c.env.DATABASE_URL);

    switch (action) {
      case "create": {
        const { title, optionA, optionB, createdBy, description, minBet, maxBet } = body;
        if (!title || !optionA || !optionB) {
          return c.json({ success: false, error: "title, optionA, optionB gerekli" }, 400);
        }
        const bet = await createBet(sql, title, optionA, optionB, createdBy || "System", description, minBet || 10, maxBet || 1000);
        return c.json({ success: true, message: "Bahis olusturuldu!", data: bet });
      }
      case "place": {
        const { betId, username, option, amount } = body;
        if (!betId || !username || !option || !amount) {
          return c.json({ success: false, error: "betId, username, option, amount gerekli" }, 400);
        }
        const user = await getUserByUsername(sql, username);
        if (!user) return c.json({ success: false, error: "Kullanici bulunamadi" }, 404);
        const result = await placeBet(sql, betId, user.id, option.toUpperCase(), amount);
        return c.json(result, result.success ? 200 : 400);
      }
      case "lock": {
        const { betId } = body;
        if (!betId) return c.json({ success: false, error: "betId gerekli" }, 400);
        const result = await lockBet(sql, betId);
        return c.json(result);
      }
      case "resolve": {
        const { betId, winningOption } = body;
        if (!betId || !winningOption) {
          return c.json({ success: false, error: "betId ve winningOption (A/B) gerekli" }, 400);
        }
        const result = await resolveBet(sql, betId, winningOption.toUpperCase());
        return c.json(result);
      }
      case "cancel": {
        const { betId } = body;
        if (!betId) return c.json({ success: false, error: "betId gerekli" }, 400);
        const result = await cancelBet(sql, betId);
        return c.json(result);
      }
      default:
        return c.json({ success: false, error: "Gecersiz action: create, place, lock, resolve, cancel" }, 400);
    }
  } catch (error) {
    console.error("[Bets API Error]", error);
    return c.json({ success: false, error: "Failed to process bet action" }, 500);
  }
});

// =====================================================
// POST /api/rp/cron/reward-lurkers — protected cron endpoint
// =====================================================
rp.post("/cron/reward-lurkers", async (c) => {
  try {
    const apiKey = c.req.header("x-api-key");
    if (c.env.CRON_API_KEY && apiKey !== c.env.CRON_API_KEY) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }
    const sql = getNeon(c.env.DATABASE_URL);
    const { rewardLurkers } = await import("../lib/db.js");
    const result = await rewardLurkers(sql);
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error("Reward lurkers error:", error);
    return c.json({ success: false, error: "Failed to reward lurkers" }, 500);
  }
});

export default rp;
