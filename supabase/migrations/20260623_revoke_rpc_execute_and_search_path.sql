-- Revoke public execute on sensitive SECURITY DEFINER RPCs
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_webhook(uuid, text, text, text[], text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_webhook(uuid, text, text, text[], text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) TO service_role;

-- Pin search_path on trigger helper
ALTER FUNCTION public.update_comments_updated_at() SET search_path = public;
