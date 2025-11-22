// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
const addressRoutes = require("./routes/addressRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://admindashbord.vercel.app",
  "https://iraxa-fashion-mart.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🔥 Incoming Request Origin:", origin);

      // Allow requests with no origin (like mobile/postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true); // <== FIXED HERE
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);





// --- Body Parsing Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Configuration ---
// Set trust proxy if behind a proxy (Nginx, load balancer, etc.)
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_fallback_secret_key_here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true only in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// --- Passport Initialization ---
app.use(passport.initialize());
app.use(passport.session());

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- API Routes ---
app.use("/api/products", require("./routes/products"));
app.use("/api/auth", require("./routes/auth")(passport));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/users", require("./routes/user"));
app.use("/api/address", addressRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));


// --- Health Check / Test Route ---
app.get("/", (req, res) => {
  res.json({ 
    message: "Server running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// --- 404 Handler ---
app.use((req, res) => {
  console.log("❌ 404 - Route not found:", req.method, req.path);
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:");
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === "production" 
      ? "Internal Server Error" 
      : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 Allowed Origins:`, allowedOrigins.join(", "));
  console.log("\n");
});

// --- Graceful Shutdown ---
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("🔴 HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("🔴 MongoDB connection closed");
      process.exit(0);
    });
  });
});
