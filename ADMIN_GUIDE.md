# Admin Guide: Writing & Publishing Blogs

Currently, the blog section is powered by a static list for demonstration. To enable real-time publishing where you (the admin) can write posts that appear in the app, we will use **Supabase** as the content management system.

## 1. Set up the Database Table
Go to your [Supabase Dashboard](https://supabase.com/dashboard) and run the following SQL query in the **SQL Editor**:

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null, -- Stores Markdown or HTML
  author text default 'GitaLens Team',
  category text,
  image_url text,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table posts enable row level security;

-- Policy: Everyone can READ posts
create policy "Public posts are viewable by everyone" 
on posts for select 
using (true);

-- Policy: Only Admins can INSERT/UPDATE/DELETE
-- This securely checks your 'is_admin' flag in the 'profiles' table
create policy "Admins can manage posts" 
on posts for all 
using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.is_admin = true
  )
); 
```

## 2. Set Up Admin Roles
To ensure the Admin Panel is only visible to you in the app, we need to add an `is_admin` flag to your user profile.

Run this in the **SQL Editor**:

```sql
-- 1. Add is_admin column to profiles if you haven't already
alter table profiles add column is_admin boolean default false;

-- 2. Make YOURSELF an admin
-- Replace 'YOUR_USER_ID' with your ID from Authentication > Users
update profiles 
set is_admin = true 
where id = 'YOUR_USER_ID';
```

## 3. Writing Posts
For now, the easiest way to write posts is directly in the **Supabase Table Editor**:

1.  Go to **Table Editor** > **posts**.
2.  Click **Insert New Row**.
3.  Fill in the fields:
    *   **title**: "The Art of Stillness"
    *   **slug**: "art-of-stillness" (URL friendly version of title)
    *   **content**: You can write standard text or Markdown here.
    *   **category**: "Mindfulness"
4.  Click **Save**.

The app will then fetch these posts. The Admin Panel in GitLens allows you to manage these directly from the app once you are logged in as an admin.
