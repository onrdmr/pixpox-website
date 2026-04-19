import { neon } from "@neondatabase/serverless";

// Per-request neon client. Pass DATABASE_URL from c.env.
export function getNeon(databaseUrl) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  return neon(databaseUrl);
}

// =====================================================
// USER FUNCTIONS
// =====================================================

export async function getUserByUsername(sql, username) {
  const result = await sql`
    SELECT u.*, r.name as rank_name, r.badge_emoji, r.multiplier, r.color as rank_color
    FROM users u
    LEFT JOIN ranks r ON u.rank_id = r.id
    WHERE u.username = ${username}
    LIMIT 1
  `;
  if (!result[0]) return null;
  const user = result[0];
  user.rank = {
    id: user.rank_id,
    name: user.rank_name,
    min_rp: 0,
    multiplier: user.multiplier,
    badge_emoji: user.badge_emoji,
    color: user.rank_color,
  };
  return user;
}

export async function getUserByKickId(sql, kickId) {
  const result = await sql`
    SELECT u.*, r.name as rank_name, r.badge_emoji, r.multiplier
    FROM users u
    LEFT JOIN ranks r ON u.rank_id = r.id
    WHERE u.kick_id = ${kickId}
    LIMIT 1
  `;
  return result[0] || null;
}

export async function getOrCreateUser(sql, username, kickId) {
  let user = await getUserByUsername(sql, username);
  if (!user) {
    const result = await sql`
      INSERT INTO users (username, display_name, kick_id, rp_balance, is_follower)
      VALUES (${username}, ${username}, ${kickId || null}, 100, false)
      RETURNING *
    `;
    user = result[0];
    await recordTransaction(sql, user.id, "follow_bonus", 100, 100, null, "Hos geldin bonusu!");
  }
  return user;
}

export async function updateUserRP(sql, userId, amount, type, description, sourceId, metadata) {
  const result = await sql`
    UPDATE users
    SET
      rp_balance = GREATEST(0, rp_balance + ${amount}),
      total_earned = CASE WHEN ${amount} > 0 THEN total_earned + ${amount} ELSE total_earned END,
      total_spent = CASE WHEN ${amount} < 0 THEN total_spent + ${Math.abs(amount)} ELSE total_spent END
    WHERE id = ${userId}
    RETURNING *
  `;
  const user = result[0];
  await recordTransaction(sql, userId, type, amount, user.rp_balance, sourceId, description, metadata);
  return user;
}

export async function recordTransaction(sql, userId, type, amount, balanceAfter, sourceId, description, metadata) {
  await sql`
    INSERT INTO transactions (user_id, type, amount, balance_after, source_id, description, metadata)
    VALUES (${userId}, ${type}, ${amount}, ${balanceAfter}, ${sourceId || null}, ${description || null}, ${metadata ? JSON.stringify(metadata) : null})
  `;
}

export async function setUserOnline(sql, username, isOnline) {
  await sql`
    UPDATE users
    SET is_online = ${isOnline}, last_seen = NOW()
    WHERE username = ${username}
  `;
}

export async function setUserFollower(sql, username, isFollower) {
  const user = await getOrCreateUser(sql, username);
  if (user.is_follower) return { isNew: false, user };
  if (isFollower) {
    await sql`UPDATE users SET is_follower = true WHERE id = ${user.id}`;
    const updatedUser = await updateUserRP(sql, user.id, 50, "follow_bonus", "Yeni takipci bonusu!");
    return { isNew: true, user: updatedUser };
  }
  return { isNew: false, user };
}

// =====================================================
// LEADERBOARD
// =====================================================

