import "@testing-library/jest-dom";
import "dotenv/config";
import { vi } from "vitest";

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = "test";

/**
 * Mock Clerk authentication middleware for all tests
 * CRITICAL: Must use res.locals.userId to match production behavior
 */
vi.mock("../src/server/middleware/clerkAuth.js", () => ({
  clerkAuthMiddleware: (req: any, res: any, next: any) => {
    const userId = req.headers["x-clerk-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing x-clerk-user-id header" });
    }
    res.locals.userId = userId;
    next();
  },
  optionalClerkAuthMiddleware: (req: any, res: any, next: any) => {
    const userId = req.headers["x-clerk-user-id"];
    if (userId) {
      res.locals.userId = userId;
    }
    next();
  },
}));

/**
 * Mock LLM provider to avoid external API calls during tests.
 * Returns a deterministic JSON string matching server expectations.
 */
vi.mock("../src/server/llm/client.js", () => ({
  llmProvider: {
    complete: async (prompt, opts) => {
      const now = new Date().toISOString();
      // Variant selector for test coverage
      const variant = opts?.variant || (typeof prompt === 'string' && prompt.includes('micro-nudge')) ? 'micro-nudge' : (typeof prompt === 'string' && prompt.includes('follow-up')) ? 'follow-up' : 'default';
      if (variant === 'micro-nudge') {
        return JSON.stringify({
          summary: "Micro-nudge variant.",
          immediate_steps: [
            { step: "Send a quick reminder.", effort: "XS", delta_bucket: "TINY", confidence: "MEDIUM", est_method: "guess", TTI: "minutes" },
          ],
          micro_nudge: "Try a 2-minute task.",
          meta: { profile_id: "mock-profile", signature_hash: "mock-signature", cached: false, timestamp: now },
        });
      }
      if (variant === 'follow-up') {
        return JSON.stringify({
          summary: "Follow-up variant.",
          immediate_steps: [
            { step: "Review last risk.", effort: "M", delta_bucket: "MEDIUM", confidence: "HIGH", est_method: "review", TTI: "days" },
          ],
          top_risks: [
            {
              risk: "Follow-up risk",
              mitigation: "Mitigate follow-up.",
              deeper_dive: {
                extended_mitigation: "Extra follow-up mitigation with lots of detail for schema compliance.",
                action_steps: ["Step 1", "Step 2"],
                warning_signals: ["Signal 1"],
                timeline: "This is a sufficiently long timeline string for schema compliance."
              }
            }
          ],
          meta: { profile_id: "mock-profile", signature_hash: "mock-signature", cached: false, timestamp: now },
        });
      }
      // Default: full schema-compliant response
      return JSON.stringify({
        summary: "Mocked LLM response for tests. This is a valid, schema-compliant response.",
        immediate_steps: [
          { step: "Do a tiny experiment to validate assumptions.", effort: "L", delta_bucket: "SMALL", confidence: "HIGH", est_method: "heuristic", TTI: "hours" },
        ],
        strategic_lens: "Test Mock Strategic Lens",
        top_risks: [
          {
            risk: "Resource shortage",
            mitigation: "Prioritize core features and defer others.",
            deeper_dive: {
              extended_mitigation: "Break down work into smaller deliverables and hire contractors. This string is long enough for schema compliance.",
              action_steps: ["Audit current scope", "Identify 2 quick wins", "Allocate 2 devs"],
              warning_signals: ["Missed milestones", "Increased bug rate"],
              timeline: "This is a sufficiently long timeline string for schema compliance."
            }
          }
        ],
        kpi: { name: "test_kpi", target: "1", cadence: "once" },
        micro_nudge: "Mock nudge",
        module: { name: "mock", steps: ["step one is important", "second step matters", "third step completes"] },
        meta: { profile_id: "mock-profile", signature_hash: "mock-signature", cached: false, timestamp: now },
      });
    },
  },
}));

/**
 * Mock tokenTracker with in-memory store to avoid DB dependency in tests.
 */
vi.mock("../src/server/llm/tokenTracker.js", () => {
  const usages = new Map<string, number>();

  return {
    tokenTracker: {
      estimateTokens: (system: string, user: string, maxOutputTokens: number) => {
        const estimated = Math.ceil((system.length + user.length) / 4) + maxOutputTokens;
        return estimated;
      },
      canUseTokens: async (_userId: string | null, _tokensToAdd: number) => true,
      recordUsage: async (_userId: string | null, _tokensUsed: number) => { /* no-op */ },
      getUsage: async (userId: string | null) => {
        if (!userId) return { used: 0, remaining: 50000, limit: 50000, percentage: 0 };
        const used = usages.get(userId) || 0;
        return { used, remaining: Math.max(0, 50000 - used), limit: 50000, percentage: Math.round((used / 50000) * 100) };
      },
      getUsageStats: (userId: string | null) => {
        return Promise.resolve({ used: 0, remaining: 50000, limit: 50000, percentage: 0 });
      },
      isLimitReached: async (_userId: string | null) => false,
    },
  };
});

