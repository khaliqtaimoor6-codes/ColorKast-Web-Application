import { getDb } from "@/lib/db";

export interface SeedPaint {
  paint_name: string;
  old_number: string;
  new_number: string;
  collection: string;
  r: number;
  g: number;
  b: number;
}

// Sample paint data. Design decision: three collections named
// Premium / Classic / Economy (collection names not specified by SRS).
// Colors appear in both Premium and Classic (parallel numbering schemes) so
// the Translator (FR2) has real cross-collection mappings to expose.
const SEED_PAINTS: SeedPaint[] = [
  // Shared colors — Premium scheme (A1xx -> B2xx)
  { paint_name: "Ocean Blue", old_number: "A101", new_number: "B205", collection: "Premium", r: 30, g: 90, b: 180 },
  { paint_name: "Forest Green", old_number: "A102", new_number: "B206", collection: "Premium", r: 34, g: 139, b: 34 },
  { paint_name: "Sunset Red", old_number: "A103", new_number: "B207", collection: "Premium", r: 200, g: 50, b: 60 },
  { paint_name: "Midnight Black", old_number: "A104", new_number: "B208", collection: "Premium", r: 20, g: 20, b: 30 },
  { paint_name: "Pearl White", old_number: "A105", new_number: "B209", collection: "Premium", r: 240, g: 240, b: 245 },
  { paint_name: "Golden Yellow", old_number: "A106", new_number: "B210", collection: "Premium", r: 255, g: 200, b: 0 },
  { paint_name: "Royal Purple", old_number: "A107", new_number: "B211", collection: "Premium", r: 100, g: 40, b: 150 },
  // Shared colors — Classic scheme (C1xx -> D2xx)
  { paint_name: "Ocean Blue", old_number: "C101", new_number: "D205", collection: "Classic", r: 30, g: 90, b: 180 },
  { paint_name: "Forest Green", old_number: "C102", new_number: "D206", collection: "Classic", r: 34, g: 139, b: 34 },
  { paint_name: "Sunset Red", old_number: "C103", new_number: "D207", collection: "Classic", r: 200, g: 50, b: 60 },
  { paint_name: "Midnight Black", old_number: "C104", new_number: "D208", collection: "Classic", r: 20, g: 20, b: 30 },
  { paint_name: "Pearl White", old_number: "C105", new_number: "D209", collection: "Classic", r: 240, g: 240, b: 245 },
  { paint_name: "Golden Yellow", old_number: "C106", new_number: "D210", collection: "Classic", r: 255, g: 200, b: 0 },
  { paint_name: "Royal Purple", old_number: "C107", new_number: "D211", collection: "Classic", r: 100, g: 40, b: 150 },
  // Economy-only (E1xx -> F2xx)
  { paint_name: "Warm Beige", old_number: "E101", new_number: "F205", collection: "Economy", r: 210, g: 180, b: 140 },
  { paint_name: "Dusty Rose", old_number: "E102", new_number: "F206", collection: "Economy", r: 200, g: 140, b: 140 },
  { paint_name: "Mint Fresh", old_number: "E103", new_number: "F207", collection: "Economy", r: 150, g: 255, b: 200 },
  { paint_name: "Steel Blue", old_number: "E104", new_number: "F208", collection: "Economy", r: 70, g: 130, b: 180 },
  { paint_name: "Terracotta", old_number: "E105", new_number: "F209", collection: "Economy", r: 200, g: 100, b: 60 },
  { paint_name: "Lavender Mist", old_number: "E106", new_number: "F210", collection: "Economy", r: 200, g: 180, b: 255 },
];

// Sample users. Simplified prototype authentication: passwords are stored in
// plain text. Design decision (B) documented for the assignment.
export const SEED_USERS = [
  { username: "user1", password: "user1", role: "USER" },
  { username: "admin1", password: "admin1", role: "ADMIN_L1" },
  { username: "admin2", password: "admin2", role: "ADMIN_L2" },
  { username: "admin3", password: "admin3", role: "ADMIN_L3" },
] as const;

export function seedIfEmpty(): void {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS n FROM paints").get() as { n: number };
  if (count.n === 0) {
    const insert = db.prepare(
      `INSERT INTO paints (paint_name, old_number, new_number, collection, r, g, b)
       VALUES (@paint_name, @old_number, @new_number, @collection, @r, @g, @b)`
    );
    const tx = db.transaction((rows: SeedPaint[]) => {
      for (const row of rows) insert.run(row);
    });
    tx(SEED_PAINTS);
  }

  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (userCount.n === 0) {
    const insert = db.prepare(
      `INSERT INTO users (username, password, role) VALUES (@username, @password, @role)`
    );
    const tx = db.transaction((rows: typeof SEED_USERS) => {
      for (const row of rows) insert.run(row);
    });
    tx([...SEED_USERS]);
  }
}

export { SEED_PAINTS };