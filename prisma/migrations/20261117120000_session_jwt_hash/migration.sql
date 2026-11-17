-- Store sha256(jwt) instead of the raw token; existing sessions keep working.
UPDATE "Session"
SET "jwt" = encode(sha256(convert_to("jwt", 'UTF8')), 'hex')
WHERE length("jwt") <> 64;

-- Every authenticated request looks sessions up by jwt.
CREATE INDEX "Session_jwt_idx" ON "Session"("jwt");