/**
 * Mock ownership validation to avoid DB lookups in tests while preserving
 * basic request shape validation (profile_id required).
 */
vi.mock("../src/server/middleware/validateOwnership.js", () => ({
  validateOwnership: (req: any, res: any, next: any) => {
    const profileId = req.body?.profile_id || req.query?.profile_id;
    if (!profileId) {
      return res.status(400).json({ error: "MISSING_PROFILE_ID", message: "profile_id is required for ownership validation" });
    }
    // Attach to locals so handlers/tests that rely on it can use it
    res.locals.profileId = profileId;
    return next();
  },
}));

/**
 * Mock ensureProfile middleware to avoid DB auto-creation during tests
 */
vi.mock("../src/server/middleware/ensureProfile.js", () => ({
  ensureProfile: (req: any, res: any, next: any) => {
    // Do not touch DB in tests; ensureProfile should be a no-op beyond setting locals
    if (res.locals && !res.locals.profileId) {
      res.locals.profileId = `test-profile-${res.locals.userId ?? "anon"}`;
    }
    next();
  },
}));

/**
 * In-memory ProfileStore mock used in tests to avoid Supabase calls
 */
vi.mock("../src/server/store/profileStore.js", () => {
  class MockProfileStore {
    constructor() {
      this.profiles = new Map();
    }

    async getProfile(profileId: string) {
      const p = this.profiles.get(profileId);
      if (p) return p;
      // Return a default profile shape
      return {
        profileId,
        tags: ["test"],
        baseline: { ipp: 50, but: 50, updatedAt: Date.now() },
        strengths: [],
      };
    }

    async getBaseline(profileId: string) {
      return { ipp: 50, but: 50, updatedAt: Date.now() };
    }

    async listFeedback(_profileId: string, _limit = 3) {
      return [];
    }

    async setActiveStep(_profileId: string, _signature: string, _step: string, _deltaBucket?: string) {
      // no-op
    }

    async markStepComplete(_profileId: string, _signature: string, slider: number, outcome?: string) {
      const delta = (Math.max(0, Math.min(10, slider)) - 5) * 2;
      return { delta, baseline: { ipp: 50, but: 50, updatedAt: Date.now() }, previous_baseline: { ipp: 50, but: 50, updatedAt: Date.now() } };
    }
  }

  return { ProfileStore: MockProfileStore };
});

/**
 * In-memory SignatureCache mock to avoid Supabase usage in tests
 */
vi.mock("../src/server/cache/signatureCache.js", () => {
  class MockSignatureCache {
    constructor() {
      this.store = new Map();
    }

    async get(signature: string) {
      return this.store.get(signature) ?? null;
    }

    async set(entry: any) {
      this.store.set(entry.signature, { ...entry, createdAt: Date.now() });
    }

    async invalidate(signature: string) {
      this.store.delete(signature);
    }

    async invalidateProfile(profileId: string) {
      for (const [k, v] of this.store.entries()) {
        if (v.profileId === profileId) this.store.delete(k);
      }
    }
  }

  return { SignatureCache: MockSignatureCache };
});

/**
 * In-memory Supabase client mock for tests (minimal subset)
 * Covers basic operations used by onboarding and a few routes.
 */
