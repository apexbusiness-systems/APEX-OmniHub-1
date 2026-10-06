/**
 * Supabase Database Tools (8 tools)
 * All writes are admin-scoped via SERVICE_ROLE_KEY.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MCPTool, ToolCallResult } from "./registry.ts";
import { ok, err } from "./registry.ts";

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

export const dbTools: MCPTool[] = [
  {
    name: "db_list_tables",
    description: "List all user-defined tables in the public schema.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "db_get_schema",
    description: "Get column definitions for a specific table.",
    inputSchema: {
      type: "object",
      properties: { table: { type: "string", description: "Table name" } },
      required: ["table"],
    },
  },
  {
    name: "db_select",
    description: "Query rows from a table with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        columns: { type: "string", description: "Comma-separated columns, default *" },
        filter: { type: "object", description: "Key-value equality filters" },
        limit: { type: "number", description: "Max rows (default 50, max 500)" },
      },
      required: ["table"],
    },
  },
  {
    name: "db_insert",
    description: "Insert one or more records into a table.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        records: { type: "array", description: "Array of record objects" },
      },
      required: ["table", "records"],
    },
  },
  {
    name: "db_update",
    description: "Update records matching a filter.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        filter: { type: "object", description: "Key-value equality filters" },
        updates: { type: "object", description: "Fields to update" },
      },
      required: ["table", "filter", "updates"],
    },
  },
  {
    name: "db_delete",
    description: "Delete records matching a filter.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        filter: { type: "object", description: "Key-value equality filters" },
      },
      required: ["table", "filter"],
    },
  },
  {
    name: "db_upsert",
    description: "Upsert records into a table (insert or update on conflict).",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        records: { type: "array" },
        onConflict: { type: "string", description: "Conflict column(s), e.g. 'id'" },
      },
      required: ["table", "records"],
    },
  },
];

export async function handleDbTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const sb = adminClient();
  try {
    if (name === "db_list_tables") {
      const { data, error } = await sb.rpc("list_tables" as never);
      if (error) {
        // Fallback: query information_schema directly
        const { data: d2, error: e2 } = await sb
          .from("information_schema.tables" as never)
          .select("table_name")
          .eq("table_schema" as never, "public")
          .eq("table_type" as never, "BASE TABLE");
        if (e2) return err(e2.message);
        return ok(d2);
      }
      return ok(data);
    }

    if (name === "db_get_schema") {
      const table = args.table as string;
      const { data, error } = await sb
        .from("information_schema.columns" as never)
        .select("column_name,data_type,is_nullable,column_default")
        .eq("table_schema" as never, "public")
        .eq("table_name" as never, table);
      if (error) return err(error.message);
      return ok(data);
    }

    if (name === "db_select") {
      const table = args.table as string;
      const columns = (args.columns as string | undefined) ?? "*";
      const filter = (args.filter as Record<string, unknown> | undefined) ?? {};
      const limit = Math.min(Number(args.limit ?? 50), 500);
      let q = sb.from(table).select(columns).limit(limit);
      for (const [k, v] of Object.entries(filter)) {
        q = q.eq(k, v as string);
      }
      const { data, error } = await q;
      if (error) return err(error.message);
      return ok(data);
    }

    if (name === "db_insert") {
      const { data, error } = await sb
        .from(args.table as string)
        .insert(args.records as never)
        .select();
      if (error) return err(error.message);
      return ok(data);
    }

    if (name === "db_update") {
      const filter = args.filter as Record<string, unknown>;
      let q = sb.from(args.table as string).update(args.updates as never);
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as string);
      const { data, error } = await q.select();
      if (error) return err(error.message);
      return ok(data);
    }

    if (name === "db_delete") {
      const filter = args.filter as Record<string, unknown>;
      let q = sb.from(args.table as string).delete();
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as string);
      const { data, error } = await q.select();
      if (error) return err(error.message);
      return ok({ deleted: data });
    }

    if (name === "db_upsert") {
      const { data, error } = await sb
        .from(args.table as string)
        .upsert(args.records as never, {
          onConflict: (args.onConflict as string | undefined) ?? "id",
        })
        .select();
      if (error) return err(error.message);
      return ok(data);
    }

    return err(`Unhandled db tool: ${name}`);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
