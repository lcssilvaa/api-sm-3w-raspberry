-- Executar no banco da API antes de iniciar a nova versão.
-- Registros existentes e equipamentos sem rele mantêm NULL.
ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS rele INTEGER;
