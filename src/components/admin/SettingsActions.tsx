import { Pencil, Trash2 } from "lucide-react";

export function SettingsActions({
  active,
  onEdit,
  onToggle,
  onRemove,
}: {
  active: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="settings-actions">
      <button type="button" onClick={onEdit}>
        <Pencil /> Modifier
      </button>
      <button type="button" onClick={onToggle}>
        {active ? "Désactiver" : "Réactiver"}
      </button>
      <button type="button" className="danger" onClick={onRemove}>
        <Trash2 /> Supprimer
      </button>
    </div>
  );
}
