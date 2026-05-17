# What's for Dinner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a meal planning web app where users configure weekly meals by cuisine, review recipe cards one at a time, and generate a scaled shopping list — with taste profiles that improve recommendations over time.

**Architecture:** Next.js 14 (App Router) with Supabase for auth and PostgreSQL. TheMealDB discovers recipes for free (no key needed); Edamam fetches ingredient quantities only for approved meals, preserving the free-tier quota. All DB rows are user-scoped via Supabase Row Level Security.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, `@supabase/ssr`, Jest + React Testing Library, TheMealDB API (no key), Edamam Recipe API v2 (env-keyed, server-only), Vercel

---

## File Map

```
whatsfordinner/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                             # Landing — CTA + recent plans
│   ├── login/
│   │   └── page.tsx                         # Email/password + magic link
│   ├── plan/
│   │   ├── new/
│   │   │   ├── page.tsx                     # Server: fetch areas, render PlanForm
│   │   │   └── PlanForm.tsx                 # Client: config form
│   │   └── [id]/
│   │       ├── review/
│   │       │   └── page.tsx                 # Recipe card review flow
│   │       └── shopping-list/
│   │           └── page.tsx                 # Shopping list display
│   ├── profile/
│   │   └── page.tsx                         # Taste profile + past plans
│   └── api/
│       ├── plan/
│       │   ├── route.ts                     # POST /api/plan
│       │   └── [id]/
│       │       ├── items/
│       │       │   └── route.ts             # GET /api/plan/[id]/items (used by review page)
│       │       ├── decision/
│       │       │   └── route.ts             # POST /api/plan/[id]/decision
│       │       └── shopping-list/
│       │           └── route.ts             # POST+GET /api/plan/[id]/shopping-list
│       └── profile/
│           └── route.ts                     # GET /api/profile
├── components/
│   ├── RecipeCard.tsx
│   ├── ShoppingList.tsx
│   └── CuisineChart.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                        # Browser Supabase client
│   │   └── server.ts                        # Server Supabase client (cookies)
│   ├── themealdb.ts                         # TheMealDB API functions
│   ├── edamam.ts                            # Edamam API + mergeIngredients
│   └── taste-profile.ts                    # Pure scoring functions
├── types/
│   └── index.ts                            # Shared TypeScript types
├── middleware.ts                            # Auth-protect /plan and /profile
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── __tests__/
│   ├── lib/
│   │   ├── taste-profile.test.ts
│   │   ├── themealdb.test.ts
│   │   └── edamam.test.ts
│   └── components/
│       ├── RecipeCard.test.tsx
│       └── ShoppingList.test.tsx
├── jest.config.ts
├── jest.setup.ts
└── .env.local
```

---

### Task 1: Scaffold project and configure testing

**Files:**
- Create: entire project (via create-next-app)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js project with Tailwind**

Run from `C:\Users\lican\OneDrive\Desktop\whatsfordinner`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected output: `Success! Created whatsfordinner` and a full Next.js project structure.

- [ ] **Step 2: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected: packages appear in `node_modules/@supabase`.

- [ ] **Step 3: Install testing packages**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 4: Add test scripts to package.json**

Open `package.json` and add to the `"scripts"` section:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Write jest.config.ts**

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 6: Write jest.setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EDAMAM_APP_ID=your_edamam_app_id
EDAMAM_APP_KEY=your_edamam_app_key
```

Leave values as placeholders for now — filled in after Supabase and Edamam accounts are created in Task 3.

- [ ] **Step 8: Run tests to confirm setup works**

```bash
npm test
```

Expected: `No tests found` — no error, just a warning that no test files exist yet.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Supabase and Jest"
```

---

### Task 2: TypeScript types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Write shared types**

```ts
// types/index.ts

export type MealPlan = {
  id: string
  user_id: string
  num_meals: number
  num_people: number
  cuisine_type: string
  created_at: string
}

export type MealPlanItem = {
  id: string
  meal_plan_id: string
  recipe_id: string
  recipe_title: string
  recipe_image: string
  display_order: number
  status: 'pending' | 'approved' | 'skipped'
}

export type ShoppingItem = {
  name: string
  amount: number
  unit: string
  category: string
}

export type ShoppingList = {
  id: string
  meal_plan_id: string
  items: ShoppingItem[]
  created_at: string
}

export type TasteProfile = {
  id: string
  user_id: string
  cuisine_scores: Record<string, number>
  liked_recipe_ids: string[]
  disliked_recipe_ids: string[]
}

export type TheMealDBMeal = {
  idMeal: string
  strMeal: string
  strMealThumb: string
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Database schema and Supabase setup

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create a Supabase project**

1. Go to https://supabase.com and sign in.
2. Click **New project**, name it `whatsfordinner`, choose a region, set a database password.
3. Once created, go to **Project Settings → API**.
4. Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
5. Copy **anon public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

- [ ] **Step 2: Write the SQL migration**

```sql
-- supabase/migrations/001_initial_schema.sql

