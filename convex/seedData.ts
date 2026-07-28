import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Elena",
  "Miguel", "Carmen", "Antonio", "Josefa", "Francisco", "Teresa", "Manuel",
  "Isabel", "Rafael", "Lourdes", "Ricardo", "Cristina", "Eduardo", "Angelica",
  "Roberto", "Marites", "Fernando", "Grace", "Alberto", "Divina", "Ernesto",
  "Corazon", "Danilo", "Leah", "Reynaldo", "Jasmin", "Rodel", "Precious",
  "Marlon", "Angela", "Bryan", "Kristine", "Erwin", "Michelle", "Jerome",
  "Joan", "Rommel", "Vanessa", "Arnel", "Cherry", "Noel", "Aiza",
];
const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Gonzales", "Ramos", "Flores",
  "Mendoza", "Torres", "Garcia", "Villanueva", "Castro", "Dela Cruz",
  "Aquino", "Rivera", "Pascual", "Marquez", "Gaspay", "Domingo", "Salazar",
  "Fernandez", "Diaz", "Navarro", "Ocampo", "Valdez", "Aguilar", "Manalo",
  "Ignacio", "Roque", "Soriano",
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

export const seedHistoricalOrders = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (currentUser.role !== "admin") {
      throw new Error("Only administrators can seed historical data");
    }

    // Get current pricing so amounts match what's actually configured
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

    const now = Date.now();
    const rangeStart = new Date("2025-04-01T08:00:00").getTime();
    const rangeEnd = now;

    // ── Step 1: Generate ~45 customers with creation dates spread across the range ──
    const NUM_CUSTOMERS = 45;
    const customerIds: any[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < NUM_CUSTOMERS; i++) {
      let fullName = "";
      do {
        fullName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
      } while (usedNames.has(fullName));
      usedNames.add(fullName);

      const custCreatedAt = randomInt(rangeStart, rangeEnd);
      const emailSafe = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");

      const custId = await ctx.db.insert("customers", {
        name: fullName,
        email: `${emailSafe}${randomInt(1, 999)}@example.com`,
        phone: randomPhone(),
        createdAt: custCreatedAt,
        createdBy: currentUser._id,
        updatedAt: custCreatedAt,
        isActive: true,
      });
      customerIds.push({ id: custId, createdAt: custCreatedAt });
    }

    // ── Step 2: Generate 100 orders spread across the range ──
    const NUM_ORDERS = 100;
    const serviceOptions = [
      "regularClothes", "assortedClothes", "towelBlankets", "comforter",
      "selfServiceWash", "selfServiceSpin", "selfServiceDry",
    ] as const;

    // Track how many orders already exist per day, for correct orderId numbering
    const dailyCounters: Record<string, number> = {};

    let created = 0;
    for (let i = 0; i < NUM_ORDERS; i++) {
      // Pick a customer whose account already existed by this order's date
      const orderDate = randomInt(rangeStart, rangeEnd);
      const eligibleCustomers = customerIds.filter((c) => c.createdAt <= orderDate);
      if (eligibleCustomers.length === 0) continue;
      const customer = randomChoice(eligibleCustomers);

      // Pick 1-2 services for this order
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
        const qty = isSelfService ? randomInt(1, 2) : 1; // loads=1 (flat rate), sessions can be 1-2
        weight[service] = qty;
        const unitPrice = (prices as any)[service];
        const lineTotal = isSelfService ? unitPrice * qty : unitPrice;
        pricingBreakdown[`${service}Price`] = lineTotal;
        totalPrice += lineTotal;
      });

      // Determine status: older orders are settled (completed/cancelled),
      // very recent orders (last 3 days) can still be in progress
      const daysAgo = (now - orderDate) / (24 * 60 * 60 * 1000);
      let status: "pending" | "in-progress" | "ready" | "completed" | "cancelled";
      const rand = Math.random();
      if (daysAgo < 3) {
        status = rand < 0.25 ? "pending" : rand < 0.5 ? "in-progress" : rand < 0.75 ? "ready" : "completed";
      } else {
        status = rand < 0.9 ? "completed" : "cancelled";
      }

      // Generate orderId in LND-YYYYMMDD-XXX format
      const dateObj = new Date(orderDate);
      const dateKey = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, "0")}${String(dateObj.getDate()).padStart(2, "0")}`;
      dailyCounters[dateKey] = (dailyCounters[dateKey] || 0) + 1;
      const orderId = `LND-${dateKey}-${String(dailyCounters[dateKey]).padStart(3, "0")}`;

      const pickupDate = orderDate + randomInt(2, 8) * 60 * 60 * 1000; // 2-8 hours later

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
      };

      // Add weight/pricing/status-specific timestamps only for orders that reached that stage
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
      created++;
    }

    return { customersCreated: customerIds.length, ordersCreated: created };
  },
});
