import { mutation } from "./_generated/server";

// This script is meant to be run via the CLI (no logged-in session), so instead
// of requiring an active auth session, it looks up an existing admin account
// to attribute the seeded records to.
async function getSeedAdminUser(ctx: any) {
  const admin = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("role"), "admin"))
    .first();
  if (!admin) {
    throw new Error("No admin user found. Please sign up/create at least one admin account first.");
  }
  return admin;
}

// ── STEP 0: Remove any data created by a previous run of this seed script ──
// Matches records tagged isSeedData:true (reliable, going forward), AND falls
// back to the old "@example.com" placeholder domain for older seed batches
// that predate the isSeedData flag.
export const clearPreviousSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    const allCustomers = await ctx.db.query("customers").collect();
    const seedCustomers = allCustomers.filter(
      (c) => c.isSeedData === true || c.email?.endsWith("@example.com")
    );
    const seedCustomerIds = new Set(seedCustomers.map((c) => c._id));

    const allOrders = await ctx.db.query("laundryOrders").collect();
    const seedOrders = allOrders.filter(
      (o) => o.isSeedData === true || seedCustomerIds.has(o.customerId)
    );

    for (const o of seedOrders) {
      await ctx.db.delete(o._id);
    }
    for (const c of seedCustomers) {
      await ctx.db.delete(c._id);
    }

    return { customersRemoved: seedCustomers.length, ordersRemoved: seedOrders.length };
  },
});

// ── EMERGENCY RESET: wipes ALL customers and orders unconditionally ──
// Use this ONCE if duplicate seed batches have piled up and clearPreviousSeedData
// can no longer tell them apart from real data (e.g. because older batches were
// created before the isSeedData tag existed). This deletes EVERYTHING in both
// tables — only run this if you're intentionally starting completely fresh.
export const resetAllOrdersAndCustomers = mutation({
  args: {},
  handler: async (ctx) => {
    const allOrders = await ctx.db.query("laundryOrders").collect();
    for (const o of allOrders) {
      await ctx.db.delete(o._id);
    }
    const allCustomers = await ctx.db.query("customers").collect();
    for (const c of allCustomers) {
      await ctx.db.delete(c._id);
    }
    return { customersRemoved: allCustomers.length, ordersRemoved: allOrders.length };
  },
});

const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Elena",
  "Miguel", "Carmen", "Antonio", "Josefa", "Francisco", "Teresa", "Manuel",
  "Isabel", "Rafael", "Lourdes", "Ricardo", "Cristina", "Eduardo", "Angelica",
  "Roberto", "Marites", "Fernando", "Grace", "Alberto", "Divina", "Ernesto",
  "Corazon", "Danilo", "Leah", "Reynaldo", "Jasmin", "Rodel", "Precious",
  "Marlon", "Angela", "Bryan", "Kristine", "Erwin", "Michelle", "Jerome",
  "Joan", "Rommel", "Vanessa", "Arnel", "Cherry", "Noel", "Aiza",
  "Vincent", "Karen", "Dennis", "Judy", "Randy", "Nenita", "Willy",
  "Susan", "Edgar", "Fe", "Melvin", "Gina", "Alvin", "Rowena",
  "Larry", "Melody", "Sonny", "Emily", "Wilfredo", "Norma", "Jayson",
  "Liza", "Ramil", "Perla", "Dexter", "Amalia", "Herbert", "Lorna",
  // Igorot / Cordilleran given names (commonly used in Baguio & the Cordillera region)
  "Bugan", "Kabigat", "Wasay", "Dawnay", "Sinag", "Banag", "Cayat",
  "Ap-ap", "Malinao", "Dulnuan", "Alma", "Bantasan", "Insang", "Onwas",
];
const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Gonzales", "Ramos", "Flores",
  "Mendoza", "Torres", "Garcia", "Villanueva", "Castro", "Dela Cruz",
  "Aquino", "Rivera", "Pascual", "Marquez", "Gaspay", "Domingo", "Salazar",
  "Fernandez", "Diaz", "Navarro", "Ocampo", "Valdez", "Aguilar", "Manalo",
  "Ignacio", "Roque", "Soriano", "Pangilinan", "Del Rosario", "Fajardo",
  "Lazaro", "Macaraeg", "Panganiban", "Tan", "Sy", "Uy", "Lim",
  // Igorot / Cordilleran surnames (Ibaloi, Kankanaey, Ifugao, Kalinga, Bontoc communities)
  "Bahni", "Baguilat", "Bugtong", "Camdas", "Chalapan", "Dangwa", "Dulawan",
  "Fagyan", "Fianza", "Ganggangan", "Kimakim", "Longid", "Molintas",
  "Pekas", "Piluden", "Sagandoy", "Tayaban", "Tuguinay", "Wasing",
  "Cariño", "Bomagao", "Sudiacal", "Odsey", "Waclin", "Guilaran",
  "Ambalong", "Bugnosen", "Aliten", "Camsol",
];

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPhone(): string {
  return "09" + Array.from({ length: 9 }, () => randomInt(0, 9)).join("");
}
// Realistic gmail.com address matching patterns like "arneltorres77@gmail.com"
function randomGmail(fullName: string): string {
  const clean = fullName.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  const parts = clean.split(/\s+/);
  const first = parts[0] || "user";
  const last = parts[parts.length - 1] || "";
  const style = randomInt(1, 4);
  let base: string;
  if (style === 1) base = `${first}${last}`;
  else if (style === 2) base = `${first}.${last}`;
  else if (style === 3) base = `${first}${last[0] || ""}`;
  else base = `${first[0] || ""}${last}`;
  const suffix = Math.random() < 0.6 ? randomInt(1, 999) : "";
  return `${base}${suffix}@gmail.com`;
}
// Random timestamp for a given calendar day, constrained to 8:00 AM - 8:00 PM
// PHILIPPINE TIME (UTC+8). Convex servers run in UTC, so we build the timestamp
// using Date.UTC() and subtract 8 hours from the intended Manila hour — this
// guarantees the stored epoch value displays as 8am-8pm once the browser
// (running in Philippine time) renders it, regardless of server timezone.
function randomTimeOnDay(year: number, month: number, day: number): number {
  const manilaHour = randomInt(8, 19); // 8am to 7:59pm Manila time
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);
  const utcHour = manilaHour - 8; // convert Manila hour to equivalent UTC hour
  return Date.UTC(year, month, day, utcHour, minute, second);
}

