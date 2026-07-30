# Trainer Ethan Fitness Tracker

Trainer Ethan is a responsive, multi-user physical activity tracker built with React,
Vinext, and Supabase.

## Features

- Email/password accounts with a display name
- Activity logging with an editable date, activity type, duration, and comments
- Personal seven-day and 30-day activity charts
- Group leaderboard with clickable per-user comparisons
- Personal activity history with edit and delete controls
- Supabase Row Level Security so users can compare group activity while only
  changing their own records

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and publishable key. Never use a secret or service-role
   key in the browser application.

```bash
npm install
npm run dev
```

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

The publishable key is safe to include in browser code when Row Level Security
is enabled and its policies are configured correctly.
