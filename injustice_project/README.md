# Injustice — Web + Mobile + Django

One Django backend, one Expo app that runs as a **website**, **Android app**, and **iPhone app**.

## Architecture

```
User signs up (Expo web or mobile)
        ↓
POST /api/auth/register/  →  Django saves user
        ↓
JWT tokens stored on device (AsyncStorage)
        ↓
User opens app on another platform
        ↓
POST /api/auth/login/  →  same account, same data
```

## Project layout

```
injustice_project/
├── injustice/          # Django backend (existing + REST API)
│   └── HomePage/
│       ├── api_views.py
│       ├── api_urls.py
│       └── serializers.py
├── client/             # Expo (React Native + web)
│   ├── app/            # Routes (Expo Router)
│   ├── screens/        # Screen UI
│   ├── components/     # Shared UI components
│   ├── api/            # API calls (shared web + mobile)
│   ├── shared/         # Validation + types (shared logic)
│   └── assets/
└── requirements.txt
```

## Run the backend

```bash
cd injustice_project/injustice
pip3 install -r ../requirements.txt
python3 manage.py runserver
```

API base: `http://127.0.0.1:8000/api/`

## Run the client (web + mobile)

```bash
cd injustice_project/client
npm install
npx expo start
```

Then press:
- **w** — open website in browser
- **a** — Android emulator
- **i** — iOS simulator

### API URL for physical devices

Set your computer's LAN IP so the phone can reach Django:

```bash
# client/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

Android emulator uses `10.0.2.2` automatically. iOS simulator uses `127.0.0.1`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Sign in, get JWT |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| GET | `/api/posts/` | Feed posts |
| GET | `/api/profile/<username>/` | User profile |

## What's shared between web and mobile

- `api/` — HTTP client, auth, posts
- `shared/validation.ts` — signup/login validation
- `shared/types.ts` — TypeScript types
- `components/` — Button, Input, PostCard (React Native works on web via Expo)

## Next steps

- Add more API endpoints (likes, comments, inbox, debates)
- Migrate Django templates to Expo screens gradually
- Add `expo-image-picker` for photo/video uploads from mobile