create extension if not exists "uuid-ossp";

create table meal_plans (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  num_meals   integer     not null check (num_meals between 1 and 7),
  num_people  integer     not null check (num_people between 1 and 10),
  cuisine_type text       not null,
  created_at  timestamptz not null default now()
);

create table meal_plan_items (
  id            uuid    primary key default uuid_generate_v4(),
  meal_plan_id  uuid    not null references meal_plans(id) on delete cascade,
  recipe_id     text    not null,
  recipe_title  text    not null,
  recipe_image  text    not null,
  display_order integer not null,
  status        text    not null default 'pending'
                        check (status in ('pending', 'approved', 'skipped'))
);

create table shopping_lists (
  id           uuid        primary key default uuid_generate_v4(),
  meal_plan_id uuid        not null unique references meal_plans(id) on delete cascade,
  items        jsonb       not null default '[]',
  created_at   timestamptz not null default now()
);

create table taste_profiles (
  id                  uuid    primary key default uuid_generate_v4(),
  user_id             uuid    not null unique references auth.users(id) on delete cascade,
  cuisine_scores      jsonb   not null default '{}',
  liked_recipe_ids    text[]  not null default '{}',
  disliked_recipe_ids text[]  not null default '{}'
);

-- RLS
alter table meal_plans        enable row level security;
alter table meal_plan_items   enable row level security;
alter table shopping_lists    enable row level security;
alter table taste_profiles    enable row level security;

create policy "own meal_plans"
  on meal_plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own meal_plan_items"
  on meal_plan_items for all
  using  (meal_plan_id in (select id from meal_plans where user_id = auth.uid()))
  with check (meal_plan_id in (select id from meal_plans where user_id = auth.uid()));

create policy "own shopping_lists"
  on shopping_lists for all
  using  (meal_plan_id in (select id from meal_plans where user_id = auth.uid()))
  with check (meal_plan_id in (select id from meal_plans where user_id = auth.uid()));

create policy "own taste_profiles"
  on taste_profiles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 3: Run migration in Supabase**

1. In the Supabase dashboard, go to **SQL Editor**.
2. Paste the full contents of `001_initial_schema.sql`.
3. Click **Run**.
4. Expected: `Success. No rows returned` for each statement.

- [ ] **Step 4: Enable email auth in Supabase**

Go to **Authentication → Providers → Email** and confirm it is enabled. Enable **Magic Link** too.

- [ ] **Step 5: Commit migration file**

```bash
git add supabase/
git commit -m "feat: add database schema and RLS policies"
```

---