export const seedHistoricalOrders = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getSeedAdminUser(ctx);

    const pricingConfig: any = await ctx.db.query("pricingConfig").first();
    const prices = {
      regularClothes: pricingConfig?.regularClothesPrice ?? 230,
      assortedClothes: pricingConfig?.assortedClothesPrice ?? 230,
      towelBlankets: pricingConfig?.towelBlanketsPrice ?? 230,
      comforter: pricingConfig?.comforterPrice ?? 250,
      selfServiceWash: pricingConfig?.selfServiceWashPrice ?? 80,
      selfServiceSpin: pricingConfig?.selfServiceSpinPrice ?? 35,
      selfServiceDry: pricingConfig?.selfServiceDryPrice ?? 120,
    };

    const now = new Date();
    const startYear = 2025, startMonth = 3; // April 2025 (0-indexed month)
    const serviceOptions = [
      "regularClothes", "assortedClothes", "towelBlankets", "comforter",
      "selfServiceWash", "selfServiceSpin", "selfServiceDry",
    ] as const;

    // ── Step 1: Create a growing pool of customers over time ──
    // Start with ~30 customers already "known" before April 2025, then add
    // a handful of brand-new customers each month so the customer base grows.
    const customerPool: { id: any; createdAt: number }[] = [];
    const usedNames = new Set<string>();

    function makeCustomer(createdAt: number) {
      let fullName = "";
      do {
        fullName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
      } while (usedNames.has(fullName));
      usedNames.add(fullName);
      return { fullName, createdAt };
    }

    // Seed an initial base of ~25 customers right at the start
    const initialBatch = 35;
    for (let i = 0; i < initialBatch; i++) {
      const createdAt = randomTimeOnDay(startYear, startMonth, randomInt(1, 28));
      const { fullName } = makeCustomer(createdAt);
      const custId = await ctx.db.insert("customers", {
        name: fullName,
        email: randomGmail(fullName),
        phone: randomPhone(),
        createdAt,
        createdBy: currentUser._id,
        updatedAt: createdAt,
        isActive: true,
        isSeedData: true,
      });
      customerPool.push({ id: custId, createdAt });
    }

    let totalOrdersCreated = 0;
    let totalCustomersCreated = initialBatch;
    const dailyCounters: Record<string, number> = {};

    // ── Step 2: Walk month by month from April 2025 to the current month ──
    let year = startYear;
    let month = startMonth;
    while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const maxDay = isCurrentMonth ? now.getDate() : daysInMonth;

      // 55-70 orders per month (increased volume), scaled down proportionally
      // for a partial current month
      const fullMonthTarget = randomInt(55, 70);
      const monthTarget = isCurrentMonth
        ? Math.max(1, Math.round(fullMonthTarget * (maxDay / daysInMonth)))
        : fullMonthTarget;

      // Occasionally add 1-3 brand-new customers this month (customer base grows over time)
      const newCustomersThisMonth = randomInt(2, 4);
      for (let i = 0; i < newCustomersThisMonth; i++) {
        const day = randomInt(1, maxDay);
        const createdAt = randomTimeOnDay(year, month, day);
        const { fullName } = makeCustomer(createdAt);
        const custId = await ctx.db.insert("customers", {
          name: fullName,
          email: randomGmail(fullName),
          phone: randomPhone(),
          createdAt,
          createdBy: currentUser._id,
          updatedAt: createdAt,
          isActive: true,
          isSeedData: true,
        });
        customerPool.push({ id: custId, createdAt });
        totalCustomersCreated++;
      }

      for (let i = 0; i < monthTarget; i++) {
        const day = randomInt(1, maxDay);
        const orderDate = randomTimeOnDay(year, month, day);

        const eligible = customerPool.filter((c) => c.createdAt <= orderDate);
        if (eligible.length === 0) continue;
        const customer = randomChoice(eligible);

        // Always pick 1-2 real services — never an empty order
        const numServices = Math.random() < 0.75 ? 1 : 2;
        const chosen = new Set<string>();
        while (chosen.size < numServices) {
          chosen.add(randomChoice(serviceOptions));
        }

        const orderType: any = {};
        const weight: any = {};
        const pricingBreakdown: any = {};
        let totalPrice = 0;

        chosen.forEach((service) => {
          orderType[service] = true;
          const isSelfService = service.startsWith("selfService");
          const qty = isSelfService ? randomInt(1, 2) : 1;
          weight[service] = qty;
          const unitPrice = (prices as any)[service];
          const lineTotal = isSelfService ? unitPrice * qty : unitPrice;
          pricingBreakdown[`${service}Price`] = lineTotal;
          totalPrice += lineTotal;
        });

        const daysAgo = (now.getTime() - orderDate) / (24 * 60 * 60 * 1000);
        let status: "pending" | "in-progress" | "ready" | "completed" | "cancelled";
        const rand = Math.random();
        if (daysAgo < 2) {
          status = rand < 0.25 ? "pending" : rand < 0.5 ? "in-progress" : rand < 0.75 ? "ready" : "completed";
        } else {
          status = rand < 0.92 ? "completed" : "cancelled";
        }

        const dateKey = `${year}${String(month + 1).padStart(2, "0")}${String(day).padStart(2, "0")}`;
        dailyCounters[dateKey] = (dailyCounters[dateKey] || 0) + 1;
        const orderId = `LND-${dateKey}-${String(dailyCounters[dateKey]).padStart(3, "0")}`;

        const pickupDate = orderDate + randomInt(2, 8) * 60 * 60 * 1000;

        const orderDoc: any = {
          orderId,
          customerId: customer.id,
          orderType,
          status,
          notes: "",
          expectedPickupDate: pickupDate,
          createdAt: orderDate,
          createdBy: currentUser._id,
          updatedAt: orderDate,
          updatedBy: currentUser._id,
          paymentStatus: status === "completed" ? "paid" : "unpaid",
          isDeleted: false,
          isSeedData: true,
        };

        if (status !== "pending") {
          orderDoc.inProgressAt = orderDate + 30 * 60 * 1000;
        }
        if (status === "ready" || status === "completed") {
          orderDoc.weight = weight;
          orderDoc.pricing = { ...pricingBreakdown, totalPrice };
          orderDoc.readyAt = orderDate + randomInt(3, 6) * 60 * 60 * 1000;
        }
        if (status === "completed") {
          orderDoc.completedAt = orderDoc.readyAt + randomInt(1, 24) * 60 * 60 * 1000;
          orderDoc.actualPickupDate = orderDoc.completedAt;
          orderDoc.paidAt = orderDoc.completedAt;
        }
        if (status === "cancelled") {
          orderDoc.cancelledAt = orderDate + randomInt(1, 12) * 60 * 60 * 1000;
          orderDoc.cancellationReason = "Customer request";
        }

        await ctx.db.insert("laundryOrders", orderDoc);
        totalOrdersCreated++;
      }

      month++;
      if (month > 11) { month = 0; year++; }
    }

    return { customersCreated: totalCustomersCreated, ordersCreated: totalOrdersCreated };
  },
});
