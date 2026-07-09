/* ============================================================
   Подключение общего хранилища отметок вишлиста (Supabase).
   Ключ publishable предназначен для публикации в коде страницы —
   его можно спокойно держать в открытом репозитории.
   Доступ к базе ограничен политиками из supabase.sql.

   ВАЖНО: секретный ключ (sb_secret_…) сюда вставлять нельзя.
   ============================================================ */
window.WISHLIST_CONFIG = {
  SUPABASE_URL:      "https://gngfutwstycjwzacexib.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_OuJW5AHnD3myhucIbAuBZQ_xjA_p7IP"
};
