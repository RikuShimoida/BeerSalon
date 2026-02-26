-- BeerSalonAdmin用のStorageバケット作成

-- bar-preview-images バケット作成
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bar-preview-images',
  'bar-preview-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- bar-media バケット作成
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bar-media',
  'bar-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

-- RLSポリシー設定: bar-preview-images
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'bar_preview_images_select'
  ) then
    create policy "bar_preview_images_select"
    on storage.objects for select
    to public
    using (bucket_id = 'bar-preview-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'bar_preview_images_insert'
  ) then
    create policy "bar_preview_images_insert"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'bar-preview-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'bar_preview_images_delete'
  ) then
    create policy "bar_preview_images_delete"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'bar-preview-images');
  end if;
end $$;

-- RLSポリシー設定: bar-media
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'bar_media_select'
  ) then
    create policy "bar_media_select"
    on storage.objects for select
    to public
    using (bucket_id = 'bar-media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'bar_media_insert'
  ) then
    create policy "bar_media_insert"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'bar-media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'bar_media_delete'
  ) then
    create policy "bar_media_delete"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'bar-media');
  end if;
end $$;
