# Real-Time Notifications — Web (Next.js + Redux Toolkit + socket.io-client)

A notification bell with a **live unread badge** and dropdown list. New
notifications arrive over a WebSocket and update the UI instantly — no refetch.

## Layout

```
src/
├── app/
│   ├── layout.tsx        # wraps the app in the Redux <Providers>
│   └── page.tsx          # bell + demo trigger buttons
├── components/
│   ├── NotificationBell.tsx  # badge + dropdown + mark read
│   └── DemoControls.tsx      # POST a notification to yourself (demo)
├── hooks/
│   └── useNotificationsSocket.ts  # socket → inject live events into RTK cache  ← the core
├── store/
│   ├── notificationsApi.ts   # RTK Query: getNotifications / getUnreadCount / markRead
│   ├── store.ts
│   └── Providers.tsx
└── types.ts
```

## How live updates work

`useNotificationsSocket` opens a socket (`auth: { token: userId }`) and, on each
`notification` event, writes **directly into the RTK Query cache** with
`notificationsApi.util.updateQueryData` — prepending to the list and bumping the
unread count. No polling, no refetch: the badge and list re-render immediately.
`markRead` is a normal mutation that invalidates both caches.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3004
npm run dev                    # http://localhost:3000
```

The API + WebSocket server (in `../server`) must be running. Click a **Simulate**
button and watch the bell update live; open a second tab for multi-device delivery.

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
