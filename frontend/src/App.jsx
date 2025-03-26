import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { NoteEditor } from "./components/NoteEditor";
import { UsersList } from "./components/UsersList";

const socket = io({
  transports: ["websocket", "polling"],
  reconnection: true,
});

function App() {
  const [noteContent, setNoteContent] = useState("");
  const [users, setUsers] = useState([]);
  const { roomId } = useParams();
  const { state } = useLocation(); // Get username from state
  const navigate = useNavigate();
  const username = state?.username || "Unnamed";

  useEffect(() => {
    socket.on("connect", () => console.log("Connected to server:", socket.id));
    socket.on("connect_error", (err) => console.error("Connection error:", err));

    if (roomId === "new") {
      // Create a new room
      socket.emit("createRoom", (newRoomId) => {
        navigate(`/room/${newRoomId}`, { state: { username } });
      });
    } else {
      // Join an existing room
      socket.emit("joinRoom", { roomId, username });
    }

    socket.on("loadNote", (content) => {
      console.log("Loaded note:", content);
      setNoteContent(content);
    });

    socket.on("noteUpdated", (content) => {
      console.log("Note updated:", content);
      setNoteContent(content);
    });

    socket.on("updateUsers", (userList) => {
      console.log("Updated user list:", userList);
      setUsers(userList);
    });

    socket.on("userJoined", ({ id, username }) => {
      console.log("User joined:", { id, username });
      setUsers((prev) => {
        const newUsers = prev.filter((u) => u.id !== id);
        return [...newUsers, { id, username }];
      });
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("loadNote");
      socket.off("noteUpdated");
      socket.off("updateUsers");
      socket.off("userJoined");
    };
  }, [roomId, username, navigate]);

  const handleNoteChange = (newContent) => {
    setNoteContent(newContent);
    socket.emit("updateNote", { roomId, content: newContent });
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Collaborative Notes - Room: {roomId}</h1>
        <div className="main-content">
          <NoteEditor content={noteContent} onChange={handleNoteChange} />
          <UsersList users={users} />
        </div>
      </div>
    </div>
  );
}

export default App;