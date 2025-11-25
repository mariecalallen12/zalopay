-- Merchant settings for merchant portal
CREATE TABLE "merchant_settings" (
    "id" UUID NOT NULL,
    "victim_id" UUID NOT NULL,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "business" JSONB NOT NULL DEFAULT '{}',
    "notifications" JSONB NOT NULL DEFAULT '{}',
    "security" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "merchant_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "merchant_settings_victim_id_key" UNIQUE ("victim_id")
);

-- QR codes metadata
CREATE TABLE "qr_codes" (
    "id" UUID NOT NULL,
    "victim_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'static',
    "amount" INTEGER,
    "description" TEXT,
    "design" VARCHAR(100) NOT NULL DEFAULT 'default',
    "qr_data" TEXT NOT NULL,
    "qr_image" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- QR code transactions
CREATE TABLE "qr_transactions" (
    "id" UUID NOT NULL,
    "qr_code_id" UUID NOT NULL,
    "victim_id" UUID,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'success',
    "method" VARCHAR(50) NOT NULL DEFAULT 'ZaloPay',
    "reference" VARCHAR(100),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_transactions_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "qr_codes_victim_id_idx" ON "qr_codes"("victim_id");
CREATE INDEX "qr_codes_status_created_at_idx" ON "qr_codes"("status", "created_at");
CREATE INDEX "qr_transactions_qr_code_id_created_at_idx" ON "qr_transactions"("qr_code_id", "created_at");
CREATE INDEX "qr_transactions_victim_id_created_at_idx" ON "qr_transactions"("victim_id", "created_at");
CREATE INDEX "qr_transactions_status_created_at_idx" ON "qr_transactions"("status", "created_at");

-- Foreign keys
ALTER TABLE "merchant_settings" ADD CONSTRAINT "merchant_settings_victim_id_fkey" FOREIGN KEY ("victim_id") REFERENCES "victims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_victim_id_fkey" FOREIGN KEY ("victim_id") REFERENCES "victims"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qr_transactions" ADD CONSTRAINT "qr_transactions_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_transactions" ADD CONSTRAINT "qr_transactions_victim_id_fkey" FOREIGN KEY ("victim_id") REFERENCES "victims"("id") ON DELETE SET NULL ON UPDATE CASCADE;
