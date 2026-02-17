import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const app = new Hono().basePath("/mcp-inventory");

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Tool definitions
const TOOLS = [
  {
    name: "list_products",
    description: "Lista productos del catálogo con filtros opcionales por categoría, marca o búsqueda por nombre. Retorna id, nombre, precio, stock, categoría, marca y peso.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filtrar por categoría" },
        brand: { type: "string", description: "Filtrar por marca" },
        search: { type: "string", description: "Buscar por nombre" },
        limit: { type: "number", description: "Límite de resultados (default 50)" },
        low_stock_only: { type: "boolean", description: "Solo productos con stock bajo" },
      },
    },
  },
  {
    name: "get_product",
    description: "Obtiene detalles completos de un producto por ID, incluyendo info nutricional, imágenes y variantes.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "UUID del producto" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "add_product",
    description: "Agrega un nuevo producto al catálogo.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del producto" },
        category: { type: "string", description: "Categoría (ej: Proteínas, Creatinas, Pre-Entrenos)" },
        price: { type: "number", description: "Precio en DOP" },
        stock: { type: "number", description: "Stock inicial" },
        brand: { type: "string", description: "Marca" },
        weight_size: { type: "string", description: "Peso/tamaño (ej: 5 LB)" },
        description: { type: "string", description: "Descripción del producto" },
        sku: { type: "string", description: "Código SKU" },
        image_url: { type: "string", description: "URL de imagen" },
        featured: { type: "boolean", description: "Producto destacado" },
      },
      required: ["name", "category", "price"],
    },
  },
  {
    name: "update_product",
    description: "Actualiza un producto existente.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "UUID del producto" },
        name: { type: "string" },
        category: { type: "string" },
        price: { type: "number" },
        stock: { type: "number" },
        brand: { type: "string" },
        weight_size: { type: "string" },
        description: { type: "string" },
        sku: { type: "string" },
        image_url: { type: "string" },
        featured: { type: "boolean" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "delete_product",
    description: "Elimina un producto del catálogo por ID. También elimina imágenes, nutrición y variantes asociadas.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "UUID del producto a eliminar" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "get_inventory_summary",
    description: "Resumen del inventario: total de productos, por categoría, productos con stock bajo, valor total del inventario.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_stock",
    description: "Actualiza el stock de un producto y registra el movimiento.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "UUID del producto" },
        quantity_change: { type: "number", description: "Cambio de stock (+/- unidades)" },
        reason: { type: "string", description: "Razón del ajuste" },
      },
      required: ["product_id", "quantity_change"],
    },
  },
  {
    name: "list_categories",
    description: "Lista todas las categorías de productos disponibles con conteo.",
    inputSchema: { type: "object", properties: {} },
  },
];