vi.mock("../src/server/db/supabase.js", () => {
  const tables: Record<string, Map<string, any>> = {};

  function ensureTable(name: string) {
    if (!tables[name]) tables[name] = new Map();
    return tables[name];
  }

  // Fixture seeding API for tests (deterministic)
  function seed(tableName: string, rows: any[]) {
    const table = ensureTable(tableName);
    for (const row of rows) {
      const id = row.profile_id || row.id || row.signature || Math.random().toString(36).slice(2, 10);
      table.set(id, { ...row });
    }
  }

  // Global helper for test files
  if (typeof global !== 'undefined') {
    // Usage: global.seedTestFixtures({ profiles: [...], feedback_records: [...], ... })
    global.seedTestFixtures = (fixtures: Record<string, any[]>) => {
      for (const [table, rows] of Object.entries(fixtures)) {
        seed(table, rows);
      }
    };
  }

  function client() {
    return {
      from: (tableName: string) => {
        const table = ensureTable(tableName);
        // Query builder
        const qb: any = {
          _filters: {},
          _order: null,
          _orderDir: 'asc',
          _range: null,
          _select: null,
          select(selectStr?: string) {
            this._select = selectStr;
            return this;
          },
          eq(col: string, val: any) {
            this._filters[col] = val;
            return this;
          },
          is(col: string, val: any) {
            this._filters[col] = val;
            return this;
          },
          order(col: string, opts?: { ascending?: boolean }) {
            this._order = col;
            this._orderDir = opts?.ascending === false ? 'desc' : 'asc';
            return this;
          },
          range(from: number, to: number) {
            this._range = [from, to];
            return this;
          },
          maybeSingle() {
            for (const row of table.values()) {
              let ok = true;
              for (const k of Object.keys(this._filters)) {
                if (row[k] !== this._filters[k]) { ok = false; break; }
              }
              if (ok) return Promise.resolve({ data: row, error: null });
            }
            return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
          },
          single() {
            return this.maybeSingle();
          },
          upsert(obj: any, _opts?: any) {
            if (tableName === 'profiles') {
              const userKey = String(obj.user_id || obj.profile_id || Math.random());
              const existing = Array.from(table.values()).find((r: any) => r.user_id === obj.user_id || r.profile_id === obj.profile_id);
              const row = { ...(existing || {}), ...obj };
              if (!row.profile_id) row.profile_id = obj.profile_id || `profile_${Math.random().toString(36).slice(2,10)}`;
              table.set(row.profile_id, row);
              return {
                select: () => ({ single: async () => ({ data: row, error: null }) }),
              };
            }
            const key = obj.signature || obj.profile_id || obj.id || Math.random().toString(36).slice(2,10);
            table.set(key, obj);
            return { select: () => ({ single: async () => ({ data: obj, error: null }) }) };
          },
          insert(obj: any) {
            const id = obj.profile_id || obj.id || `id_${Math.random().toString(36).slice(2,10)}`;
            table.set(id, { ...obj, profile_id: id });
            return Promise.resolve({ data: obj, error: null });
          },
          update(obj: any) {
            return {
              eq: async (col: string, val: any) => {
                const updatedRows: any[] = [];
                for (const [k, v] of table.entries()) {
                  const row = v as any;
                  let ok = true;
                  for (const f of Object.keys(this._filters)) {
                    if (row[f] !== this._filters[f]) { ok = false; break; }
                  }
                  if (ok && row[col] === val) {
                    const updated = { ...row, ...obj };
                    table.set(k, updated);
                    updatedRows.push(updated);
                  }
                }
                if (updatedRows.length === 0) return { data: null, error: { code: 'PGRST116' } };
                return { data: updatedRows, error: null };
              },
            };
          },
          delete() {
            return {
              eq: async (col: string, val: any) => {
                const toDelete: string[] = [];
                for (const [k, v] of table.entries()) {
                  const row = v as any;
                  let ok = true;
                  for (const f of Object.keys(this._filters)) {
                    if (row[f] !== this._filters[f]) { ok = false; break; }
                  }
                  if (ok && row[col] === val) toDelete.push(k);
                }
                for (const k of toDelete) table.delete(k);
                return { data: toDelete.map((k) => ({ deleted: k })), error: null };
              },
            };
          },
          // Aggregation, ordering, and group-by for select
          async then(resolve: any, reject: any) {
            try {
              let rows = Array.from(table.values());
              // Apply filters
              for (const [col, val] of Object.entries(this._filters)) {
                rows = rows.filter((row) => row[col] === val);
              }
              // Ordering
              if (this._order) {
                rows.sort((a, b) => {
                  if (a[this._order] === b[this._order]) return 0;
                  if (this._orderDir === 'asc') return a[this._order] > b[this._order] ? 1 : -1;
                  return a[this._order] < b[this._order] ? 1 : -1;
                });
              }
              // Range (pagination)
              if (this._range) {
                rows = rows.slice(this._range[0], this._range[1] + 1);
              }
              // Aggregation (count, sum, group-by)
              if (this._select && this._select.includes('count')) {
                resolve({ data: [{ count: rows.length }], error: null });
                return;
              }
              // Group-by (very basic: group by a field and sum another)
              if (this._select && this._select.includes('sum(')) {
                const match = this._select.match(/sum\(([^)]+)\)/);
                const sumField = match ? match[1] : null;
                const sum = sumField ? rows.reduce((acc, r) => acc + (Number(r[sumField]) || 0), 0) : 0;
                resolve({ data: [{ sum }], error: null });
                return;
              }
              resolve({ data: rows, error: null });
            } catch (e) {
              reject(e);
            }
          },
        };
        return qb;
      },
    };
  }

  // Expose seeding for tests
  return { getSupabaseClient: client, __seedSupabase: seed };
});