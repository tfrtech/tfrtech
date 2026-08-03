UPDATE public.store_settings
SET store_name = 'Sistema PDV - Cliente',
    updated_at = now()
WHERE id = (
  SELECT id
  FROM public.store_settings
  ORDER BY updated_at DESC NULLS LAST, id
  LIMIT 1
);

SELECT id, store_name, updated_at
FROM public.store_settings
ORDER BY updated_at DESC NULLS LAST, id
LIMIT 1;
