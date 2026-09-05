export type CatalogOption = { label: string; price: number; inStock: boolean; image?: string };

// A selection includes one value from every option group (for example size and color).
export function catalogOptions(options: unknown, basePrice: number): CatalogOption[] {
  if (!Array.isArray(options)) return [];
  const sourceGroups = options.some((group) => Array.isArray(group?.values))
    ? options
    : [{ values: options }];
  const groups: CatalogOption[][] = sourceGroups
    .map((group) => {
      if (!group || typeof group !== "object") return [];
      const values = Array.isArray(group.values) ? group.values : [group];
      return values
        .map((value: unknown) => {
          const entry =
            typeof value === "string" ? { label: value } : (value as Record<string, unknown>);
          if (!entry) return null;
          const label = String(entry.label ?? entry.name ?? entry.value ?? "").trim();
          if (!label) return null;
          const price = entry.price == null ? basePrice : Number(entry.price);
          return {
            label,
            price: Number.isFinite(price) ? price : basePrice,
            inStock: entry.inStock !== false,
            image: typeof entry.image === "string" ? entry.image : undefined,
          };
        })
        .filter((value: CatalogOption | null): value is CatalogOption => value !== null);
    })
    .filter((group) => group.length > 0);
  if (!groups.length) return [];
  return groups.reduce<CatalogOption[]>(
    (combinations, group) =>
      combinations.flatMap((previous) =>
        group.map((value) => ({
          ...value,
          label: previous.label ? `${previous.label} / ${value.label}` : value.label,
          price: previous.price + value.price - basePrice,
          inStock: previous.inStock && value.inStock,
          image: value.image || previous.image,
        })),
      ),
    [{ label: "", price: basePrice, inStock: true }],
  );
}

export function isProductInStock(product: {
  track_stock?: boolean;
  stock_qty?: number;
  variants?: { inStock?: boolean }[];
  colorVariants?: { inStock?: boolean }[];
}) {
  if (product.track_stock && Number(product.stock_qty) <= 0) return false;
  const choices = [...(product.variants ?? []), ...(product.colorVariants ?? [])];
  return choices.length === 0 || choices.some((choice) => choice.inStock !== false);
}
