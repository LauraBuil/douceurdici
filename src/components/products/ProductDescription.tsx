export function ProductDescription({ description }: { description: string }) {
  const markers = [
    ...description.matchAll(
      /\*\*(Caract[eé]ristiques\s*:|Conseils d[’']utilisation\s*:)\*\*/gi,
    ),
  ];
  if (!markers.length)
    return (
      <p className="product-description">{description.replace(/\*\*/g, "")}</p>
    );
  const intro = description.slice(0, markers[0].index).trim();
  const sections = markers.map((marker, index) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end = markers[index + 1]?.index ?? description.length;
    return {
      title: marker[1].replace(/\s*:$/, ""),
      content: description.slice(start, end).trim(),
    };
  });
  return (
    <div className="product-description">
      <p>{intro.replace(/\*\*/g, "")}</p>
      {sections.map((section) => {
        const items = section.content
          .replace(/^[-–]\s*/, "")
          .split(/\s+[-–]\s+/)
          .map((item) => item.trim())
          .filter(Boolean);
        return (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {items.length > 1 ? (
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{section.content.replace(/\*\*/g, "")}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
