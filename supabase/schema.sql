-- ==========================================================
-- Rode no painel do Supabase: SQL Editor → New query → Run
-- RLS (Row Level Security) é o que protege o banco, já que a
-- chave "anon" fica visível no navegador.
-- ==========================================================

-- 1) CLÍNICAS: já existe. Aqui só liberamos a LEITURA pública.
alter table clinicas enable row level security;

drop policy if exists "Leitura publica de clinicas" on clinicas;
create policy "Leitura publica de clinicas"
  on clinicas for select to anon, authenticated
  using (true);

-- 2) MENSAGENS: o público só consegue ENVIAR (ninguém lê pelo site).
create table if not exists mensagens (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) <= 80),
  email text not null check (char_length(email) <= 120),
  mensagem text not null check (char_length(mensagem) <= 1000),
  criado_em timestamptz not null default now()
);

alter table mensagens enable row level security;

drop policy if exists "Envio publico de mensagens" on mensagens;
create policy "Envio publico de mensagens"
  on mensagens for insert to anon, authenticated
  with check (true);

-- 3) DEPOIMENTOS: o público envia (sempre não aprovado) e só lê os aprovados.
create table if not exists depoimentos (
  id uuid primary key default gen_random_uuid(),
  autor text not null check (char_length(autor) <= 60),
  tempo text check (char_length(tempo) <= 60),
  texto text not null check (char_length(texto) <= 600),
  aprovado boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table depoimentos enable row level security;

drop policy if exists "Leitura de depoimentos aprovados" on depoimentos;
create policy "Leitura de depoimentos aprovados"
  on depoimentos for select to anon, authenticated
  using (aprovado = true);

drop policy if exists "Envio publico de depoimentos" on depoimentos;
create policy "Envio publico de depoimentos"
  on depoimentos for insert to anon, authenticated
  with check (aprovado = false);

-- Para aprovar um depoimento, abra Table Editor → depoimentos
-- e marque a coluna "aprovado" como true.