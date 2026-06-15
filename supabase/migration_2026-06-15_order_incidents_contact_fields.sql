-- Añade dirección y teléfono de contacto a las incidencias de pedido,
-- que Elena recopila antes de registrar la incidencia.

ALTER TABLE order_incidents ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE order_incidents ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
