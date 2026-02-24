# Agora.io Setup Guide

This guide will walk you through setting up Agora.io for this video streaming app.

## Step 1: Create an Agora Account

1. Go to [https://console.agora.io](https://console.agora.io)
2. Click **Sign Up** and create a new account
3. Complete the email verification and setup process

## Step 2: Create a New Project

1. After signing in, go to the **Dashboard**
2. Click **Create** or **New Project**
3. Enter a project name (e.g., "Video Streaming Test")
4. Choose **RTC (Real-Time Communication)** as the service
5. Click **Create**

## Step 3: Get Your App ID

1. In the Dashboard, find your newly created project
2. Under the project name, you'll see the **App ID**
3. Click the copy icon next to it to copy the App ID
4. Open `.env.local` (or create it) in your project root
5. Add this line:
   ```
   NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
   ```
6. Paste your App ID after the `=` sign

## Step 4: Get a Temporary Token (Optional but Recommended)

### For Testing Only (Less Secure):
If you're just testing, you can skip this step and only use the App ID.

### For Production-Ready Testing:
1. In the Agora Console, go to **Tools** in the left sidebar
2. Click on **RTC temp token** 
3. Fill in the form:
   - **App ID**: (should be pre-filled)
   - **Channel Name**: `123` (this is the hardcoded channel in our test app)
   - **User ID**: Leave empty or enter any number
   - **Token lifetime**: Set to a reasonable duration (e.g., 24 hours for testing)
4. Click **Generate**
5. Copy the generated token
6. Open `.env.local` and add:
   ```
   NEXT_PUBLIC_AGORA_TEMP_TOKEN=your_token_here
   ```

## Step 5: Configure Environment Variables

Create or update `.env.local` in your project root with:

```env
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
NEXT_PUBLIC_AGORA_TEMP_TOKEN=your_token_optional
NEXT_PUBLIC_AGORA_CHANNEL_ID=123
```

**Note:** Variables starting with `NEXT_PUBLIC_` are exposed to the browser (this is intentional for client-side Agora SDK initialization).

## Step 6: Start the App

1. Make sure you have Node.js 18+ installed
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Step 7: Test the App

### Broadcaster (Mobile Camera)
1. Go to `http://localhost:3000/broadcast` on your mobile device
2. Grant permission to access your camera and microphone when prompted
3. You'll see:
   - Your local camera feed (front camera by default)
   - A button to toggle between front/back camera
   - Mic and camera on/off controls
   - A shareable link you can copy

### Viewer
1. Go to `http://localhost:3000/watch` on another device or browser window
2. You'll see the broadcaster's feed from the channel
3. Connection status will be displayed

### Tips:
- Test on mobile devices for the best experience (camera switching is more useful)
- Use two browser tabs or two devices:
  - One as broadcaster (`/broadcast`)
  - One as viewer (`/watch`)
- The channel ID is hardcoded as `123` in the app for testing simplicity

## Troubleshooting

### "App ID is invalid"
- Make sure you've copied the correct App ID from the Agora Console
- Verify it's in `.env.local` (not `.env.example`)
- Restart your dev server after adding the environment variable

### "Permission denied" for camera/microphone
- Check your browser permissions for camera/microphone access
- On mobile, ensure you've granted permissions to the browser app
- Try in a different browser if the issue persists

### No remote video showing on viewer page
- Make sure the broadcaster is connected and streaming
- Check the browser console for error messages (F12 > Console tab)
- Verify both are on the same channel (hardcoded as `123`)
- Try refreshing the viewer page

### Token expired
- Generate a new token from the Agora Console
- Update `NEXT_PUBLIC_AGORA_TEMP_TOKEN` in `.env.local`
- Restart the dev server

## Understanding the Code Structure

- **`hooks/useAgoraRTC.ts`** - Main Agora SDK initialization and state management
- **`app/broadcast/page.tsx`** - Broadcaster UI and camera controls
- **`app/watch/page.tsx`** - Viewer UI to watch the broadcast
- **`components/VideoContainer.tsx`** - Video element rendering
- **`components/ControlPanel.tsx`** - Media controls (mic, camera toggle)
- **`components/ShareLink.tsx`** - Shareable link display

## Important Security Notes

For production use:
1. **Never hardcode tokens in your code** - Always generate them server-side
2. **Implement proper authentication** - Use Auth.js or Supabase Auth
3. **Use RTMP forwarding** - For larger broadcasts
4. **Implement channel access controls** - Validate who can join which channels

This setup is suitable for testing and development only.

## Next Steps

- Customize the UI to match your design
- Add persistent storage (database) to track channels and users
- Implement server-side token generation for security
- Add more Agora features (recording, live transcoding, etc.)

For more information, visit the [Agora Documentation](https://docs.agora.io/en/).
