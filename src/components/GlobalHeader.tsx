import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const GlobalHeader = ({ 
  title, 
  showSearch = false, 
  showNotifications = true,
  leftContent,
  rightContent
}: { 
  title?: string, 
  showSearch?: boolean, 
  showNotifications?: boolean,
  leftContent?: React.ReactNode,
  rightContent?: React.ReactNode
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {leftContent ? leftContent : (title && <h1 className="font-heading font-bold text-lg text-foreground truncate">{title}</h1>)}
      </div>
      
      <div className="flex items-center gap-2">
        {rightContent ? rightContent : (
          <>
            {showSearch && (
              <button 
                onClick={() => navigate("/search")}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            
            <LanguageSelector className="relative" />
            
            {showNotifications && (
              <button 
                onClick={() => navigate(user?.id ? "/notifications" : "/login")}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emergency rounded-full border-2 border-card" />
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
