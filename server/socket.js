const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");

// userId -> socketId, so we know where to deliver a message
const onlineUsers = new Map();

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // tighten to your frontend URL(s) in production
      methods: ["GET", "POST"],
    },
  });

  // Auth handshake: client connects with { auth: { token } }
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret",
      );
      socket.userId = decoded.id || decoded._id || decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit("userOnline", socket.userId);

    socket.on("sendMessage", async ({ receiver, text }) => {
      try {
        const message = await Message.create({
          sender: socket.userId,
          receiver,
          text,
        });

        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", message);
        }
        // echo back to sender so their own UI can confirm/reconcile
        socket.emit("messageSent", message);
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("messageError", { message: "Failed to send message" });
      }
    });

    socket.on("typing", ({ receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { sender: socket.userId });
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      io.emit("userOffline", socket.userId);
    });
  });

  return io;
}

module.exports = initSocket;
