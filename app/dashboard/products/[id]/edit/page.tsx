// app/dashboard/products/[id]/edit/page.tsx
import { createClient } from "@/lib/server";
import { redirect, notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Load product
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (!product) {
    notFound();
  }

  // Load categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product information</p>
      </div>

      <ProductForm categories={categories ?? []} product={product} />
    </div>
  );
}
