-- Migración: tabla para el "Aviso urgente" que Andrea puede escribir desde el
-- panel (p.ej. info de campaña: "tazas en 24/48h, resto consultar a Andrea").
-- Elena lo recibe como instrucción de alta prioridad mientras esté activo.
--
-- Ejecutar en: Supabase → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS store_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  urgent_notice text NOT NULL DEFAULT '',
  urgent_notice_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_single_row CHECK (id = 1)
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
