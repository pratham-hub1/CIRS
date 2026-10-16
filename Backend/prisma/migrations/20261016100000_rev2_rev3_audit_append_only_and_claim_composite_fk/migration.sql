-- REV-3: Add composite FK (itemId, itemType) -> item(id, type)
-- Guarantees INV-DM-2: a claim can strictly reference an item whose type is FOUND by construction
ALTER TABLE "claim" DROP CONSTRAINT IF EXISTS "claim_itemId_fkey";
ALTER TABLE "claim" ADD CONSTRAINT "claim_itemId_itemType_fkey" 
    FOREIGN KEY ("itemId", "itemType") REFERENCES "item"("id", "type") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- REV-2: Enforce INV-DM-8 at DB engine level (append-only audit_log)
-- 1. Unconditional trigger rejecting any UPDATE or DELETE on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'INV-DM-8 Violation: audit_log is append-only. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON "audit_log";
CREATE TRIGGER trg_prevent_audit_log_modification
BEFORE UPDATE OR DELETE ON "audit_log"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- 2. Revoke write modifications for PUBLIC / application role
REVOKE UPDATE, DELETE, TRUNCATE ON "audit_log" FROM PUBLIC;
