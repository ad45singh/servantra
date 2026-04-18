import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface OTPVerificationProps {
  onVerify: (otp: string) => void;
  onCancel: () => void;
  onResend?: () => void;
  isLoading?: boolean;
  phoneNumber?: string;
}

export const OTPVerification = ({ onVerify, onCancel, onResend, isLoading, phoneNumber }: OTPVerificationProps) => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    if (onResend) onResend();
    toast.success("New OTP sent!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error(t("otp_invalid"));
      return;
    }
    onVerify(otp);
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-elevated border border-border animate-fade-in space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">{t("otp_title")}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("otp_desc")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="0 0 0 0"
            className="h-14 w-40 text-center text-2xl font-bold tracking-[0.5em] rounded-xl"
            autoFocus
          />
        </div>

        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            disabled={!canResend}
            onClick={handleResend}
            className={`flex items-center gap-1.5 font-semibold ${canResend ? "text-primary" : "text-muted-foreground opacity-50"}`}
          >
            <RefreshCcw className="w-3.5 h-3.5" /> {t("otp_resend")}
          </button>
          <span className="text-muted-foreground font-medium">
            {timer > 0 ? `Wait ${timer}s` : "Available now"}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading || otp.length < 4}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("otp_verify")}
          </Button>
        </div>
      </form>
    </div>
  );
};
