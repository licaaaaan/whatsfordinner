# What's for Dinner — Meal Planning App Design

**Date:** 2026-05-17  
**Status:** Approved

---

## Overview

A personal meal planning web app that lets a user configure a weekly meal plan, browse and approve AI-matched recipe suggestions, and generate a scaled shopping list. Taste preferences are tracked over time and used to bias future recommendations.

Primary user: personal use, with the ability to share with friends and family (each with their own account and taste profile).

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API routes | Next.js 14 (App Router) |
| Auth + Database | Supabase (PostgreSQL + RLS) |
| Deployment | Vercel (free tier) |
| Recipe discovery | TheMealDB API (free, no key required) |
| Ingredient details | Edamam Recipe API (free tier, called on approval only) |

**Why this split:** TheMealDB is used for browsing/suggesting recipes (unlimited, free). Edamam is called only when the user approves a meal, so the 100 req/day free quota covers typical usage easily (approving 5–7 meals per session).

---

## Core User Flow

1. User signs up or logs in (Supabase Auth — email/password or magic link)
2. User configures a new meal plan: number of meals (1–7), number of people (1–10), cuisine type
3. App fetches matching recipes from TheMealDB, biased by the user's saved taste profile
4. User reviews one recipe card at a time — ✓ Keep or ✗ Skip
5. Once all meals reviewed, Edamam is called for each approved meal to get ingredient quantities
6. Shopping list is generated: ingredients merged, scaled to number of people, grouped by category
7. Taste profile updates silently: approved meals increment cuisine score, skipped meals decrement slightly

---

## Data Model

### `meal_plans`
Represents one planning session.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| num_meals | integer | 1–7 |
| num_people | integer | 1–10 |
| cuisine_type | text | e.g. "Italian", "Mexican", "Surprise me" |
| created_at | timestamp | |

### `meal_plan_items`
Individual recipe decisions within a plan.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| meal_plan_id | uuid | Foreign key to meal_plans |
| recipe_id | text | TheMealDB meal ID |
| recipe_title | text | |
| recipe_image | text | URL |
| status | text | "approved" or "skipped" |

### `shopping_lists`
Generated after approvals are complete.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| meal_plan_id | uuid | Foreign key to meal_plans (unique) |
| items | jsonb | Array of `{name, amount, unit, category}` |
| created_at | timestamp | |

### `taste_profiles`
One row per user, updated after each session.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users (unique) |
| cuisine_scores | jsonb | `{"italian": 8, "mexican": 3, ...}` |
| liked_recipe_ids | text[] | TheMealDB IDs of approved recipes |
| disliked_recipe_ids | text[] | TheMealDB IDs of skipped recipes |

**Taste profile logic:** Each approved meal increments the cuisine score by 1. Each skipped meal decrements by 0.5 (floor 0). Future recipe fetches sort candidates by cuisine score descending and exclude previously disliked recipe IDs.

---

## Pages & Routes

| Route | Purpose |
|---|---|
| `/` | Landing page. CTA to start planning. If logged in, shows recent plans. |
| `/plan/new` | Configuration form: # meals, # people, cuisine type. "Generate" button. |
| `/plan/[id]/review` | One recipe card at a time. ✓ Keep / ✗ Skip. Progress indicator. Auto-advances to shopping list when done. |
| `/plan/[id]/shopping-list` | Ingredients grouped by category, scaled to # of people. Checkboxes to tick off while shopping. "New Plan" button. |
| `/profile` | Taste profile summary: top cuisines as bar chart, total meals planned, link to past plans. |

---

## API Routes (Next.js)

| Route | Method | Purpose |
|---|---|---|
| `/api/plan` | POST | Create a new meal plan, fetch TheMealDB suggestions |
| `/api/plan/[id]/decision` | POST | Record keep/skip decision, update taste profile |
| `/api/plan/[id]/shopping-list` | POST | Trigger Edamam calls for approved meals, generate shopping list |
| `/api/profile` | GET | Fetch taste profile for current user |

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| TheMealDB returns fewer recipes than requested | Show however many returned, note the shortfall to user |
| Edamam quota exceeded | Show shopping list with ingredient names only (no quantities), prompt user to try again later |
| User accesses another user's plan | Redirect to `/` (enforced by Supabase RLS) |
| Slow API response on review page | Show loading skeleton per card, not full-page block |

---

## Security

- Supabase Row Level Security (RLS) on all tables: users can only read/write their own rows.
- Edamam API key stored in environment variables, never exposed to the client.
- All API routes validate the authenticated session before querying the database.

---

## Out of Scope (v1)

- Nutritional goal tracking
- Dietary restriction filters (vegetarian, gluten-free, etc.)
- Sharing a meal plan with another user
- Native mobile app
- Recipe import from URL
