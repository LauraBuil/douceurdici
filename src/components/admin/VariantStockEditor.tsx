import type { CatalogColor, CatalogFragrance } from "../../data";
import type { ProductVariantDraft } from "./AdminTypes";

function variantKey(colorId: string | null, fragranceId: string | null) {
  return `${colorId ?? "default"}:${fragranceId ?? "default"}`;
}

export function VariantStockEditor({
  colors,
  fragrances,
  selectedColors,
  selectedFragrances,
  value,
  onChange,
}: {
  colors: CatalogColor[];
  fragrances: CatalogFragrance[];
  selectedColors: string[];
  selectedFragrances: string[];
  value: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
}) {
  const colorIds = selectedColors.length ? selectedColors : [null];
  const fragranceIds = selectedFragrances.length ? selectedFragrances : [null];
  const rows = colorIds.map((colorId) => ({
    colorId,
    values: fragranceIds.map((fragranceId) => {
      const existing = value.find(
        (item) =>
          variantKey(item.colorId, item.fragranceId) ===
          variantKey(colorId, fragranceId),
      );
      return { colorId, fragranceId, stock: existing?.stock ?? 0 };
    }),
  }));
  const totalStock = rows.reduce(
    (total, row) =>
      total + row.values.reduce((rowTotal, cell) => rowTotal + cell.stock, 0),
    0,
  );
  const updateStock = (
    colorId: string | null,
    fragranceId: string | null,
    stock: number,
  ) => {
    const key = variantKey(colorId, fragranceId);
    const nextStock = Math.max(0, Math.floor(stock || 0));
    onChange(
      rows.flatMap((row) =>
        row.values.map((cell) => ({
          colorId: cell.colorId,
          fragranceId: cell.fragranceId,
          stock:
            variantKey(cell.colorId, cell.fragranceId) === key
              ? nextStock
              : cell.stock,
        })),
      ),
    );
  };

  return (
    <fieldset className="variant-stock-editor">
      <legend>Stock par combinaison</legend>
      <p>
        Saisissez directement le stock de chaque combinaison. Une quantité à 0
        rend cette combinaison disponible en précommande.
      </p>
      <div className="variant-stock-matrix-wrap">
        <table className="variant-stock-matrix">
          <thead>
            <tr>
              <th scope="col">Couleur / parfum</th>
              {fragranceIds.map((fragranceId) => (
                <th scope="col" key={fragranceId ?? "default-fragrance"}>
                  {fragrances.find((item) => item.id === fragranceId)?.name ??
                    "Sans parfum"}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowTotal = row.values.reduce(
                (total, cell) => total + cell.stock,
                0,
              );
              return (
                <tr key={row.colorId ?? "default-color"}>
                  <th scope="row">
                    {colors.find((item) => item.id === row.colorId)?.name ??
                      "Sans couleur"}
                  </th>
                  {row.values.map((cell) => {
                    const fragranceName =
                      fragrances.find((item) => item.id === cell.fragranceId)
                        ?.name ?? "sans parfum";
                    const colorName =
                      colors.find((item) => item.id === cell.colorId)?.name ??
                      "sans couleur";
                    return (
                      <td key={variantKey(cell.colorId, cell.fragranceId)}>
                        <label className="sr-only">
                          Stock {colorName} · {fragranceName}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={cell.stock}
                          onChange={(event) =>
                            updateStock(
                              cell.colorId,
                              cell.fragranceId,
                              Number(event.target.value),
                            )
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="variant-stock-total">{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {fragranceIds.map((fragranceId) => (
                <td key={fragranceId ?? "default-total"}>
                  {rows.reduce(
                    (total, row) =>
                      total +
                      (row.values.find(
                        (cell) => cell.fragranceId === fragranceId,
                      )?.stock ?? 0),
                    0,
                  )}
                </td>
              ))}
              <td className="variant-stock-total">{totalStock}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="variant-stock-summary">
        <span>
          Stock total du produit : <strong>{totalStock}</strong>
        </span>
        <span>Les combinaisons à 0 seront proposées en précommande.</span>
      </div>
    </fieldset>
  );
}
