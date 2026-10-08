import { PageHeader } from "@/app/components/ui";
import ImportWizard from "./wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Importer un inventaire"
        description="Fichier → vérification des doublons → référence → préparation des annonces."
      />
      <ImportWizard />
    </div>
  );
}
