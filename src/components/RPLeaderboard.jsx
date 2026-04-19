import React, { useEffect, useState, useMemo } from "react";
import "./RPLeaderboard.css";

export function RPLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("rp_balance");
  const [sortOrder, setSortOrder] = useState("desc");
  const limit = 20;

  useEffect(() => {
    fetchData();
  }, [page, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/rp/leaderboard?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      // Fallback data for demonstration if API is down
      setData({
        users: [
          { id: 1, username: "zekareis", display_name: "Zeka Reis", rp_balance: 154200, total_bets: 156, total_wins: 89, is_online: true, last_seen: new Date().toISOString(), rank_name: "Kurucu", rank_color: "#06b6d4" },
          { id: 2, username: "onrdmr", display_name: "Onur", rp_balance: 89400, total_bets: 92, total_wins: 45, is_online: false, last_seen: new Date().toISOString(), rank_name: "Admin", rank_color: "#7c3aed" }
        ],
        total: 2,
        stats: { totalRP: 243600, activeBets: 12, onlineViewers: 847 }
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (!search.trim()) return data.users;
    const q = search.toLowerCase();
    return data.users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.display_name && u.display_name.toLowerCase().includes(q))
    );
  }, [data?.users, search]);

  const formatNumber = (n) => {
    return n.toLocaleString("tr-TR");
  };

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "simdi";
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    const days = Math.floor(hours / 24);
    return `${days}g`;
  };

  const getRankIcon = (index) => {
    if (index === 0) return "crown";
    if (index === 1) return "silver";
    if (index === 2) return "bronze";
    return "";
  };

  const getWinRate = (won, total) => {
    if (total === 0) return 0;
    return Math.round((won / total) * 100);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="rp-leaderboard-container">
      {/* Stats */}
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-value">{data?.stats ? formatNumber(data.stats.totalRP) : "..."}</div>
          <div className="rp-stat-label">Toplam RP</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-value">{data?.stats?.activeBets ?? "..."}</div>
          <div className="rp-stat-label">Aktif Bahis</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-value">{data?.stats?.onlineViewers ?? "..."}</div>
          <div className="rp-stat-label">Online Izleyici</div>
        </div>
      </div>

      {/* Search */}
      <div className="rp-search-bar">
        <input
          type="text"
          placeholder="Kullanici ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rp-search-input"
        />
        <div className="rp-sort-buttons">
          <button
            className={`rp-sort-btn ${sortBy === "rp_balance" ? "active" : ""}`}
            onClick={() => handleSort("rp_balance")}
          >
            RP {sortBy === "rp_balance" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            className={`rp-sort-btn ${sortBy === "total_bets" ? "active" : ""}`}
            onClick={() => handleSort("total_bets")}
          >
            Bahis {sortBy === "total_bets" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            className={`rp-sort-btn ${sortBy === "message_count" ? "active" : ""}`}
            onClick={() => handleSort("message_count")}
          >
            Mesaj {sortBy === "message_count" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rp-leaderboard">
        <div className="rp-header">
          <span className="rp-col rank">Sira</span>
          <span className="rp-col user">Kullanici</span>
          <span className="rp-col points">RP</span>
          <span className="rp-col action">Rank</span>
          <span className="rp-col stats">Bahis/Kazanma</span>
          <span className="rp-col status">Durum</span>
        </div>

        {loading ? (
          <div className="rp-loading">Yukleniyor...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="rp-empty">Kullanici bulunamadi</div>
        ) : (
          filteredUsers.map((user, index) => {
            const globalIndex = (page - 1) * limit + index;
            const betsLost = user.total_bets - user.total_wins;
            const winRate = getWinRate(user.total_wins, user.total_bets);
            const trend = user.total_wins > betsLost ? "up" : betsLost > user.total_wins ? "down" : "stable";

            return (
              <div key={user.id} className="rp-row" data-trend={trend}>
                <span className="rp-col rank">
                  <span className={`rank-icon ${getRankIcon(globalIndex)}`}>{globalIndex + 1}</span>
                </span>
                <span className="rp-col user">
                  <span className="user-avatar" style={{ background: user.rank_color || "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                    {user.username[0].toUpperCase()}
                  </span>
                  <span className="user-info">
                    <span className="user-name">{user.display_name || user.username}</span>
                    <span className="user-rank" style={{ color: user.rank_color }}>{user.rank_name || "Yeni"}</span>
                  </span>
                </span>
                <span className="rp-col points">{formatNumber(user.rp_balance)}</span>
                <span className="rp-col action">
                  <span className="rank-badge" style={{ borderColor: user.rank_color || "#7c3aed", color: user.rank_color || "#7c3aed" }}>
                    {user.rank_name || "Yeni"}
                  </span>
                </span>
                <span className="rp-col stats">
                  {user.total_bets}/{user.total_wins} <small>({winRate}%)</small>
                </span>
                <span className={`rp-col status ${user.is_online ? "online" : "offline"}`}>
                  {user.is_online ? "Online" : formatTime(user.last_seen)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rp-pagination">
          <button className="rp-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Onceki
          </button>
          <span className="rp-page-info">
            Sayfa {page} / {totalPages} ({data?.total} kullanici)
          </span>
          <button className="rp-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
