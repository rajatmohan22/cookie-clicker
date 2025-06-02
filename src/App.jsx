import { useEffect, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
import { LeaderBoard } from "./components/LeaderBoard";

function App() {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:8080");

    socket.on("leaderboard", (rows) => setPlayers(rows));

    return () => socket.disconnect();
  }, []);

  // Optionally, you can show loading when fetching leaderboard
  // You can set loading to true before fetching and set to false after fetching in your socket logic

  return (
    <div className="App">
      {/* Show input and Enter Player button only if user is NOT set */}
      {!user && (
        <div className="name-entry">
          <input
            type="text"
            placeholder="Enter your name..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            onClick={() => {
              if (inputValue.trim() !== "") {
                setUser(inputValue.trim());
                setInputValue(""); // Optionally clear input
              }
            }}
          >
            Enter Player
          </button>
        </div>
      )}

      {/* Show welcome message if user is set */}
      {user && <h2>Welcome, {user}!</h2>}

      <h1>Leaderboard</h1>

      {/* Show loading or leaderboard */}
      {loading ? (
        <p>Loading Leaderboard...</p>
      ) : (
        <LeaderBoard players={players} />
      )}

      {/* HIT ME button, only enabled if user is set */}
      <button
        disabled={!user}
        onClick={() => {
          if (!user) return;
          fetch("http://localhost:8080/hit", {
            method: "POST",
            mode: "cors",
            body: JSON.stringify({ user }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Response from server:", data);
            });
        }}
      >
        HIT ME 🍪
      </button>
    </div>
  );
}

export default App;
