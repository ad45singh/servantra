import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CustomerBottomNav from "@/components/CustomerBottomNav";
import { GlobalHeader } from "@/components/GlobalHeader";
import { LocationPicker } from "@/components/LocationPicker";

const CustomerLayout = () => {
  const location = useLocation();
  const hideHeaderPaths = ["/search", "/notifications", "/favorites", "/support"];
  const showHeader = !hideHeaderPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background pb-20">
      {showHeader && (
        <GlobalHeader 
          title="Servantra" 
          showSearch={location.pathname !== "/"} 
          leftContent={location.pathname === "/" ? <LocationPicker /> : undefined}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerLayout;
