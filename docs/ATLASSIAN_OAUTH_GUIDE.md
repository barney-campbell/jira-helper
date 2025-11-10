# Atlassian OAuth 2.0 Login Integration Guide

This document describes how to implement a feature that allows users to log in directly to Atlassian and obtain an API token for authenticated API interactions in the JiraHelper app.

## 1. Register Your App with Atlassian

- Go to the Atlassian developer portal.
  - https://developer.atlassian.com/console/myapps/
- Register a new application.
- Obtain your **Client ID** and **Client Secret**.
- Set a **Redirect URI** (e.g., `http://localhost:PORT/callback`).

## 2. Add a "Log in with Atlassian" Button

- In your React UI (e.g., `IssueSearchView.tsx`), add a button labeled "Log in with Atlassian".
- When clicked, this should initiate the OAuth flow.

## 3. Start the OAuth 2.0 Authorization Flow

- When the button is clicked, open Atlassian’s authorization URL in a new Electron `BrowserWindow`.
- Example URL:
  ```
  https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=YOUR_CLIENT_ID&scope=REQUESTED_SCOPES&redirect_uri=YOUR_REDIRECT_URI&state=RANDOM_STRING&response_type=code&prompt=consent
  ```
- Replace placeholders with your actual values.

## 4. Handle the Redirect and Extract the Code

- Listen for the redirect URI in the `BrowserWindow`.
- When detected, extract the `code` parameter from the URL.

## 5. Exchange the Code for an Access Token

- Use the authorization code to request an access token from Atlassian’s token endpoint:
  ```
  POST https://auth.atlassian.com/oauth/token
  Content-Type: application/json
  {
    "grant_type": "authorization_code",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "AUTHORIZATION_CODE",
    "redirect_uri": "YOUR_REDIRECT_URI"
  }
  ```
- This should be done in the Electron main process or a secure backend.

## 6. Store the Access Token Securely

- Store the token in memory or encrypted storage.
- Never expose the client secret or token to the renderer process.

## 7. Use the Token for API Requests

- Use the access token in the `Authorization: Bearer <token>` header for Atlassian API requests.

## Using PKCE for Secure OAuth (Recommended)

For distributed apps like Electron, use PKCE (Proof Key for Code Exchange) to avoid embedding a client secret. Atlassian supports PKCE for public clients.

### PKCE Flow Steps

1. **Generate a Code Verifier and Code Challenge**
   - Code verifier: a random string (43-128 chars).
   - Code challenge: a base64url-encoded SHA256 hash of the verifier.
   - Example (Node.js):
     ```js
     // Generate code verifier
     const codeVerifier = crypto.randomBytes(64).toString("base64url");
     // Generate code challenge
     const codeChallenge = crypto
       .createHash("sha256")
       .update(codeVerifier)
       .digest("base64")
       .replace(/\+/g, "-")
       .replace(/\//g, "_")
       .replace(/=+$/, "");
     ```

2. **Start Authorization Request**
   - Add `code_challenge` and `code_challenge_method=S256` to the authorization URL:
     ```
     https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=YOUR_CLIENT_ID&scope=REQUESTED_SCOPES&redirect_uri=YOUR_REDIRECT_URI&state=RANDOM_STRING&response_type=code&prompt=consent&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
     ```

3. **Handle Redirect and Extract Code**
   - As before, listen for the redirect URI and extract the `code` parameter.

4. **Exchange Code for Access Token (No Client Secret Needed)**
   - Send a POST request to the token endpoint with the code verifier:
     ```json
     POST https://auth.atlassian.com/oauth/token
     Content-Type: application/json
     {
       "grant_type": "authorization_code",
       "client_id": "YOUR_CLIENT_ID",
       "code": "AUTHORIZATION_CODE",
       "redirect_uri": "YOUR_REDIRECT_URI",
       "code_verifier": "CODE_VERIFIER"
     }
     ```

5. **Store and Use the Access Token**
   - As before, store securely and use for API requests.

### References

- Atlassian PKCE docs: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/#step-1-get-authorization-code
- PKCE spec: https://datatracker.ietf.org/doc/html/rfc7636

## Notes

- Always keep your client secret secure (if used for confidential clients).
- For distributed apps, prefer PKCE and never embed secrets.
- Handle token refresh and expiration as per Atlassian’s documentation.
- For more details, see Atlassian’s official OAuth 2.0 documentation: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