// Tool handlers
async function handleTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "list_products": {
      let query = supabase.from("products").select("id, name, price, stock, category, brand, weight_size, image_url, featured, low_stock_threshold");
      if (args.category) query = query.eq("category", args.category as string);
      if (args.brand) query = query.ilike("brand", `%${args.brand}%`);
      if (args.search) query = query.ilike("name", `%${args.search}%`);
      if (args.low_stock_only) query = query.lte("stock", 5);
      query = query.order("name").limit((args.limit as number) || 50);
      const { data, error } = await query;
      if (error) throw error;
      return { products: data, count: data?.length || 0 };
    }

    case "get_product": {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", args.product_id as string)
        .single();
      if (error) throw error;

      const [nutrition, images, variants] = await Promise.all([
        supabase.from("product_nutrition").select("*").eq("product_id", args.product_id as string).maybeSingle(),
        supabase.from("product_images").select("*").eq("product_id", args.product_id as string).order("display_order"),
        supabase.from("product_variants").select("*").eq("product_id", args.product_id as string),
      ]);

      return { product, nutrition: nutrition.data, images: images.data, variants: variants.data };
    }

    case "add_product": {
      const { product_id, ...fields } = args;
      const { data, error } = await supabase.from("products").insert({
        name: fields.name as string,
        category: fields.category as string,
        price: fields.price as number,
        stock: (fields.stock as number) || 0,
        brand: fields.brand as string || null,
        weight_size: fields.weight_size as string || null,
        description: fields.description as string || null,
        sku: fields.sku as string || null,
        image_url: fields.image_url as string || null,
        featured: (fields.featured as boolean) || false,
      }).select().single();
      if (error) throw error;
      return { message: "Producto creado exitosamente", product: data };
    }

    case "update_product": {
      const { product_id, ...updates } = args;
      // Remove undefined values
      const cleanUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) cleanUpdates[k] = v;
      }
      const { data, error } = await supabase
        .from("products")
        .update(cleanUpdates)
        .eq("id", product_id as string)
        .select()
        .single();
      if (error) throw error;
      return { message: "Producto actualizado", product: data };
    }

    case "delete_product": {
      const pid = args.product_id as string;
      // Delete related records first
      await Promise.all([
        supabase.from("product_nutrition").delete().eq("product_id", pid),
        supabase.from("product_images").delete().eq("product_id", pid),
        supabase.from("product_variants").delete().eq("product_id", pid),
        supabase.from("cart_items").delete().eq("product_id", pid),
      ]);
      const { error } = await supabase.from("products").delete().eq("id", pid);
      if (error) throw error;
      return { message: "Producto eliminado exitosamente" };
    }

    case "get_inventory_summary": {
      const { data: products } = await supabase.from("products").select("id, name, price, stock, category, brand, low_stock_threshold");
      if (!products) return { error: "No products found" };

      const total = products.length;
      const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
      const lowStock = products.filter(p => p.stock <= (p.low_stock_threshold || 5));
      const outOfStock = products.filter(p => p.stock === 0);
      const byCategory: Record<string, number> = {};
      products.forEach(p => { byCategory[p.category] = (byCategory[p.category] || 0) + 1; });

      return {
        total_products: total,
        total_inventory_value_dop: totalValue,
        out_of_stock: outOfStock.map(p => ({ id: p.id, name: p.name })),
        low_stock: lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock })),
        by_category: byCategory,
      };
    }

    case "update_stock": {
      const pid = args.product_id as string;
      const change = args.quantity_change as number;
      const { data: product } = await supabase.from("products").select("stock").eq("id", pid).single();
      if (!product) throw new Error("Producto no encontrado");

      const newStock = product.stock + change;
      if (newStock < 0) throw new Error("Stock no puede ser negativo");

      const { error: updateErr } = await supabase.from("products").update({ stock: newStock }).eq("id", pid);
      if (updateErr) throw updateErr;

      await supabase.from("stock_movements").insert({
        product_id: pid,
        quantity_change: change,
        previous_stock: product.stock,
        new_stock: newStock,
        movement_type: change > 0 ? "restock" : "adjustment",
        notes: (args.reason as string) || null,
      });

      return { message: `Stock actualizado: ${product.stock} → ${newStock}`, previous: product.stock, new_stock: newStock };
    }

    case "list_categories": {
      const { data } = await supabase.from("products").select("category");
      const counts: Record<string, number> = {};
      data?.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
      return { categories: Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) };
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
}

// MCP Streamable HTTP Transport (simplified)
app.post("/", async (c) => {
  const body = await c.req.json();
  const { method, id, params } = body;

  if (method === "initialize") {
    return c.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "barbaro-inventory-mcp", version: "1.0.0" },
      },
    });
  }

  if (method === "tools/list") {
    return c.json({
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS },
    });
  }

  if (method === "tools/call") {
    try {
      const result = await handleTool(params.name, params.arguments || {});
      return c.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      });
    } catch (err) {
      return c.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true,
        },
      });
    }
  }

  return c.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
});

// GET for SSE (not implemented, return info)
app.get("/", (c) => {
  return c.json({ name: "barbaro-inventory-mcp", version: "1.0.0", description: "MCP server para gestión de inventario Barbaro Nutrition" });
});

Deno.serve(app.fetch);
