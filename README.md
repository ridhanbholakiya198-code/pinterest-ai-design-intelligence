# Pinterest AI Design Intelligence

Your personal visual memory, understood by AI. 
Connects your Pinterest library, analyzes saved references, extracts design patterns, and uses your entire collection to build better project directions.

## Pinterest Setup Later

This application requires a Pinterest Developer App to import your saved pins.

1. Go to the [Pinterest Developer Portal](https://developers.pinterest.com/).
2. Create a new App.
3. Obtain your `App ID` (Client ID) and `App secret` (Client Secret).
4. Configure the production Redirect URI (e.g. `https://your-domain.com/api/pinterest/callback`).
5. Add the following server-side environment variables in your deployment environment:
   - `PINTEREST_CLIENT_ID`
   - `PINTEREST_CLIENT_SECRET`
   - `PINTEREST_REDIRECT_URI`
   - `SESSION_SECRET` (A strong random string for encrypting cookies)
6. Ensure your Pinterest App has requested the required read scopes (`boards:read`, `pins:read`, `user_accounts:read`).
7. Deploy the application.
8. Click "Connect Pinterest" in the application to test the OAuth flow.
9. Verify that Pins are importing and syncing successfully.

## Architecture

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Express, Node.js
- **Database:** Firebase Admin (Firestore) for durable queues, state, and pin storage
- **AI Processing:** Google Gemini Multimodal Vision API

## Local Development

```bash
npm install
npm run dev
```

For the application to fully work, ensure your Firebase environment configuration (`firebase-applet-config.json`) is present.
