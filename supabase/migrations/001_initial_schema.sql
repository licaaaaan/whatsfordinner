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
