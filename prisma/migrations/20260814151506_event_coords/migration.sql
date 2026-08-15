-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "postcode" TEXT NOT NULL DEFAULT '',
    "lat" REAL NOT NULL DEFAULT 52.4797,
    "lng" REAL NOT NULL DEFAULT -1.9026,
    "startsAt" DATETIME NOT NULL,
    "rsvpUrl" TEXT
);
INSERT INTO "new_Event" ("id", "locality", "rsvpUrl", "startsAt", "title", "venue") SELECT "id", "locality", "rsvpUrl", "startsAt", "title", "venue" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
