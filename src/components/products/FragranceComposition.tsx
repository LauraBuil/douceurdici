export function FragranceComposition({ composition }: { composition: string }) {
  const marker = composition.match(/caract[eé]ristiques\s*:?/i);
  if (!marker || marker.index === undefined)
    return (
      <div className="fragrance-composition">
        <div className="fragrance-description">
          <span>Description</span>
          <p>{composition}</p>
        </div>
      </div>
    );
  const description = composition.slice(0, marker.index).trim();
  const remainder = composition.slice(marker.index + marker[0].length);
  const safetyMarker = remainder.search(/informations? de s[eé]curit[eé]/i);
  const characteristicsText =
    safetyMarker >= 0 ? remainder.slice(0, safetyMarker) : remainder;
  const safety =
    safetyMarker >= 0
      ? remainder
          .slice(safetyMarker)
          .replace(/^informations? de s[eé]curit[eé]\s*/i, "")
          .trim()
      : "";
  const characteristics = characteristicsText
    .split(/•|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const safetyLines = safety
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return (
    <div className="fragrance-composition">
      {description && (
        <div className="fragrance-description">
          <span>Description</span>
          {description.split(/\n+/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}
      {characteristics.length > 0 && (
        <div className="fragrance-characteristics">
          <span>Caractéristiques</span>
          <ul>
            {characteristics.map((characteristic) => (
              <li key={characteristic}>
                <i aria-hidden="true">•</i>
                <p>{characteristic}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {safetyLines.length > 0 && (
        <details className="fragrance-safety">
          <summary>Informations de sécurité</summary>
          {safetyLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </details>
      )}
    </div>
  );
}
