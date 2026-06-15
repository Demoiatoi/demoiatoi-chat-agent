-- Tabla de incidencias de pedido (retrasos, roturas, errores, etc.)
-- El "id" autoincremental hace de número de ticket: se le da al cliente en
-- el chat y es el mismo número que Andrea ve en el panel.

CREATE TABLE IF NOT EXISTS order_incidents (
  id bigint generated always as identity primary key,
  conversation_id uuid references chat_conversations(id) on delete set null,
  customer_email text,
  order_number text,
  reason text NOT NULL DEFAULT '',
  deadline date,
  resolution_type text,                       -- 'shipping' | 'replacement' | null
  tracking_info text NOT NULL DEFAULT '',     -- transportista + nº seguimiento
  replacement_info text NOT NULL DEFAULT '',  -- repuesto pedido/enviado
  status text NOT NULL DEFAULT 'pendiente',   -- pendiente | en_tramite | solucionada
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon full access" ON order_incidents;
CREATE POLICY "anon full access" ON order_incidents
  FOR ALL USING (true) WITH CHECK (true);
