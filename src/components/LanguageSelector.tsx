import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "wa", label: "🔥 Gen-Z / WhatsApp Slang" },
];

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="absolute top-4 right-4 z-50">
      <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
        <SelectTrigger className="w-[140px] h-9 bg-background/80 backdrop-blur-sm border-primary/20">
          <Globe className="w-4 h-4 mr-2 text-primary" />
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent align="end">
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value} className="text-sm">
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
