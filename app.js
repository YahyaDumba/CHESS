const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let assignedRoles = {
  w: null,
  b: null,
};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", function (socket) {
  console.log("A user connected:", socket.id);

  // Assign role to socket
  if (!assignedRoles.w) {
    assignedRoles.w = socket.id;
    socket.role = "w";
    socket.emit("playerRole", "w");
  } else if (!assignedRoles.b) {
    assignedRoles.b = socket.id;
    socket.role = "b";
    socket.emit("playerRole", "b");
  } else {
    socket.role = "spectator";
    socket.emit("spectatorRole");
  }

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (assignedRoles.w === socket.id) {
      assignedRoles.w = null;
    } else if (assignedRoles.b === socket.id) {
      assignedRoles.b = null;
    }
  });

  // Handle move
  socket.on("move", (move) => {
    try {
      // Only allow move from correct turn's player
      if (chess.turn() !== socket.role) return;

      const result = chess.move(move);
      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move received:", move);
        socket.emit("Invalid Move", move);
      }
    } catch (err) {
      console.error("Move error:", err);
      socket.emit("Invalid Move", move);
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
