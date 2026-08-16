import { Request, Response, Router } from "express";
import { refreshPinterestToken } from "./pinterest";

export const importRouter = Router();

async function getValidAccessToken(req: Request, res: Response): Promise<string> {
  const tokenCookie = req.signedCookies?.pinterest_token;
  if (!tokenCookie) {
    throw new Error("No Pinterest connection");
  }

  const data = JSON.parse(tokenCookie);
  if (!data.access_token) {
    throw new Error("Invalid Pinterest connection");
  }

  // Check if token is expired (with a 5-minute buffer)
  if (data.expires_at && Date.now() > data.expires_at - 300000) {
    return await refreshPinterestToken(req, res, data.refresh_token);
  }

  return data.access_token;
}

// Fetch user's boards
importRouter.get("/boards", async (req: Request, res: Response) => {
  try {
    const accessToken = await getValidAccessToken(req, res);
    
    let allBoards: any[] = [];
    let bookmark: string | null = null;
    
    do {
      const url = new URL("https://api.pinterest.com/v5/boards");
      url.searchParams.append("page_size", "250");
      if (bookmark) url.searchParams.append("bookmark", bookmark);
      
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) throw new Error(`Pinterest API error: ${response.status}`);
      const data = await response.json();
      
      if (data.items) {
        allBoards = allBoards.concat(data.items);
      }
      bookmark = data.bookmark;
    } while (bookmark);

    res.json({ boards: allBoards });
  } catch (err) {
    console.error("Error fetching boards:", err);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// Fetch pins for a board
importRouter.get("/boards/:boardId/pins", async (req: Request, res: Response) => {
  try {
    const accessToken = await getValidAccessToken(req, res);
    const { boardId } = req.params;
    const { bookmark } = req.query;
    
    const url = new URL(`https://api.pinterest.com/v5/boards/${boardId}/pins`);
    url.searchParams.append("page_size", "250");
    if (bookmark) url.searchParams.append("bookmark", String(bookmark));
    
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error(`Pinterest API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching pins:", err);
    res.status(500).json({ error: "Failed to fetch pins" });
  }
});
