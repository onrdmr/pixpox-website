import { Hono } from "hono";
import {
  getNeon,
  getOrCreateUser,
  recordChatActivity,
  transferRP,
  claimDailyBonus,
  placeBet,
  getActiveBets,
  getUserByUsername,
  getUserRank,
  sendGift,
  setUserFollower,
  setUserOnline,
  getLeaderboard,
  updateUserRP,
} from "../lib/db.js";

const kick = new Hono();

function parseCommand(message) {
  if (!message.startsWith("!")) return null;
  const parts = message.slice(1).trim().split(/\s+/);
  const command = parts[0]?.toLowerCase() || "";
  const args = parts.slice(1);
  return { command, args, rawArgs: args.join(" ") };
}

async function handleCommand(sql, username, cmd) {
  const user = await getOrCreateUser(sql, username);

  switch (cmd.command) {
    case "rp":
    case "puan":
    case "bakiye": {
      const rank = await getUserRank(sql, user.id);
      const winRate = user.total_bets > 0 ? Math.round((user.total_wins / user.total_bets) * 100) : 0;
      return {
        message: `@${username} | RP: ${user.rp_balance.toLocaleString()} | Sira: #${rank} | Kazanma: ${winRate}%`,
        shouldSpeak: false,
      };
    }
    case "gunluk":
    case "daily":
    case "bonus": {
      const result = await claimDailyBonus(sql, user.id);
      if (result.success) {
        return { message: `@${username} ${result.message}`, zekaReisAction: "thumbs_up", shouldSpeak: true };
      }
      return { message: `@${username} ${result.message}` };
    }
    case "bahis":
    case "bet": {
      const amount = parseInt(cmd.args[0] || "0");
      const option = cmd.args[1]?.toUpperCase();

      if (!amount || amount <= 0) {
        const activeBets = await getActiveBets(sql);
        if (activeBets.length === 0) return { message: `@${username} Su anda aktif bahis yok!` };
        const bet = activeBets[0];
        return {
          message: `@${username} Kullanim: !bahis [miktar] [A/B] | Aktif: "${bet.title}" | A: ${bet.option_a} (${bet.option_a_pool} RP) | B: ${bet.option_b} (${bet.option_b_pool} RP)`,
        };
      }
      if (option !== "A" && option !== "B") {
        return { message: `@${username} Gecersiz secenek! A veya B kullanin.` };
      }

      const activeBets = await getActiveBets(sql);
      if (activeBets.length === 0) return { message: `@${username} Su anda aktif bahis yok!` };

      const result = await placeBet(sql, activeBets[0].id, user.id, option, amount);
      if (result.success) {
        return {
          message: `@${username} ${result.message} Potansiyel kazanc: ${result.potentialPayout} RP`,
          zekaReisAction: "excited",
          shouldSpeak: true,
        };
      }
      return { message: `@${username} ${result.message}` };
    }
    case "transfer":
    case "gonder":
    case "ver": {
      const targetUsername = cmd.args[0]?.replace("@", "");
      const amount = parseInt(cmd.args[1] || "0");
      if (!targetUsername || !amount || amount <= 0) {
        return { message: `@${username} Kullanim: !transfer [@kullanici] [miktar]` };
      }
      const result = await transferRP(sql, username, targetUsername, amount);
      if (result.success) {
        return { message: `@${username} ${result.message}`, zekaReisAction: "wink", shouldSpeak: true };
      }
      return { message: `@${username} ${result.message}` };
    }
    case "hediye":
    case "gift": {
      const targetUsername = cmd.args[0]?.replace("@", "");
      const amount = parseInt(cmd.args[1] || "50");
      if (!targetUsername) return { message: `@${username} Kullanim: !hediye [@kullanici] [miktar]` };
      const result = await sendGift(sql, username, targetUsername, amount, `${username} tarafindan hediye`);
      if (result.success) {
        return { message: `@${username} ${result.message}`, zekaReisAction: "heart", shouldSpeak: true };
      }
      return { message: `@${username} ${result.message}` };
    }
    case "sira":
    case "rank":
    case "top":
    case "leaderboard": {
      const limit = Math.min(parseInt(cmd.args[0] || "5"), 10);
      const leaderboard = await getLeaderboard(sql, limit);
      const rank = await getUserRank(sql, user.id);
      const topUsers = leaderboard
        .slice(0, 5)
        .map((u, i) => `${i + 1}. ${u.username}: ${u.rp_balance.toLocaleString()}`)
        .join(" | ");
      return { message: `Top 5: ${topUsers} | @${username} sen #${rank}. siradasin!` };
    }
    case "komutlar":
    case "yardim":
    case "help":
    case "commands":
      return {
        message: `@${username} Komutlar: !rp (bakiye) | !gunluk (bonus) | !bahis [miktar] [A/B] | !transfer [@user] [miktar] | !hediye [@user] [miktar] | !sira (leaderboard)`,
      };
    default:
      return null;
  }
}

