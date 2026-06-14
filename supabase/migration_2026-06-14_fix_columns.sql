-- Migración: añade las columnas que api/chat.js espera y que faltaban
-- en el esquema real de Supabase. Esto es lo que rompía el "Modo Sugerencia"
-- y las alertas de duda/contacto del panel.
--
-- Ejecutar en: Supabase → SQL Editor → New query → Run

ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS alert_type text,
  ADD COLUMN IF NOT EXISTS needs_clarification boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_channel text;

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS is_suggestion_private boolean NOT NULL DEFAULT false;