export async function getLeaderboard(sql, limit = 10, offset = 0) {
  return sql`
    SELECT u.*, r.name as rank_name, r.badge_emoji, r.color as rank_color
    FROM users u
    LEFT JOIN ranks r ON u.rank_id = r.id
    ORDER BY u.rp_balance DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getUserRank(sql, userId) {
  const result = await sql`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE rp_balance > (SELECT rp_balance FROM users WHERE id = ${userId})
  `;
  return Number(result[0]?.rank || 1);
}

export async function getOnlineUsers(sql) {
  return sql`
    SELECT u.*, r.name as rank_name, r.badge_emoji
    FROM users u
    LEFT JOIN ranks r ON u.rank_id = r.id
    WHERE u.is_online = true
    ORDER BY u.rp_balance DESC
  `;
}

// =====================================================
// TRANSFER
// =====================================================

export async function transferRP(sql, fromUsername, toUsername, amount) {
  if (amount <= 0) return { success: false, message: "Gecersiz miktar! Pozitif bir sayi girin." };
  if (fromUsername.toLowerCase() === toUsername.toLowerCase()) {
    return { success: false, message: "Kendinize transfer yapamazsiniz!" };
  }

  const sender = await getUserByUsername(sql, fromUsername);
  if (!sender) return { success: false, message: "Gonderen bulunamadi!" };
  if (sender.rp_balance < amount) {
    return { success: false, message: `Yetersiz bakiye! Mevcut: ${sender.rp_balance} RP` };
  }

  const receiver = await getOrCreateUser(sql, toUsername);

  const updatedSender = await updateUserRP(
    sql, sender.id, -amount, "transfer_out",
    `${toUsername} adli kullaniciya transfer`, receiver.id
  );
  const updatedReceiver = await updateUserRP(
    sql, receiver.id, amount, "transfer_in",
    `${fromUsername} adli kullanicidan transfer`, sender.id
  );

  return {
    success: true,
    message: `${amount} RP basariyla ${toUsername} adli kullaniciya transfer edildi!`,
    sender: updatedSender,
    receiver: updatedReceiver,
  };
}

// =====================================================
// DAILY BONUS
// =====================================================

export async function claimDailyBonus(sql, userId) {
  const existing = await sql`
    SELECT * FROM daily_claims
    WHERE user_id = ${userId} AND claimed_at = CURRENT_DATE
    LIMIT 1
  `;
  if (existing[0]) {
    return { success: false, amount: 0, streak: existing[0].streak, message: "Gunluk bonus zaten alindi! Yarin tekrar gel." };
  }

  const yesterday = await sql`
    SELECT * FROM daily_claims
    WHERE user_id = ${userId} AND claimed_at = CURRENT_DATE - 1
    LIMIT 1
  `;
  const streak = yesterday[0] ? yesterday[0].streak + 1 : 1;
  const baseAmount = 100;
  const streakBonus = Math.min(streak * 10, 100);
  const totalAmount = baseAmount + streakBonus;

  await sql`
    INSERT INTO daily_claims (user_id, amount, streak)
    VALUES (${userId}, ${totalAmount}, ${streak})
  `;
  await updateUserRP(sql, userId, totalAmount, "daily_bonus", `Gunluk bonus (${streak} gun seri)`);

  return { success: true, amount: totalAmount, streak, message: `${totalAmount} RP gunluk bonus aldin! (${streak} gun seri)` };
}

// =====================================================
// PASSIVE LURK REWARD
// =====================================================

export async function rewardLurkers(sql) {
  const activeUsers = await sql`
    SELECT DISTINCT u.id, u.username, u.is_subscriber, r.multiplier
    FROM users u
    LEFT JOIN ranks r ON u.rank_id = r.id
    LEFT JOIN chat_activity ca ON ca.user_id = u.id
    WHERE u.is_online = true
    AND ca.created_at > NOW() - INTERVAL '10 minutes'
    AND (u.last_lurk_reward_at IS NULL OR u.last_lurk_reward_at < NOW() - INTERVAL '10 minutes')
  `;

  let totalRP = 0;
  const baseReward = 5;

  for (const user of activeUsers) {
    const multiplier = user.is_subscriber ? 1.5 : (user.multiplier || 1.0);
    const reward = Math.floor(baseReward * multiplier);
    await updateUserRP(sql, user.id, reward, "passive_lurk", `10dk sadakat odulu (${multiplier}x)`);
    await sql`UPDATE users SET last_lurk_reward_at = NOW() WHERE id = ${user.id}`;
    totalRP += reward;
  }
  return { rewarded: activeUsers.length, totalRP };
}

// =====================================================
// CHAT ACTIVITY & MENTION REWARD
// =====================================================

export async function recordChatActivity(sql, username, message, isCommand = false, commandType) {
  const user = await getOrCreateUser(sql, username);
  let rpEarned = 0;

  const mentionedZekaReis = /zeka\s*reis|@zekareis/i.test(message);

  if (mentionedZekaReis && !isCommand) {
    const recentRewards = await sql`
      SELECT COUNT(*) as count FROM chat_activity
      WHERE user_id = ${user.id}
      AND mentioned_zeka_reis = true
      AND rp_earned > 0
      AND created_at > NOW() - INTERVAL '1 minute'
    `;
    if (Number(recentRewards[0]?.count || 0) < 2) {
      rpEarned = 1;
      await updateUserRP(sql, user.id, rpEarned, "active_chat", "Zeka Reis mention");
    }
  }

  await sql`
    UPDATE users SET message_count = message_count + 1, last_message_at = NOW()
    WHERE id = ${user.id}
  `;
  await sql`
    INSERT INTO chat_activity (user_id, message, is_command, command_type, mentioned_zeka_reis, rp_earned)
    VALUES (${user.id}, ${message}, ${isCommand}, ${commandType || null}, ${mentionedZekaReis}, ${rpEarned})
  `;
  return { user, rpEarned };
}

// =====================================================
// BETS
// =====================================================

export async function getActiveBets(sql) {
  return sql`
    SELECT * FROM active_bets
    WHERE status IN ('open', 'locked')
    ORDER BY created_at DESC
  `;
}

export async function getBetById(sql, betId) {
  const result = await sql`SELECT * FROM active_bets WHERE id = ${betId} LIMIT 1`;
  return result[0] || null;
}

export async function createBet(sql, title, optionA, optionB, createdBy, description, minBet = 10, maxBet = 1000) {
  const result = await sql`
    INSERT INTO active_bets (title, description, option_a, option_b, created_by, min_bet, max_bet)
    VALUES (${title}, ${description || null}, ${optionA}, ${optionB}, ${createdBy}, ${minBet}, ${maxBet})
    RETURNING *
  `;
  return result[0];
}

export async function placeBet(sql, betId, userId, option, amount) {
  const bet = await getBetById(sql, betId);
  if (!bet) return { success: false, message: "Bahis bulunamadi!" };
  if (bet.status !== "open") return { success: false, message: "Bu bahis artik acik degil!" };
  if (amount < bet.min_bet) return { success: false, message: `Minimum bahis: ${bet.min_bet} RP` };
  if (amount > bet.max_bet) return { success: false, message: `Maximum bahis: ${bet.max_bet} RP` };

  const userResult = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  const user = userResult[0];
  if (!user || user.rp_balance < amount) {
    return { success: false, message: `Yetersiz bakiye! Mevcut: ${user?.rp_balance || 0} RP` };
  }

  const existingEntry = await sql`
    SELECT * FROM bet_entries WHERE bet_id = ${betId} AND user_id = ${userId} LIMIT 1
  `;
  if (existingEntry[0]) return { success: false, message: "Bu bahise zaten katildiniz!" };

  const totalPool = bet.option_a_pool + bet.option_b_pool + amount;
  const selectedPool = (option === "A" ? bet.option_a_pool : bet.option_b_pool) + amount;
  const potentialPayout = Math.floor((amount / selectedPool) * totalPool);

  await sql`
    INSERT INTO bet_entries (bet_id, user_id, option_selected, amount, potential_payout)
    VALUES (${betId}, ${userId}, ${option}, ${amount}, ${potentialPayout})
  `;

  if (option === "A") {
    await sql`UPDATE active_bets SET option_a_pool = option_a_pool + ${amount} WHERE id = ${betId}`;
  } else {
    await sql`UPDATE active_bets SET option_b_pool = option_b_pool + ${amount} WHERE id = ${betId}`;
  }

  await updateUserRP(sql, userId, -amount, "bet_loss", `Bahis: ${bet.title}`, betId, { option, potentialPayout });
  await sql`UPDATE users SET total_bets = total_bets + 1 WHERE id = ${userId}`;

  return {
    success: true,
    message: `${amount} RP ile "${option === "A" ? bet.option_a : bet.option_b}" secenegine bahis yapildi!`,
    potentialPayout,
  };
}

export async function lockBet(sql, betId) {
  const result = await sql`
    UPDATE active_bets SET status = 'locked', locked_at = NOW()
    WHERE id = ${betId} AND status = 'open'
    RETURNING *
  `;
  if (!result[0]) return { success: false, message: "Bahis bulunamadi veya zaten kilitli!" };
  return { success: true, message: "Bahis kilitlendi! Yeni katilim kabul edilmiyor." };
}

export async function resolveBet(sql, betId, winningOption) {
  const bet = await getBetById(sql, betId);
  if (!bet || bet.status === "resolved" || bet.status === "cancelled") {
    return { success: false, message: "Bahis bulunamadi veya zaten cozuldu!", winners: 0, totalPayout: 0 };
  }

  const totalPool = bet.option_a_pool + bet.option_b_pool;
  const winningPool = winningOption === "A" ? bet.option_a_pool : bet.option_b_pool;

  const winners = await sql`
    SELECT be.*, u.username FROM bet_entries be
    JOIN users u ON be.user_id = u.id
    WHERE be.bet_id = ${betId} AND be.option_selected = ${winningOption}
  `;

  let totalPayout = 0;
  for (const entry of winners) {
    const payout = winningPool > 0 ? Math.floor((entry.amount / winningPool) * totalPool) : 0;
    await sql`UPDATE bet_entries SET actual_payout = ${payout}, status = 'won' WHERE id = ${entry.id}`;
    await updateUserRP(sql, entry.user_id, payout, "bet_win", `Bahis kazanci: ${bet.title}`, betId);
    await sql`UPDATE users SET total_wins = total_wins + 1 WHERE id = ${entry.user_id}`;
    totalPayout += payout;
  }

  await sql`
    UPDATE bet_entries SET actual_payout = 0, status = 'lost'
    WHERE bet_id = ${betId} AND option_selected != ${winningOption}
  `;
  await sql`
    UPDATE active_bets SET status = 'resolved', winning_option = ${winningOption}, resolved_at = NOW()
    WHERE id = ${betId}
  `;

  return {
    success: true,
    message: `Bahis cozuldu! "${winningOption === "A" ? bet.option_a : bet.option_b}" kazandi!`,
    winners: winners.length,
    totalPayout,
  };
}

export async function cancelBet(sql, betId) {
  const bet = await getBetById(sql, betId);
  if (!bet || bet.status === "resolved" || bet.status === "cancelled") {
    return { success: false, message: "Bahis bulunamadi veya zaten tamamlandi!", refunded: 0 };
  }

  const entries = await sql`SELECT * FROM bet_entries WHERE bet_id = ${betId}`;
  for (const entry of entries) {
    await updateUserRP(sql, entry.user_id, entry.amount, "bet_win", `Bahis iptali iadesi: ${bet.title}`, betId);
    await sql`UPDATE bet_entries SET actual_payout = ${entry.amount}, status = 'won' WHERE id = ${entry.id}`;
  }
  await sql`UPDATE active_bets SET status = 'cancelled' WHERE id = ${betId}`;

  return { success: true, message: "Bahis iptal edildi ve tum katilimcilar iade edildi!", refunded: entries.length };
}

// =====================================================
// GIFTS
// =====================================================

export async function sendGift(sql, senderUsername, receiverUsername, amount, message) {
  if (amount <= 0) return { success: false, message: "Gecersiz miktar!" };
  const sender = await getUserByUsername(sql, senderUsername);
  if (!sender || sender.rp_balance < amount) return { success: false, message: "Yetersiz bakiye!" };

  const receiver = await getOrCreateUser(sql, receiverUsername);

  await sql`
    INSERT INTO gifts (sender_id, receiver_id, amount, message)
    VALUES (${sender.id}, ${receiver.id}, ${amount}, ${message || null})
  `;

  await updateUserRP(sql, sender.id, -amount, "gift_sent", `${receiverUsername} icin hediye`, receiver.id);
  await updateUserRP(sql, receiver.id, amount, "gift_received", `${senderUsername} tarafindan hediye`, sender.id);

  return { success: true, message: `${amount} RP hediye olarak ${receiverUsername} adli kullaniciya gonderildi!` };
}
