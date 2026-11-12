-- TV TOUCH v1.4: executar DEPOIS de 01_setup.sql e 03_admin_dashboard.sql.
-- Configurações públicas: não armazenar dados pessoais, segredos, senhas ou MACs.
create table if not exists public.tvt_features (
 id text primary key check(id ~ '^(tool|resource|module)_[a-z0-9_]{2,45}$'),
 label text not null check(length(label) between 2 and 100),
 category text not null check(length(category) between 2 and 40),
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.tvt_device_profiles (
 station text primary key check(station in ('TV TOUCH 01','TV TOUCH 02','TV TOUCH 03')),
 rotation_sensitivity numeric(4,2) not null default 1 check(rotation_sensitivity between 0.5 and 2),
 brush_sensitivity numeric(4,2) not null default 1 check(brush_sensitivity between 0.5 and 2),
 drag_threshold_px integer not null default 12 check(drag_threshold_px between 3 and 28),
 updated_at timestamptz not null default now()
);
insert into public.tvt_features(id,label,category,enabled) values
  ('module_videos','Vídeos 360°','Módulo',true),
  ('module_laboratorio','Laboratório interativo','Módulo',true),
  ('module_diagnostico','Diagnóstico da TV','Módulo',true),
  ('tool_desenho','Quadro digital','Laboratório',true),
  ('tool_solidos','Sólidos 3D','Laboratório',true),
  ('tool_encaixe','Encaixe de formas','Laboratório',true),
  ('tool_porto','Desafio portuário','Laboratório',true),
  ('resource_earth','Google Earth','Externa',true),
  ('resource_geogebra','GeoGebra 3D','Externa',true),
  ('resource_phet','PhET','Externa',true),
  ('resource_nasa','NASA Eyes','Externa',true),
  ('resource_polypad','Polypad','Externa',true),
  ('resource_arts','Google Arts & Culture','Externa',true),
  ('resource_sketchfab','Sketchfab','Externa',true),
  ('resource_geogeometry','GeoGebra Geometria','Externa',true),
  ('resource_earthmaps','Google Earth Projetos','Externa',true),
  ('resource_nasamissions','NASA Interativos','Externa',true),
  ('resource_arthistory','Arts & Culture','Externa',true),
  ('resource_phhtml','PhET HTML5','Externa',true),
  ('resource_porto360','Portos 360°','Vídeos',true),
  ('resource_navio360','Navios 360°','Vídeos',true),
  ('resource_oceano360','Oceanos 360°','Vídeos',true),
  ('resource_historia360','História 360°','Vídeos',true),
  ('resource_espaco360','Espaço 360°','Vídeos',true),
  ('resource_museus360','Museus 360°','Vídeos',true),
  ('resource_natureza360','Natureza 360°','Vídeos',true),
  ('resource_industrias360','Indústrias 360°','Vídeos',true)
on conflict(id) do nothing;
insert into public.tvt_device_profiles(station) values
 ('TV TOUCH 01'),('TV TOUCH 02'),('TV TOUCH 03')
on conflict(station) do nothing;

alter table public.tvt_features enable row level security;
alter table public.tvt_device_profiles enable row level security;
revoke all on table public.tvt_features,public.tvt_device_profiles from public,anon,authenticated;
grant select on table public.tvt_features,public.tvt_device_profiles to anon,authenticated;
grant update (enabled,updated_at) on table public.tvt_features to authenticated;
grant update (rotation_sensitivity,brush_sensitivity,drag_threshold_px,updated_at) on table public.tvt_device_profiles to authenticated;

drop policy if exists tvt_features_read on public.tvt_features;
create policy tvt_features_read on public.tvt_features for select to anon,authenticated using(true);
drop policy if exists tvt_profiles_read on public.tvt_device_profiles;
create policy tvt_profiles_read on public.tvt_device_profiles for select to anon,authenticated using(true);
drop policy if exists tvt_features_admin_update on public.tvt_features;
create policy tvt_features_admin_update on public.tvt_features for update to authenticated
 using(exists(select 1 from public.tvt_admins a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.tvt_admins a where a.user_id=(select auth.uid())));
drop policy if exists tvt_profiles_admin_update on public.tvt_device_profiles;
create policy tvt_profiles_admin_update on public.tvt_device_profiles for update to authenticated
 using(exists(select 1 from public.tvt_admins a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.tvt_admins a where a.user_id=(select auth.uid())));
-- Somente o administrador SQL/service role adiciona ou remove linhas do catálogo.
