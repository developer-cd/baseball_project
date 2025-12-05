import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminStatsRoutes from "./routes/adminStats.js";
import coachStatsRoutes from "./routes/coachStats.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import socketService from "./services/socketService.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

app.use(cors());

// Stripe webhook must be before express.json() middleware
// because Stripe sends raw body for webhook signature verification
app.use("/api/stripe", stripeRoutes);

// JSON body parser for all other routes
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin-stats", adminStatsRoutes);
app.use("/api/coach-stats", coachStatsRoutes);

// Initialize WebSocket
socketService.initialize(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ MongoDB Connected`);
});
