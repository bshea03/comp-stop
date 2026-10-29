import { getBrandCatalog } from "@/lib/brands/brand-catalog";

export async function GET() {
  const catalog = await getBrandCatalog();
  return Response.json(catalog);
}
