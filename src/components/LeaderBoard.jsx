export const LeaderBoard = ({ players }) => {
  // Defensive: ensure players is always an array
  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <section className="lb-wrapper">
      <h2 className="lb-title">🏆 Leaderboard</h2>

      <table className="lb-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {safePlayers.map((p, i) => (
            <tr key={p.user ?? i}>
              <td>{i + 1}</td>
              <td>{p.user ?? "Unknown"}</td>
              <td>{p.score ?? p.clicks ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
