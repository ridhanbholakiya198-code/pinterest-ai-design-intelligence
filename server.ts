import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { pinterestRouter } from "./server/pinterest";
import { importRouter } from "./server/import";
import { geminiRouter } from "./server/gemini";

// Middleware for auth
const checkAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  let SESSION_SECRET = process.env.SESSION_SECRET;
  
  if (!SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET environment variable is missing. Generating a random fallback secret. Sessions will reset on restart.");
    SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser(SESSION_SECRET));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Auth Routes Foundation
  app.get("/api/auth/session", (req, res) => {
    const sessionId = req.signedCookies?.session_id;
    const hasPinterestToken = !!req.signedCookies?.pinterest_token;
    if (sessionId) {
      res.json({ authenticated: true, userId: sessionId, pinterestConnected: hasPinterestToken });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    // Basic dev login for the purpose of establishing a session
    // In production, you'd use a real auth mechanism
    const sessionId = "dev_user_" + Date.now();
    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, userId: sessionId });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("session_id");
    res.json({ success: true });
  });

  // Mount Pinterest Router
  app.use("/api/pinterest", pinterestRouter);
  
  // Mount Import Router
  app.use("/api/import", importRouter);
  
  // Mount Gemini Router
  app.use("/api/gemini", geminiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
