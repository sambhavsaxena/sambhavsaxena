
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.bump_like() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_post_view(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_post_view(text) TO anon, authenticated;

DROP POLICY "anyone unlikes own" ON public.post_likes;
CREATE POLICY "fingerprint can unlike" ON public.post_likes FOR DELETE USING (true);

DROP POLICY "public read blog images" ON storage.objects;
CREATE POLICY "public read blog images" ON storage.objects FOR SELECT USING (
  bucket_id = 'blog-images' AND (storage.foldername(name))[1] IS NOT NULL
);
