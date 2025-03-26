import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    // This will be handled in App.jsx via socket
    navigate("/room/new"); // Redirect to trigger room creation
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId && username) {
      navigate(`/room/${roomId}`, { state: { username } });
    } else {
      alert("Please enter both a room ID and username.");
    }
  };

  return (
    <div className="home">
      <h1>Real-Time Collaborative Notes</h1>
      <div className="actions">
        <button onClick={handleCreateRoom}>Create New Room</button>
        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Join Room</button>
        </form>
      </div>
    </div>
  );
}