const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid"); // Import UUID
const connectDB = require("./conf/db");
const path = require("node:path");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Restrict to frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

// Note Schema
const noteSchema = new mongoose.Schema({
  roomId: String,
  content: String,
  lastUpdated: { type: Date, default: Date.now },
});
const Note = mongoose.model("Note", noteSchema);

// Socket.io Connection
const usersInRoom = new Map(); // Map to store roomId -> {socketId: username}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("createRoom", async (callback) => {
    const roomId = uuidv4(); // Generate unique room ID
    socket.join(roomId);
    console.log(`Client ${socket.id} created room: ${roomId}`);

    // Initialize user list for the room
    usersInRoom.set(roomId, new Map([[socket.id, "Unnamed"]])); // Default username
    socket.emit("roomCreated", roomId); // Send room ID back to creator
    callback(roomId); // Callback for frontend redirection
  });

  socket.on("joinRoom", async ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room: ${roomId} as ${username}`);

    // Send current note content
    const note = await Note.findOne({ roomId });
    socket.emit("loadNote", note?.content || "");

    // Update users in room
    if (!usersInRoom.has(roomId)) {
      usersInRoom.set(roomId, new Map());
    }
    const roomUsers = usersInRoom.get(roomId);
    roomUsers.set(socket.id, username || "Unnamed");

    // Get all clients in the room
    const clientsInRoom = await io.in(roomId).fetchSockets();
    const userList = Array.from(roomUsers.entries()).map(([id, name]) => ({
      id,
      username: name,
    }));

    // Send full user list to the new user
    socket.emit("updateUsers", userList);

    // Notify existing users of the new join
    socket.to(roomId).emit("userJoined", { id: socket.id, username });
  });

  socket.on("updateNote", async ({ roomId, content }) => {
    console.log(`Updating note in room ${roomId}: ${content}`);
    await Note.findOneAndUpdate(
      { roomId },
      { content, lastUpdated: new Date() },
      { upsert: true }
    );
    socket.to(roomId).emit("noteUpdated", content);
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    for (const [roomId, roomUsers] of usersInRoom) {
      if (roomUsers.has(socket.id)) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          usersInRoom.delete(roomId); // Clean up empty rooms
        } else {
          const userList = Array.from(roomUsers.entries()).map(
            ([id, name]) => ({ id, username: name })
          );
          io.to(roomId).emit("updateUsers", userList);
        }
      }
    }
  });
});

// RESTful Endpoints
app.get("/api/notes/:roomId", async (req, res) => {
  try {
    const note = await Note.findOne({ roomId: req.params.roomId });
    res.json(note || { roomId: req.params.roomId, content: "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
    })
}



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});