# Twitch-like App Architecture

## Stack Overview

| Layer | Tech |
|-------|------|
| API Server | Express + TypeScript |
| Auth & DB | Firebase (Auth, Firestore) |
| Video | Agora RTC |
| Mobile | Flutter |

---

## Step 1 — Express Server

### Folder Structure

```
/server
  index.ts
  routes/
    auth.ts       # verify Firebase tokens
    streams.ts    # create/end/list streams
    agora.ts      # generate Agora RTC tokens
  middleware/
    firebaseAuth.ts
```

### Install

```bash
npm i express firebase-admin agora-token cors dotenv
```

### `middleware/firebaseAuth.ts`

```ts
import admin from 'firebase-admin'

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = await admin.auth().verifyIdToken(token)
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}
```

### `routes/agora.ts` — server-side token generation

```ts
import { RtcTokenBuilder, RtcRole } from 'agora-token'

router.post('/token', verifyToken, (req, res) => {
  const { channelName, role } = req.body
  const agoraRole = role === 'broadcaster' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID, APP_CERT, channelName, 0, agoraRole,
    Math.floor(Date.now() / 1000) + 3600
  )
  res.json({ token })
})
```

### `routes/streams.ts` — stream lifecycle

```ts
// POST /streams/start
router.post('/start', verifyToken, async (req, res) => {
  const { title } = req.body
  const ref = await db.collection('streams').add({
    title, hostId: req.user.uid,
    hostName: req.user.name,
    channelName: `stream_${req.user.uid}`,
    isLive: true, viewerCount: 0,
    startedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  res.json({ streamId: ref.id, channelName: `stream_${req.user.uid}` })
})

// POST /streams/:id/end
router.post('/:id/end', verifyToken, async (req, res) => {
  await db.collection('streams').doc(req.params.id).update({ isLive: false })
  res.json({ success: true })
})
```

### `routes/streams.ts` — viewer count

```ts
// POST /streams/:id/viewer?action=join  or  ?action=leave
router.post('/:id/viewer', verifyToken, async (req, res) => {
  const delta = req.query.action === 'join' ? 1 : -1
  await db.collection('streams').doc(req.params.id).update({
    viewerCount: admin.firestore.FieldValue.increment(delta)
  })
  res.json({ success: true })
})
```

---

## Step 2 — Firebase Setup

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. **Firestore** collections:

```
users/{uid}         → displayName, avatarUrl, followersCount
streams/{streamId}  → title, hostId, channelName, isLive, viewerCount, startedAt
follows/{uid_uid}   → followerId, followingId
```

4. **Firestore security rules:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /streams/{id} {
      allow read: if true;
      allow write: if request.auth.uid == resource.data.hostId;
    }
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

---

## Step 3 — Flutter App

### `pubspec.yaml` dependencies

```yaml
dependencies:
  firebase_core: ^2.x
  firebase_auth: ^4.x
  cloud_firestore: ^4.x
  agora_rtc_engine: ^6.x
  http: ^1.x
  provider: ^6.x
```

### Project Structure

```
lib/
  main.dart
  services/
    auth_service.dart
    stream_service.dart
    agora_service.dart
  screens/
    login_screen.dart
    home_screen.dart       # list of live streams from Firestore
    broadcast_screen.dart
    watch_screen.dart
  models/
    stream_model.dart
```

### `services/agora_service.dart` — fetch token from Express

```dart
Future<String> getToken(String channelName, String role) async {
  final idToken = await FirebaseAuth.instance.currentUser!.getIdToken();
  final res = await http.post(
    Uri.parse('$API_URL/agora/token'),
    headers: {
      'Authorization': 'Bearer $idToken',
      'Content-Type': 'application/json'
    },
    body: jsonEncode({'channelName': channelName, 'role': role}),
  );
  return jsonDecode(res.body)['token'];
}
```

### `screens/home_screen.dart` — real-time stream list

```dart
StreamBuilder<QuerySnapshot>(
  stream: FirebaseFirestore.instance
    .collection('streams')
    .where('isLive', isEqualTo: true)
    .snapshots(),
  builder: (ctx, snap) {
    final streams = snap.data?.docs ?? [];
    return ListView.builder(
      itemCount: streams.length,
      itemBuilder: (ctx, i) => StreamTile(stream: streams[i]),
    );
  },
)
```

### `screens/broadcast_screen.dart` — key flow

```dart
// 1. Call POST /streams/start → get channelName + streamId
// 2. Call getToken(channelName, 'broadcaster')
// 3. Init Agora engine, join channel as broadcaster
// 4. Call POST /streams/:id/viewer?action=join (optional for self)
// 5. On leave: call POST /streams/:id/end + leave Agora channel
```

### `screens/watch_screen.dart` — key flow

```dart
// 1. Call getToken(stream.channelName, 'viewer')
// 2. Init Agora engine, join as audience
// 3. Call POST /streams/:id/viewer?action=join
// 4. Listen to Firestore stream doc for isLive changes
// 5. If isLive → false, show "Stream ended" and leave
// 6. On leave: call POST /streams/:id/viewer?action=leave
```

---

## Step 4 — Run Order

1. Start Express server: `ts-node server/index.ts`
2. Flutter app authenticates with Firebase → receives `idToken`
3. All API calls include `Authorization: Bearer <idToken>`
4. Express verifies token with Firebase Admin SDK → processes request
5. Agora tokens are generated server-side only — never hardcoded in Flutter

---

## What to Skip for Non-Production

- Agora webhooks for exact viewer count (use Firestore increments instead)
- RTMP fallback / HLS recording
- Payment / subscription gating
- CDN for stream thumbnails
- Rate limiting / abuse protection
- Refresh token rotation
