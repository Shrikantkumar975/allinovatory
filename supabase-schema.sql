CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE "Product" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Warehouse" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL
);

CREATE TABLE "Stock" (
    "id" SERIAL PRIMARY KEY,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "reservedUnits" INTEGER DEFAULT 0,

    CONSTRAINT "FK_Stock_Product"
        FOREIGN KEY ("productId")
        REFERENCES "Product"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT "FK_Stock_Warehouse"
        FOREIGN KEY ("warehouseId")
        REFERENCES "Warehouse"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE "Reservation" (
    "id" SERIAL PRIMARY KEY,
    "stockId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_Reservation_Stock"
        FOREIGN KEY ("stockId")
        REFERENCES "Stock"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);