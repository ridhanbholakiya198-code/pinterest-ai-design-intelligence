import { Request, Response, Router } from "express";
import crypto from "crypto";

export const pinterestRouter = Router();

// In a real production setup, these must be set in environment variables.
const CLIENT_ID = process.env.PINTEREST_CLIENT_ID;
const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET;
const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn("WARNING: Pinterest API credentials are not fully configured in environment variables.");
}

export async function refreshPinterestToken(req: Request, res: Response, refreshToken: string) {
  const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "boards:read,pins:read,user_accounts:read"
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const tokenData = await response.json();
  const newRefreshToken = tokenData.refresh_token || refreshToken;
  
  res.cookie("pinterest_token", JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: newRefreshToken,
    expires_at: Date.now() + (tokenData.expires_in * 1000)
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  return tokenData.access_token;
}

pinterestRouter.get("/connect", (req: Request, res: Response) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Must be logged in to connect Pinterest" });
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");
  
  // Store state in a short-lived signed cookie to verify upon callback
  res.cookie("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const scopes = "boards:read,pins:read,user_accounts:read";
  const authUrl = `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI || '')}&response_type=code&scope=${scopes}&state=${state}`;
  
  res.redirect(authUrl);
});

pinterestRouter.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  const storedState = req.signedCookies?.pinterest_oauth_state;
  const sessionId = req.signedCookies?.session_id;

  if (!sessionId) {
    return res.status(401).send("Unauthorized session");
  }

  if (error) {
    return res.redirect("/settings?error=" + encodeURIComponent(String(error)));
  }

  if (!state || state !== storedState) {
    return res.status(400).send("State mismatch - CSRF validation failed");
  }

  // Clear the state cookie
  res.clearCookie("pinterest_oauth_state");

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("Pinterest token exchange failed:", errorBody);
      return res.redirect("/settings?error=token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();
    
    // tokenData contains access_token, refresh_token, expires_in, scope
    res.cookie("pinterest_token", JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/settings?success=pinterest_connected");
  } catch (err) {
    console.error("Pinterest callback error:", err);
    res.redirect("/settings?error=internal_server_error");
  }
});

pinterestRouter.post("/disconnect", async (req: Request, res: Response) => {
  res.clearCookie("pinterest_token");
  res.json({ success: true });
});
