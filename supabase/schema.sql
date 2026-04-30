-- Saraab Prop Shop Invoicer — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query → paste & run

create table if not exists invoices (
  invoice_id  text        not null,
  user_id     text        not null,
  data        jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (invoice_id, user_id)
);

create table if not exists expenses (
  expense_id  text        not null,
  user_id     text        not null,
  data        jsonb       not null,
  created_at  timestamptz not null default now(),
  primary key (expense_id, user_id)
);

create table if not exists branding (
  user_id     text        primary key,
  logo        text,
  signature   text,
  updated_at  timestamptz not null default now()
);

-- Disable RLS (personal single-user app — the anon key is safe here)
alter table invoices disable row level security;
alter table expenses disable row level security;
alter table branding disable row level security;
