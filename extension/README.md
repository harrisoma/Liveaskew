# Bee by LiveAskew — for Chrome

A side panel with Bee beside every page. It's a client of the LiveAskew MCP connector
(`/api/mcp`), signing in with the same OAuth flow as Claude and ChatGPT, so there is no separate
backend.

- **Today**: the Honey calendar for today, Bee's latest look, and the member's fit, feel and budget.
- **Ask Bee**: styling, or Real Talk on motherhood, relationships, work, or style and self.
  Bee keeps the thread of the conversation.
- **Looks**: Bee's looks, optionally saved only.
- **Right-click on any page**:
  - **Ask Bee about this piece**: on a shop page, an image, a link, or selected text.
  - **Ask Bee what to wear to this**: on selected text, such as an invitation or a calendar
    event.

Permissions:

- `sidePanel`, `contextMenus`
- `identity` (sign-in)
- `storage` (tokens on this browser only)
- Host access to the two LiveAskew addresses only.

No content scripts: it never reads a page unless the member right-clicks it.

## Try it

1. In Chrome, open `chrome://extensions` and turn on **Developer mode**.
2. Choose **Load unpacked** and pick this `extension/` folder.
3. Pin it, click the gold **B**, then **Sign in with LiveAskew**.

The server switch on the sign-in screen defaults to `liveaskew.vercel.app`. Once
`www.liveaskew.com` points at Vercel, change the default in `client.js` (`DEFAULT_SERVER`).

## Publish to the Chrome Web Store

1. Register a developer account at <https://chrome.google.com/webstore/devconsole> (one-time
   US$5 fee).
2. Zip the folder: `cd extension && zip -r ../liveaskew-chrome.zip . -x README.md`.
3. **New item** → upload the zip, then fill in the listing:
   - Category: Lifestyle.
   - Screenshots at 1280×800.
   - Privacy policy: `https://www.liveaskew.com/privacy`.
4. Privacy practices tab:
   - Single purpose: "A personal stylist side panel for LiveAskew members."
   - Data: "Authentication information" and "Website content (only the page the member
     right-clicks)".
   - Not sold, not used for unrelated purposes.
5. Bump `version` in `manifest.json` for every update.