kick.post("/webhook", async (c) => {
  try {
    const body = await c.req.json();
    const sql = getNeon(c.env.DATABASE_URL);
    let botResponse = null;

    const isDetailedFormat = body.data !== undefined;

    if (isDetailedFormat) {
      const event = body;
      switch (event.type) {
        case "chat_message": {
          const { content, sender } = event.data;
          const username = sender.username;
          const cmd = parseCommand(content);
          if (cmd) {
            await recordChatActivity(sql, username, content, true, cmd.command);
            botResponse = await handleCommand(sql, username, cmd);
          } else {
            const { rpEarned } = await recordChatActivity(sql, username, content, false);
            if (rpEarned > 0) {
              botResponse = { message: `@${username} Zeka Reis seni duydu! +${rpEarned} RP`, zekaReisAction: "notice" };
            }
          }
          break;
        }
        case "follow": {
          const { follower } = event.data;
          const result = await setUserFollower(sql, follower.username, true);
          if (result.isNew) {
            botResponse = {
              message: `Ailemize hos geldin @${follower.username}! Ilk 50 RP'ni hesabina tanimladim.`,
              zekaReisAction: "welcome",
              shouldSpeak: true,
            };
          }
          break;
        }
        case "subscription": {
          const { subscriber, months } = event.data;
          const user = await getOrCreateUser(sql, subscriber.username);
          const bonus = 500 + months * 100;
          await updateUserRP(sql, user.id, bonus, "subscription_bonus", `${months} aylik abone bonusu`);
          botResponse = {
            message: `@${subscriber.username} ${months} aylik abone oldu! +${bonus} RP bonus!`,
            zekaReisAction: "celebrate",
            shouldSpeak: true,
          };
          break;
        }
        case "gift": {
          const { gifter, gift_count, gift_type } = event.data;
          const user = await getOrCreateUser(sql, gifter.username);
          const bonus = gift_count * 50;
          await updateUserRP(sql, user.id, bonus, "gift_received", `${gift_count}x ${gift_type} hediye`);
          botResponse = {
            message: `@${gifter.username} ${gift_count}x ${gift_type} hediye atti! +${bonus} RP!`,
            zekaReisAction: "shocked",
            shouldSpeak: true,
          };
          break;
        }
        case "user_join": {
          await setUserOnline(sql, event.data.user.username, true);
          break;
        }
        case "user_leave": {
          await setUserOnline(sql, event.data.user.username, false);
          break;
        }
      }
    } else {
      const message = body;
      switch (message.type) {
        case "chat": {
          const chatMessage = message.message || "";
          const cmd = parseCommand(chatMessage);
          if (cmd) {
            await recordChatActivity(sql, message.username, chatMessage, true, cmd.command);
            botResponse = await handleCommand(sql, message.username, cmd);
          } else {
            const { rpEarned } = await recordChatActivity(sql, message.username, chatMessage, false);
            if (rpEarned > 0) {
              botResponse = { message: `@${message.username} Zeka Reis seni duydu! +${rpEarned} RP`, zekaReisAction: "notice" };
            }
          }
          break;
        }
        case "join": {
          const user = await getOrCreateUser(sql, message.username);
          await setUserOnline(sql, message.username, true);
          await updateUserRP(sql, user.id, 5, "passive_lurk", "Yayina katilim");
          botResponse = { message: `Hos geldin @${message.username}! +5 RP` };
          break;
        }
        case "leave":
          await setUserOnline(sql, message.username, false);
          break;
        case "follow": {
          const result = await setUserFollower(sql, message.username, true);
          if (result.isNew) {
            botResponse = {
              message: `Ailemize hos geldin @${message.username}! Ilk 50 RP'ni hesabina tanimladim.`,
              zekaReisAction: "welcome",
              shouldSpeak: true,
            };
          }
          break;
        }
        case "subscription": {
          const user = await getOrCreateUser(sql, message.username);
          const months = message.months || 1;
          const bonus = 500 + months * 100;
          await updateUserRP(sql, user.id, bonus, "subscription_bonus", `${months} aylik abone bonusu`);
          botResponse = {
            message: `@${message.username} ${months} aylik abone oldu! +${bonus} RP bonus!`,
            zekaReisAction: "celebrate",
            shouldSpeak: true,
          };
          break;
        }
        case "gift": {
          const user = await getOrCreateUser(sql, message.username);
          const rpFromGift = (message.amount || 1) * 50;
          await updateUserRP(sql, user.id, rpFromGift, "gift_received", `Hediye: ${message.amount}`);
          botResponse = {
            message: `@${message.username} hediye icin +${rpFromGift} RP kazandi!`,
            zekaReisAction: "shocked",
            shouldSpeak: true,
          };
          break;
        }
      }
    }

    return c.json({ success: true, response: botResponse });
  } catch (error) {
    console.error("[Kick Webhook Error]", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

kick.get("/webhook", (c) => {
  return c.json({
    status: "ok",
    service: "PixPox RP System - Kick Integration",
    version: "2.0.0",
    endpoints: {
      webhook: "POST /api/kick/webhook",
      commands: [
        "!rp - Mevcut RP bakiyesi",
        "!gunluk - Gunluk bonus (100+ RP)",
        "!bahis [miktar] [A/B] - Aktif bahise katil",
        "!transfer [@user] [miktar] - RP transfer et",
        "!hediye [@user] [miktar] - Hediye gonder",
        "!sira - Leaderboard siralamasi",
        "!komutlar - Tum komutlari goster",
      ],
    },
  });
});

export default kick;
