-- CreateTable
CREATE TABLE "opening_moves" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptKey" TEXT,
    "promptText" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "opening_moves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opening_moves_userId_key" ON "opening_moves"("userId");

-- AddForeignKey
ALTER TABLE "opening_moves" ADD CONSTRAINT "opening_moves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
