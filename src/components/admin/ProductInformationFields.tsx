import type {
  CatalogCategory,
  CatalogColor,
  CatalogFragrance,
  Product,
} from "../../data";

type ProductForm = Omit<Product, "id">;

type ProductInformationFieldsProps = {
  form: ProductForm;
  update: (
    key: keyof ProductForm,
    value: ProductForm[keyof ProductForm],
  ) => void;
  colors: CatalogColor[];
  fragrances: CatalogFragrance[];
  activeCategories: CatalogCategory[];
  roots: CatalogCategory[];
  selectedCategories: string[];
  selectedColors: string[];
  selectedFragrances: string[];
  toggleCategory: (categoryId: string) => void;
  toggleChoice: (
    value: string,
    selected: string[],
    setter: (values: string[]) => void,
  ) => void;
  setSelectedColors: (values: string[]) => void;
  setSelectedFragrances: (values: string[]) => void;
  onNameChange: (value: string) => void;
};

export function ProductInformationFields({
  form,
  update,
  colors,
  fragrances,
  activeCategories,
  roots,
  selectedCategories,
  selectedColors,
  selectedFragrances,
  toggleCategory,
  toggleChoice,
  setSelectedColors,
  setSelectedFragrances,
  onNameChange,
}: ProductInformationFieldsProps) {
  return (
    <div className="editor-tab-panel">
      <label>
        Nom du produit
        <input
          value={form.name}
          onChange={(event) => onNameChange(event.target.value)}
          required
        />
      </label>

      <label>
        Description courte
        <input
          value={form.short_description}
          onChange={(event) => update("short_description", event.target.value)}
          placeholder="Une phrase visible dans le catalogue"
          required
        />
      </label>

      <label>
        Description détaillée
        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={4}
          required
        />
      </label>

      <div className="form-grid product-main-fields">
        <label>
          Poids / format
          <input
            value={form.weight ?? ""}
            onChange={(event) => update("weight", event.target.value)}
            placeholder="180 g"
          />
        </label>
        <label>
          Prix en €
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => update("price", Number(event.target.value))}
            required
          />
        </label>
        <label>
          Ordre d’affichage
          <input
            type="number"
            value={form.sort_order}
            onChange={(event) =>
              update("sort_order", Number(event.target.value))
            }
          />
        </label>
      </div>

      <div className="switches">
        <label>
          <input
            type="checkbox"
            checked={form.price_visible}
            onChange={(event) => update("price_visible", event.target.checked)}
          />
          <span /> Afficher le prix sur le site
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => update("published", event.target.checked)}
          />
          <span /> Visible dans la boutique
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => update("featured", event.target.checked)}
          />
          <span /> Afficher parmi les créations phares
        </label>
      </div>

      <fieldset className="product-category-choice">
        <legend>Catégories du produit</legend>
        <p>
          Cochez toutes les collections dans lesquelles ce produit doit
          apparaître.
        </p>
        <div className="product-category-groups">
          {roots
            .filter(
              (root) =>
                root.active ||
                selectedCategories.includes(root.id) ||
                activeCategories.some((item) => item.parent_id === root.id),
            )
            .map((root) => {
              const children = activeCategories.filter(
                (item) => item.parent_id === root.id,
              );
              return (
                <section key={root.id}>
                  <label
                    className={`product-category-root ${selectedCategories.includes(root.id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(root.id)}
                      onChange={() => toggleCategory(root.id)}
                    />
                    <span>
                      <strong>{root.name}</strong>
                      <small>Collection principale</small>
                    </span>
                  </label>
                  {children.length > 0 && (
                    <div className="product-subcategory-choices">
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className={
                            selectedCategories.includes(child.id)
                              ? "selected"
                              : ""
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(child.id)}
                            onChange={() => toggleCategory(child.id)}
                          />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      </fieldset>

      <fieldset className="catalog-choice">
        <legend>Couleurs disponibles</legend>
        <p>Les couleurs sont indépendantes des parfums.</p>
        <div className="choice-grid">
          {colors
            .filter((item) => item.active || selectedColors.includes(item.id))
            .map((color) => (
              <label
                key={color.id}
                className={selectedColors.includes(color.id) ? "selected" : ""}
              >
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color.id)}
                  onChange={() =>
                    toggleChoice(color.id, selectedColors, setSelectedColors)
                  }
                />
                <span
                  className="color-chip"
                  style={{ backgroundColor: color.hex_code }}
                />
                {color.name}
              </label>
            ))}
        </div>
        {!colors.length && (
          <small>Ajoutez d’abord des couleurs dans Paramètres.</small>
        )}
      </fieldset>

      <fieldset className="catalog-choice">
        <legend>Parfums proposés</legend>
        <p>
          La composition affichée vient automatiquement du parfum sélectionné.
        </p>
        <div className="fragrance-choice-grid">
          {fragrances
            .filter(
              (item) => item.active || selectedFragrances.includes(item.id),
            )
            .map((fragrance) => (
              <label
                key={fragrance.id}
                className={
                  selectedFragrances.includes(fragrance.id) ? "selected" : ""
                }
              >
                <input
                  type="checkbox"
                  checked={selectedFragrances.includes(fragrance.id)}
                  onChange={() =>
                    toggleChoice(
                      fragrance.id,
                      selectedFragrances,
                      setSelectedFragrances,
                    )
                  }
                />
                <span>
                  <strong>{fragrance.name}</strong>
                  <small>{fragrance.composition}</small>
                </span>
              </label>
            ))}
        </div>
        {!fragrances.length && (
          <small>Ajoutez d’abord des parfums dans Paramètres.</small>
        )}
      </fieldset>
    </div>
  );
}
