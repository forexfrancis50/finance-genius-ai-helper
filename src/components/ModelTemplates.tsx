import { Button } from "@/components/ui/button";

const templates = [
  "DCF Analysis",
  "LBO Model",
  "Sensitivity Analysis",
  "Comparable Company Analysis",
  "Merger Model",
];

interface ModelTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

export const ModelTemplates = ({ onSelectTemplate }: ModelTemplatesProps) => {
  return (
    <div className="p-4 bg-secondary rounded-lg mb-6">
      <h3 className="text-primary font-semibold mb-3">Quick Templates</h3>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template}
            variant="outline"
            className="text-sm"
            onClick={() => onSelectTemplate(template)}
          >
            {template}
          </Button>
        ))}
      </div>
    </div>
  );
};