import { createFileRoute, Link } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_admin/admin/products/new")({ component: NewProduct });

function NewProduct() {
  return (
    <>
      <Helmet>
        <title>New Product — ZXG Admin</title>
      </Helmet>
      <div className="px-6 lg:px-10 py-10">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-luxury text-muted-foreground hover:text-gold mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to catalog
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">
          New <span className="text-gradient-gold italic">Creation</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-10">Add a new piece to the atelier.</p>
        <ProductForm />
      </div>
    </>
  );
}