### Task 4: Supabase clients and auth middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Write browser Supabase client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write server Supabase client**

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Write auth middleware**

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected =
    pathname.startsWith('/plan') || pathname.startsWith('/profile')

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase clients and auth middleware"
```

---

### Task 5: Login page

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Write login page**

```tsx
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'magic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('signin')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({ email })
      setMessage(error ? error.message : 'Check your email for a magic link!')
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      setMessage(error ? error.message : 'Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/')
    }
    setLoading(false)
  }

  const modeLabels: Record<Mode, string> = {
    signin: 'Sign In',
    signup: 'Sign Up',
    magic: 'Magic Link',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center text-orange-600">
          What's for Dinner
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">Plan your week, stress-free.</p>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-full p-1">
          {(['signin', 'signup', 'magic'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${
                mode === m
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {mode !== 'magic' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : modeLabels[mode]}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/login/
git commit -m "feat: add login page with sign-in, sign-up, and magic link"
```

---

### Task 6: TheMealDB client

**Files:**
- Create: `lib/themealdb.ts`
- Create: `__tests__/lib/themealdb.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/lib/themealdb.test.ts
import { pickMeals } from '@/lib/themealdb'
import type { TheMealDBMeal } from '@/types'

const meals: TheMealDBMeal[] = [
  { idMeal: '1', strMeal: 'Pasta Carbonara', strMealThumb: 'https://img/1.jpg' },
  { idMeal: '2', strMeal: 'Tacos al Pastor',  strMealThumb: 'https://img/2.jpg' },
  { idMeal: '3', strMeal: 'Margherita Pizza', strMealThumb: 'https://img/3.jpg' },
  { idMeal: '4', strMeal: 'Risotto',           strMealThumb: 'https://img/4.jpg' },
]

test('pickMeals excludes disliked recipe IDs', () => {
  const picked = pickMeals(meals, 4, ['2'])
  expect(picked.every(m => m.idMeal !== '2')).toBe(true)
})

test('pickMeals returns at most count meals', () => {
  const picked = pickMeals(meals, 2, [])
  expect(picked.length).toBeLessThanOrEqual(2)
})

test('pickMeals returns all meals when count exceeds available', () => {
  const picked = pickMeals(meals, 10, [])
  expect(picked.length).toBe(4)
})

test('pickMeals returns empty array when all meals are disliked', () => {
  const picked = pickMeals(meals, 3, ['1', '2', '3', '4'])
  expect(picked).toEqual([])
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="themealdb"
```

Expected: `Cannot find module '@/lib/themealdb'`

- [ ] **Step 3: Implement TheMealDB client**

```ts
// lib/themealdb.ts
import type { TheMealDBMeal } from '@/types'

const BASE = 'https://www.themealdb.com/api/json/v1/1'

export async function fetchAreas(): Promise<string[]> {
  const res = await fetch(`${BASE}/list.php?a=list`)
  const data = await res.json()
  return (data.meals as { strArea: string }[]).map(m => m.strArea).sort()
}

export async function fetchMealsByArea(area: string): Promise<TheMealDBMeal[]> {
  const res = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`)
  const data = await res.json()
  return (data.meals as TheMealDBMeal[]) ?? []
}

export async function fetchRandomArea(): Promise<string> {
  const areas = await fetchAreas()
  return areas[Math.floor(Math.random() * areas.length)]
}

export function pickMeals(
  meals: TheMealDBMeal[],
  count: number,
  dislikedIds: string[]
): TheMealDBMeal[] {
  const eligible = meals.filter(m => !dislikedIds.includes(m.idMeal))
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="themealdb"
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/themealdb.ts __tests__/lib/themealdb.test.ts
git commit -m "feat: add TheMealDB client with pickMeals (TDD)"
```

---

### Task 7: Taste profile lib

**Files:**
- Create: `lib/taste-profile.ts`
- Create: `__tests__/lib/taste-profile.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/lib/taste-profile.test.ts
import { updateTasteProfile, getTopCuisines } from '@/lib/taste-profile'
import type { TasteProfile } from '@/types'

const base: TasteProfile = {
  id: 'p1',
  user_id: 'u1',
  cuisine_scores: { italian: 3, mexican: 1 },
  liked_recipe_ids: [],
  disliked_recipe_ids: [],
}

test('approved meal increments cuisine score by 1', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'approved')
  expect(update.cuisine_scores!['italian']).toBe(4)
})

test('approved meal adds recipe to liked_recipe_ids', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'approved')
  expect(update.liked_recipe_ids).toContain('meal1')
})

test('approved meal does not duplicate liked_recipe_ids', () => {
  const profile = { ...base, liked_recipe_ids: ['meal1'] }
  const update = updateTasteProfile(profile, 'Italian', 'meal1', 'approved')
  expect(update.liked_recipe_ids!.filter(id => id === 'meal1').length).toBe(1)
})

test('skipped meal decrements cuisine score by 0.5', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'skipped')
  expect(update.cuisine_scores!['italian']).toBe(2.5)
})

test('skipped meal floors score at 0', () => {
  const profile = { ...base, cuisine_scores: { italian: 0.3 } }
  const update = updateTasteProfile(profile, 'Italian', 'meal1', 'skipped')
  expect(update.cuisine_scores!['italian']).toBe(0)
})

test('skipped meal adds recipe to disliked_recipe_ids', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'skipped')
  expect(update.disliked_recipe_ids).toContain('meal1')
})

test('new cuisine initialises at 1 when approved', () => {
  const update = updateTasteProfile(base, 'Chinese', 'meal2', 'approved')
  expect(update.cuisine_scores!['chinese']).toBe(1)
})

test('getTopCuisines returns top N sorted descending', () => {
  const scores = { italian: 8, mexican: 3, chinese: 5 }
  const top = getTopCuisines(scores, 2)
  expect(top).toEqual([
    { cuisine: 'italian', score: 8 },
    { cuisine: 'chinese', score: 5 },
  ])
})

test('getTopCuisines returns all when limit exceeds entries', () => {
  const scores = { italian: 8 }
  const top = getTopCuisines(scores, 5)
  expect(top.length).toBe(1)
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="taste-profile"
```

Expected: `Cannot find module '@/lib/taste-profile'`

- [ ] **Step 3: Implement taste profile lib**

```ts
// lib/taste-profile.ts
import type { TasteProfile } from '@/types'

export function updateTasteProfile(
  profile: TasteProfile,
  cuisineType: string,
  recipeId: string,
  decision: 'approved' | 'skipped'
): Partial<TasteProfile> {
  const cuisine = cuisineType.toLowerCase()
  const scores = { ...profile.cuisine_scores }

  if (decision === 'approved') {
    scores[cuisine] = (scores[cuisine] ?? 0) + 1
    return {
      cuisine_scores: scores,
      liked_recipe_ids: [...new Set([...profile.liked_recipe_ids, recipeId])],
    }
  } else {
    scores[cuisine] = Math.max(0, (scores[cuisine] ?? 0) - 0.5)
    return {
      cuisine_scores: scores,
      disliked_recipe_ids: [...new Set([...profile.disliked_recipe_ids, recipeId])],
    }
  }
}

export function getTopCuisines(
  scores: Record<string, number>,
  limit = 5
): Array<{ cuisine: string; score: number }> {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([cuisine, score]) => ({ cuisine, score }))
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="taste-profile"
```

Expected: `9 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/taste-profile.ts __tests__/lib/taste-profile.test.ts
git commit -m "feat: add taste profile scoring lib (TDD)"
```

---

### Task 8: Edamam client

**Files:**
- Create: `lib/edamam.ts`
- Create: `__tests__/lib/edamam.test.ts`

- [ ] **Step 1: Create an Edamam account and get credentials**

1. Go to https://developer.edamam.com and sign up for a free account.
2. Create a **Recipe Search API** application.
3. Copy the **Application ID** → paste as `EDAMAM_APP_ID` in `.env.local`.
4. Copy the **Application Key** → paste as `EDAMAM_APP_KEY` in `.env.local`.

- [ ] **Step 2: Write failing tests for mergeIngredients (pure function)**

```ts
// __tests__/lib/edamam.test.ts
import { mergeIngredients } from '@/lib/edamam'
import type { EdamamIngredient } from '@/lib/edamam'

const oil: EdamamIngredient = { food: 'olive oil', quantity: 1, measure: 'tbsp', foodCategory: 'Oils' }
const garlic: EdamamIngredient = { food: 'garlic', quantity: 2, measure: 'clove', foodCategory: 'Vegetables' }
const moreOil: EdamamIngredient = { food: 'olive oil', quantity: 2, measure: 'tbsp', foodCategory: 'Oils' }

test('mergeIngredients sums same ingredient across recipes', () => {
  const result = mergeIngredients([[oil], [moreOil]])
  const found = result.find(i => i.name === 'olive oil')
  expect(found?.amount).toBe(3)
})

test('mergeIngredients keeps distinct ingredients separate', () => {
  const result = mergeIngredients([[oil], [garlic]])
  expect(result.length).toBe(2)
})

test('mergeIngredients returns empty array for empty input', () => {
  expect(mergeIngredients([])).toEqual([])
})

test('mergeIngredients sorts by category', () => {
  const result = mergeIngredients([[oil, garlic]])
  expect(result[0].category).toBe('Oils')
  expect(result[1].category).toBe('Vegetables')
})
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="edamam"
```

Expected: `Cannot find module '@/lib/edamam'`

- [ ] **Step 4: Implement Edamam client**

```ts
// lib/edamam.ts
import type { ShoppingItem } from '@/types'

export type EdamamIngredient = {
  food: string
  quantity: number
  measure: string | null
  foodCategory: string
}

const BASE = 'https://api.edamam.com/api/recipes/v2'

export async function fetchIngredients(
  recipeTitle: string,
  numPeople: number
): Promise<EdamamIngredient[]> {
  const appId = process.env.EDAMAM_APP_ID
  const appKey = process.env.EDAMAM_APP_KEY

  const url = new URL(BASE)
  url.searchParams.set('type', 'public')
  url.searchParams.set('q', recipeTitle)
  url.searchParams.set('app_id', appId!)
  url.searchParams.set('app_key', appKey!)

  const res = await fetch(url.toString())

  if (res.status === 401 || res.status === 429) {
    return []
  }

  const data = await res.json()
  const hit = data.hits?.[0]
  if (!hit) return []

  const recipe = hit.recipe
  const servings: number = recipe.yield ?? 4
  const scale = numPeople / servings

  return (recipe.ingredients ?? []).map((ing: Record<string, unknown>) => ({
    food: ing.food as string,
    quantity: Math.round(((ing.quantity as number) ?? 1) * scale * 10) / 10,
    measure: (ing.measure as string | null) ?? null,
    foodCategory: (ing.foodCategory as string) ?? 'Other',
  }))
}

export function mergeIngredients(
  allIngredients: EdamamIngredient[][]
): ShoppingItem[] {
  const merged: Record<string, ShoppingItem> = {}

  for (const ingredients of allIngredients) {
    for (const ing of ingredients) {
      const key = `${ing.food}__${ing.measure ?? 'unit'}__${ing.foodCategory}`
      if (merged[key]) {
        merged[key].amount =
          Math.round((merged[key].amount + ing.quantity) * 10) / 10
      } else {
        merged[key] = {
          name: ing.food,
          amount: ing.quantity,
          unit: ing.measure ?? 'unit',
          category: ing.foodCategory,
        }
      }
    }
  }

  return Object.values(merged).sort((a, b) =>
    a.category.localeCompare(b.category)
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="edamam"
```

Expected: `4 passed`

- [ ] **Step 6: Commit**

```bash
git add lib/edamam.ts __tests__/lib/edamam.test.ts
git commit -m "feat: add Edamam client with mergeIngredients (TDD)"
```

---

### Task 9: POST /api/plan route

**Files:**
- Create: `app/api/plan/route.ts`

- [ ] **Step 1: Write the route handler**

```ts
// app/api/plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAreas, fetchMealsByArea, fetchRandomArea, pickMeals } from '@/lib/themealdb'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    num_meals: number
    num_people: number
    cuisine_type: string
  }

  const { num_meals, num_people, cuisine_type } = body

  if (!num_meals || !num_people || !cuisine_type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Resolve cuisine area (random if "surprise")
  const area =
    cuisine_type === 'surprise' ? await fetchRandomArea() : cuisine_type

  // Fetch user taste profile to exclude disliked recipes
  const { data: profileRow } = await supabase
    .from('taste_profiles')
    .select('disliked_recipe_ids')
    .eq('user_id', user.id)
    .single()

  const dislikedIds: string[] = profileRow?.disliked_recipe_ids ?? []

  // Fetch recipes from TheMealDB and pick
  const allMeals = await fetchMealsByArea(area)
  const chosen = pickMeals(allMeals, num_meals, dislikedIds)

  // Create meal plan row
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({ user_id: user.id, num_meals, num_people, cuisine_type: area })
    .select()
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }

  // Insert meal_plan_items
  const items = chosen.map((meal, i) => ({
    meal_plan_id: plan.id,
    recipe_id: meal.idMeal,
    recipe_title: meal.strMeal,
    recipe_image: meal.strMealThumb,
    display_order: i,
    status: 'pending',
  }))

  const { error: itemsError } = await supabase
    .from('meal_plan_items')
    .insert(items)

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to save items' }, { status: 500 })
  }

  return NextResponse.json({ planId: plan.id })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/plan/route.ts
git commit -m "feat: add POST /api/plan route"
```

---

### Task 10: /plan/new page and PlanForm

**Files:**
- Create: `app/plan/new/page.tsx`
- Create: `app/plan/new/PlanForm.tsx`

- [ ] **Step 1: Write the server page**

```tsx
// app/plan/new/page.tsx
import { fetchAreas } from '@/lib/themealdb'
import PlanForm from './PlanForm'

export default async function PlanNewPage() {
  const areas = await fetchAreas()
  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <PlanForm areas={areas} />
    </main>
  )
}
```

- [ ] **Step 2: Write the client PlanForm**

```tsx
// app/plan/new/PlanForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlanForm({ areas }: { areas: string[] }) {
  const [numMeals, setNumMeals] = useState(5)
  const [numPeople, setNumPeople] = useState(2)
  const [cuisine, setCuisine] = useState('surprise')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        num_meals: numMeals,
        num_people: numPeople,
        cuisine_type: cuisine,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push(`/plan/${data.planId}/review`)
    } else {
      alert(data.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-orange-600 mb-1">Plan your week</h1>
      <p className="text-gray-500 text-sm mb-6">Tell us what you're in the mood for.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of meals
          </label>
          <input
            type="range"
            min={1}
            max={7}
            value={numMeals}
            onChange={e => setNumMeals(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="text-center text-orange-600 font-bold text-lg mt-1">
            {numMeals} meal{numMeals !== 1 ? 's' : ''}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of people
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={numPeople}
            onChange={e => setNumPeople(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="text-center text-orange-600 font-bold text-lg mt-1">
            {numPeople} {numPeople === 1 ? 'person' : 'people'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuisine
          </label>
          <select
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="surprise">Surprise me!</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate my meal plan →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/plan/new/
git commit -m "feat: add /plan/new configuration page"
```

---

### Task 11: POST /api/plan/[id]/decision route

**Files:**
- Create: `app/api/plan/[id]/decision/route.ts`

- [ ] **Step 1: Write the route handler**

```ts
// app/api/plan/[id]/decision/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTasteProfile } from '@/lib/taste-profile'
import type { TasteProfile } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, decision } = await request.json() as {
    itemId: string
    decision: 'approved' | 'skipped'
  }

  // Update the item status
  const { data: item, error: itemError } = await supabase
    .from('meal_plan_items')
    .update({ status: decision })
    .eq('id', itemId)
    .eq('meal_plan_id', planId)
    .select('recipe_id')
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Fetch the plan's cuisine type
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('cuisine_type')
    .eq('id', planId)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Upsert taste profile
  const { data: existingProfile } = await supabase
    .from('taste_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const baseProfile: TasteProfile = existingProfile ?? {
    id: '',
    user_id: user.id,
    cuisine_scores: {},
    liked_recipe_ids: [],
    disliked_recipe_ids: [],
  }

  const profileUpdate = updateTasteProfile(
    baseProfile,
    plan.cuisine_type,
    item.recipe_id,
    decision
  )

  await supabase.from('taste_profiles').upsert({
    user_id: user.id,
    ...profileUpdate,
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/plan/
git commit -m "feat: add POST /api/plan/[id]/decision route"
```

---

### Task 12: RecipeCard component

**Files:**
- Create: `components/RecipeCard.tsx`
- Create: `__tests__/components/RecipeCard.test.tsx`

- [ ] **Step 1: Write failing render test**

```tsx
// __tests__/components/RecipeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import RecipeCard from '@/components/RecipeCard'

const props = {
  title: 'Pasta Carbonara',
  image: 'https://img/pasta.jpg',
  current: 1,
  total: 5,
  onKeep: jest.fn(),
  onSkip: jest.fn(),
}

test('renders recipe title', () => {
  render(<RecipeCard {...props} />)
  expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
})

test('renders progress indicator', () => {
  render(<RecipeCard {...props} />)
  expect(screen.getByText('1 of 5')).toBeInTheDocument()
})

test('calls onKeep when Keep button clicked', () => {
  render(<RecipeCard {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /keep/i }))
  expect(props.onKeep).toHaveBeenCalledTimes(1)
})

test('calls onSkip when Skip button clicked', () => {
  render(<RecipeCard {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /skip/i }))
  expect(props.onSkip).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="RecipeCard"
```

Expected: `Cannot find module '@/components/RecipeCard'`

- [ ] **Step 3: Implement RecipeCard**

```tsx
// components/RecipeCard.tsx
import Image from 'next/image'

type Props = {
  title: string
  image: string
  current: number
  total: number
  onKeep: () => void
  onSkip: () => void
}

export default function RecipeCard({ title, image, current, total, onKeep, onSkip }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-sm mx-auto">
      <div className="relative h-56 w-full">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-5">
        <p className="text-xs text-gray-400 font-medium mb-1 text-center">
          {current} of {total}
        </p>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-5">{title}</h2>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            aria-label="Skip"
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold hover:border-red-300 hover:text-red-400 transition-colors"
          >
            ✕ Skip
          </button>
          <button
            onClick={onKeep}
            aria-label="Keep"
            className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            ✓ Keep
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="RecipeCard"
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add components/RecipeCard.tsx __tests__/components/RecipeCard.test.tsx
git commit -m "feat: add RecipeCard component (TDD)"
```

---

### Task 13: /plan/[id]/review page

**Files:**
- Create: `app/plan/[id]/review/page.tsx`

- [ ] **Step 1: Write the review page**

```tsx
// app/plan/[id]/review/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import RecipeCard from '@/components/RecipeCard'
import type { MealPlanItem } from '@/types'

export default function ReviewPage() {
  const { id: planId } = useParams<{ id: string }>()
  const router = useRouter()
  const [items, setItems] = useState<MealPlanItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)

  useEffect(() => {
    fetch(`/api/plan/${planId}/items`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
        setLoading(false)
      })
  }, [planId])

  async function decide(decision: 'approved' | 'skipped') {
    if (deciding) return
    setDeciding(true)
    const item = items[currentIndex]

    await fetch(`/api/plan/${planId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, decision }),
    })

    if (currentIndex + 1 >= items.length) {
      router.push(`/plan/${planId}/shopping-list`)
    } else {
      setCurrentIndex(i => i + 1)
      setDeciding(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-xl mb-5" />
          <div className="h-6 bg-gray-200 rounded mb-3" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            No recipes found for this cuisine. Try a different one!
          </p>
          <button
            onClick={() => router.push('/plan/new')}
            className="bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  const current = items[currentIndex]

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <RecipeCard
        title={current.recipe_title}
        image={current.recipe_image}
        current={currentIndex + 1}
        total={items.length}
        onKeep={() => decide('approved')}
        onSkip={() => decide('skipped')}
      />
    </main>
  )
}
```

- [ ] **Step 2: Add GET /api/plan/[id]/items route** (needed by review page)

```ts
// app/api/plan/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: items, error } = await supabase
    .from('meal_plan_items')
    .select('*')
    .eq('meal_plan_id', planId)
    .order('display_order')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }

  return NextResponse.json({ items: items ?? [] })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/plan/ app/api/plan/
git commit -m "feat: add recipe review page and GET /api/plan/[id]/items"
```

---

### Task 14: POST /api/plan/[id]/shopping-list route

**Files:**
- Create: `app/api/plan/[id]/shopping-list/route.ts`

- [ ] **Step 1: Write the route handler**

```ts
// app/api/plan/[id]/shopping-list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchIngredients, mergeIngredients } from '@/lib/edamam'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch plan to get num_people
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('num_people')
    .eq('id', planId)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Fetch approved items
  const { data: approvedItems } = await supabase
    .from('meal_plan_items')
    .select('recipe_title')
    .eq('meal_plan_id', planId)
    .eq('status', 'approved')

  if (!approvedItems || approvedItems.length === 0) {
    return NextResponse.json({ error: 'No approved meals' }, { status: 400 })
  }

  // Call Edamam for each approved meal
  const ingredientArrays = await Promise.all(
    approvedItems.map(item =>
      fetchIngredients(item.recipe_title, plan.num_people)
    )
  )

  const items = mergeIngredients(ingredientArrays)

  // Upsert shopping list
  const { error: upsertError } = await supabase
    .from('shopping_lists')
    .upsert({ meal_plan_id: planId, items })

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save shopping list' }, { status: 500 })
  }

  return NextResponse.json({ items })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('meal_plan_id', planId)
    .single()

  return NextResponse.json({ items: data?.items ?? [] })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/plan/
git commit -m "feat: add POST/GET /api/plan/[id]/shopping-list route"
```

---

### Task 15: ShoppingList component

**Files:**
- Create: `components/ShoppingList.tsx`
- Create: `__tests__/components/ShoppingList.test.tsx`

- [ ] **Step 1: Write failing render test**

```tsx
// __tests__/components/ShoppingList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem } from '@/types'

const items: ShoppingItem[] = [
  { name: 'olive oil', amount: 2, unit: 'tbsp', category: 'Oils' },
  { name: 'garlic',    amount: 3, unit: 'clove', category: 'Vegetables' },
  { name: 'tomatoes',  amount: 4, unit: 'unit',  category: 'Vegetables' },
]

test('renders category headers', () => {
  render(<ShoppingList items={items} />)
  expect(screen.getByText('Oils')).toBeInTheDocument()
  expect(screen.getByText('Vegetables')).toBeInTheDocument()
})

test('renders ingredient names', () => {
  render(<ShoppingList items={items} />)
  expect(screen.getByText(/olive oil/i)).toBeInTheDocument()
  expect(screen.getByText(/garlic/i)).toBeInTheDocument()
})

test('clicking an item marks it checked', () => {
  render(<ShoppingList items={items} />)
  const checkbox = screen.getAllByRole('checkbox')[0]
  expect(checkbox).not.toBeChecked()
  fireEvent.click(checkbox)
  expect(checkbox).toBeChecked()
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="ShoppingList"
```

Expected: `Cannot find module '@/components/ShoppingList'`

- [ ] **Step 3: Implement ShoppingList component**

```tsx
// components/ShoppingList.tsx
'use client'

import { useState } from 'react'
import type { ShoppingItem } from '@/types'

export default function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const byCategory = items.reduce<Record<string, ShoppingItem[]>>(
    (acc, item) => {
      const cat = item.category || 'Other'
      acc[cat] = acc[cat] ?? []
      acc[cat].push(item)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => (
        <div key={category}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">
            {category}
          </h3>
          <ul className="space-y-2">
            {catItems.map(item => {
              const key = `${item.name}__${item.unit}`
              const isChecked = checked.has(key)
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(key)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span className={`flex-1 text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.amount} {item.unit}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="ShoppingList"
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add components/ShoppingList.tsx __tests__/components/ShoppingList.test.tsx
git commit -m "feat: add ShoppingList component with checkboxes (TDD)"
```

---

### Task 16: /plan/[id]/shopping-list page

**Files:**
- Create: `app/plan/[id]/shopping-list/page.tsx`

- [ ] **Step 1: Write the shopping list page**

```tsx
// app/plan/[id]/shopping-list/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem } from '@/types'

export default function ShoppingListPage() {
  const { id: planId } = useParams<{ id: string }>()
  const router = useRouter()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    // Try to load existing shopping list first
    fetch(`/api/plan/${planId}/shopping-list`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) {
          setItems(data.items)
          setLoading(false)
        } else {
          // Generate it
          setGenerating(true)
          return fetch(`/api/plan/${planId}/shopping-list`, { method: 'POST' })
            .then(r => r.json())
            .then(d => {
              setItems(d.items ?? [])
              setLoading(false)
              setGenerating(false)
            })
        }
      })
  }, [planId])

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🛒</div>
          <p className="text-gray-500">
            {generating ? 'Building your shopping list…' : 'Loading…'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-600">Shopping List</h1>
          <span className="text-sm text-gray-400">{items.length} items</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="mb-2">No approved meals — nothing to buy!</p>
            <p className="text-sm">Go back and approve at least one meal.</p>
          </div>
        ) : (
          <ShoppingList items={items} />
        )}

        <button
          onClick={() => router.push('/plan/new')}
          className="mt-8 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          Plan another week →
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/plan/
git commit -m "feat: add shopping list page"
```

---

### Task 17: GET /api/profile route and CuisineChart component

**Files:**
- Create: `app/api/profile/route.ts`
- Create: `components/CuisineChart.tsx`

- [ ] **Step 1: Write GET /api/profile**

```ts
// app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('taste_profiles')
    .select('cuisine_scores, liked_recipe_ids')
    .eq('user_id', user.id)
    .single()

  const { count: totalPlans } = await supabase
    .from('meal_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: recentPlans } = await supabase
    .from('meal_plans')
    .select('id, cuisine_type, num_meals, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    cuisine_scores: profile?.cuisine_scores ?? {},
    total_recipes_liked: profile?.liked_recipe_ids?.length ?? 0,
    total_plans: totalPlans ?? 0,
    recent_plans: recentPlans ?? [],
  })
}
```

- [ ] **Step 2: Write CuisineChart component**

```tsx
// components/CuisineChart.tsx
import { getTopCuisines } from '@/lib/taste-profile'

export default function CuisineChart({
  scores,
}: {
  scores: Record<string, number>
}) {
  const top = getTopCuisines(scores, 6)
  const max = top[0]?.score ?? 1

  if (top.length === 0) {
    return (
      <p className="text-gray-400 text-sm">
        No preferences recorded yet — start planning!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {top.map(({ cuisine, score }) => (
        <div key={cuisine}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize text-gray-700">{cuisine}</span>
            <span className="text-gray-400">{score}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-orange-400 h-2.5 rounded-full transition-all"
              style={{ width: `${(score / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/ components/CuisineChart.tsx
git commit -m "feat: add GET /api/profile and CuisineChart component"
```

---

### Task 18: Profile page and landing page

**Files:**
- Create: `app/profile/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the profile page**

```tsx
// app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CuisineChart from '@/components/CuisineChart'
import { createClient } from '@/lib/supabase/client'

type ProfileData = {
  cuisine_scores: Record<string, number>
  total_recipes_liked: number
  total_plans: number
  recent_plans: Array<{ id: string; cuisine_type: string; num_meals: number; created_at: string }>
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(setData)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-600">Your Profile</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{data.total_plans}</div>
            <div className="text-xs text-gray-400 mt-1">Meals planned</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{data.total_recipes_liked}</div>
            <div className="text-xs text-gray-400 mt-1">Recipes kept</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Top cuisines</h2>
          <CuisineChart scores={data.cuisine_scores} />
        </div>

        {data.recent_plans.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">Recent plans</h2>
            <ul className="space-y-2">
              {data.recent_plans.map(plan => (
                <li key={plan.id}>
                  <button
                    onClick={() => router.push(`/plan/${plan.id}/shopping-list`)}
                    className="w-full text-left flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-orange-500 transition-colors"
                  >
                    <span className="text-sm capitalize">{plan.cuisine_type} · {plan.num_meals} meals</span>
                    <span className="text-xs text-gray-400">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Write the landing page**

```tsx
// app/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let recentPlans: Array<{ id: string; cuisine_type: string; num_meals: number; created_at: string }> = []

  if (user) {
    const { data } = await supabase
      .from('meal_plans')
      .select('id, cuisine_type, num_meals, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    recentPlans = data ?? []
  }

  return (
    <main className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-2">What's for Dinner?</h1>
        <p className="text-gray-500 mb-8">
          Pick your cuisine, approve your meals, get your shopping list.
        </p>

        {user ? (
          <>
            <Link
              href="/plan/new"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors mb-4"
            >
              Start a new meal plan →
            </Link>
            <Link
              href="/profile"
              className="block text-sm text-gray-400 hover:text-orange-500 transition-colors mb-6"
            >
              View your profile
            </Link>

            {recentPlans.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm text-left">
                <h2 className="font-semibold text-gray-700 mb-3 text-sm">Recent plans</h2>
                <ul className="space-y-2">
                  {recentPlans.map(plan => (
                    <li key={plan.id}>
                      <Link
                        href={`/plan/${plan.id}/shopping-list`}
                        className="flex items-center justify-between py-1.5 text-sm hover:text-orange-500 transition-colors"
                      >
                        <span className="capitalize">{plan.cuisine_type} · {plan.num_meals} meals</span>
                        <span className="text-xs text-gray-400">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <Link
            href="/login"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Get started →
          </Link>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Update layout.tsx with app metadata**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "What's for Dinner",
  description: 'Plan your weekly meals, stress-free.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Run all tests to confirm nothing is broken**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add landing page and profile page"
```

---

### Task 19: Deploy to Vercel

**Files:** None — configuration only.

- [ ] **Step 1: Push to GitHub**

1. Create a new repository at https://github.com/new named `whatsfordinner`.
2. Push the local repo:

```bash
git remote add origin https://github.com/<your-username>/whatsfordinner.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Import project in Vercel**

1. Go to https://vercel.com → **Add New Project**.
2. Import the `whatsfordinner` GitHub repository.
3. Vercel will auto-detect Next.js. Click **Deploy** — the first deploy will fail because env vars are missing. That's expected.

- [ ] **Step 3: Add environment variables in Vercel**

In **Project Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `EDAMAM_APP_ID` | Your Edamam app ID |
| `EDAMAM_APP_KEY` | Your Edamam app key |

- [ ] **Step 4: Redeploy**

In Vercel, go to **Deployments** → click the most recent deployment → **Redeploy**.

- [ ] **Step 5: Update Supabase auth redirect URL**

In Supabase → **Authentication → URL Configuration**, add your Vercel URL to **Redirect URLs**:
`https://whatsfordinner.vercel.app/**`

- [ ] **Step 6: Smoke test the deployed app**

1. Open the Vercel URL.
2. Sign up for an account.
3. Create a meal plan — choose a cuisine, 5 meals, 2 people.
4. Review all cards — keep at least 2.
5. Verify the shopping list appears with scaled quantities.
6. Visit `/profile` — confirm cuisine scores updated.

---

## All tests

Run the full test suite at any point:

```bash
npm test
```

Expected: 20 tests pass across `taste-profile`, `themealdb`, `edamam`, `RecipeCard`, `ShoppingList`.
