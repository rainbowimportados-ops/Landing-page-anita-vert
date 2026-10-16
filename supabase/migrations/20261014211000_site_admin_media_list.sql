-- Public delivery is unchanged; only site administrators can enumerate the library.
create policy site_admin_media_list on storage.objects for select to authenticated
using (bucket_id='digital-card-media' and (select site_private.admin()));
