import { ArrowLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
}

export const Header = ({ title, showBack = false, showMenu = true }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title ? (
            <h1 className="text-xl font-bold">{title}</h1>
          ) : (
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AutoGRID
            </h1>
          )}
        </div>
        
        {showMenu && (
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};
