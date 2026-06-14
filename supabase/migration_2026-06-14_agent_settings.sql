-- Migración: configuración del agente (foto, nombre, horario de Andrea,
-- políticas de envíos/devoluciones, instrucciones extra y productos
-- recomendados por ocasión) gestionada desde el panel ("🎨 Agente" /
-- "🛍️ Productos"), persistida en store_settings.
-- También añade "task_completed" a chat_conversations para las pestañas
-- "📝 Pendientes" / "📋 Presupuestos pendientes" del panel.
--
-- Ejecutar en: Supabase → SQL Editor → New query → Run

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS agent_name text NOT NULL DEFAULT 'Elena',
  ADD COLUMN IF NOT EXISTS agent_avatar text,
  ADD COLUMN IF NOT EXISTS shipping_policy text NOT NULL DEFAULT 'Tiempo de producción: de 6 a 15 días hábiles (estándar). Tazas y láminas se preparan y envían en 24h. En campañas concretas centralizamos la producción de pedidos urgentes — conviene preguntar siempre para confirmar disponibilidad. Una vez el pedido sale del taller, el envío es siempre urgente (24-48h) con seguimiento de transporte. Si el pedido es muy urgente, se puede contratar un servicio de 10h contactando para abonar la diferencia. Coste de envío: gratis a partir de 90€; para pedidos de menor importe ronda entre 5€ y 6,50€ según destino y volumen. Disponemos de un cupo de pedidos urgentes; una vez cubierto, no se podrán aceptar más urgentes hasta la fecha que indiquemos. Si el cliente necesita algo urgente, dile que vas a consultarlo con Andrea antes de confirmar. Hacemos envíos a toda España. También podemos enviar al extranjero (incluido Portugal) bajo petición.',
  ADD COLUMN IF NOT EXISTS returns_policy text NOT NULL DEFAULT 'Aceptamos devoluciones en 14 días si el producto llega defectuoso. Los productos personalizados no admiten devolución salvo error nuestro. Contacta en contacto@demoiatoi.es',
  ADD COLUMN IF NOT EXISTS extra_instructions text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT
    '{"mon":["10:00","17:00"],"tue":["10:00","17:00"],"wed":["10:00","17:00"],"thu":["10:00","17:00"],"fri":["10:00","13:00"],"sat":null,"sun":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS recommended_products jsonb NOT NULL DEFAULT
    '{"boda":[],"bautizo":[],"comunion":[],"cumpleanos":[],"general":[]}'::jsonb;

ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS task_completed boolean NOT NULL DEFAULT false;
