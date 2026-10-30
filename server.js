import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import registrationRoutes from "./routes/registrationRoutes.js";
import sheetsRoutes from "./routes/sheetsRoutes.js";

dotenv.config();

const app = express();

// Enable CORS for frontend applications (e.g. Vite on localhost:5173)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (Powered 100% by Google Apps Script)
app.use("/api/register", registrationRoutes);
app.use("/api/sheets", sheetsRoutes);

// Health check endpoint
app.get("/", (req, res) => {
    return res.json({
        status: "online",
        service: "WIE CODE 2K26 Backend API",
        version: "2.0.0 (Google Apps Script Powered)",
        endpoints: {
            register: "POST /api/register",
            sheets: "GET /api/sheets"
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
