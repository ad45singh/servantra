import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "hi" | "bn" | "ta" | "te" | "mr" | "gu" | "es" | "fr" | "wa";

type Translations = Record<Language, Record<string, string>>;

const translations: Translations = {
  en: {
    "app_title": "Servantra",
    "app_subtitle": "Your City. Your Services. One App.",
    "role_title": "How will you use Servantra?",
    "role_customer_title": "👤 I need services",
    "role_customer_desc": "Book plumbers, electricians, cleaners & more",
    "role_vendor_title": "🛠️ I provide services",
    "role_vendor_desc": "List your services & grow your business",
    "email_label": "Email",
    "password_label": "Password",
    "fullname_label": "Full Name",
    "sign_in": "Sign In",
    "sign_up": "Sign Up",
    "already_have_account": "Already have an account? Sign in",
    "dont_have_account": "Don't have an account? Sign up",
    "forgot_password": "Forgot password?",
    "or_continue_with": "or continue with",
    "sign_in_google": "Sign in with Google",
    "loading": "Loading...",
    "nav_dashboard": "Dashboard",
    "nav_bookings": "Bookings",
    "nav_services": "Services",
    "nav_support": "Support",
    "nav_profile": "Profile",
    "nav_notifications": "Notifications",
    "nav_favorites": "Favorites",
    "payment_cash": "Cash",
    "payment_card": "Card",
    "payment_upi": "UPI",
    "withdraw_bank": "Bank Transfer",
    "withdraw_upi": "UPI Withdrawal",
    "otp_title": "Verify OTP",
    "otp_desc": "Enter the 4-digit code sent to your mobile.",
    "otp_verify": "Verify & Complete",
    "otp_resend": "Resend Code",
    "otp_invalid": "Invalid OTP. Please try again.",
  },
  hi: {
    "app_title": "Servantra",
    "app_subtitle": "आपका शहर। आपकी सेवाएँ। एक ऐप।",
    "role_title": "आप Servantra का उपयोग कैसे करेंगे?",
    "role_customer_title": "👤 मुझे सेवा चाहिए",
    "role_customer_desc": "प्लंबर, इलेक्ट्रीशियन, क्लीनर आदि बुक करें",
    "role_vendor_title": "🛠️ मैं सेवा प्रदान करता हूँ",
    "role_vendor_desc": "अपनी सेवाओं को सूचीबद्ध करें और अपना व्यवसाय बढ़ाएं",
    "email_label": "ईमेल",
    "password_label": "पासवर्ड",
    "fullname_label": "पूरा नाम",
    "sign_in": "लॉग इन करें",
    "sign_up": "साइन अप करें",
    "already_have_account": "क्या आपके पास पहले से खाता है? लॉग इन करें",
    "dont_have_account": "खाता नहीं है? साइन अप करें",
    "forgot_password": "पासवर्ड भूल गए?",
    "or_continue_with": "या इसके साथ जारी रखें",
    "sign_in_google": "Google के साथ साइन इन करें",
    "loading": "लोड हो रहा है...",
    "nav_dashboard": "डैशबोर्ड",
    "nav_bookings": "बुकिंग",
    "nav_services": "सेवाएँ",
    "nav_support": "सहायता",
    "nav_profile": "प्रोफ़ाइल",
    "nav_notifications": "सूचनाएं",
    "nav_favorites": "पसंदीदा",
    "payment_cash": "नकद (Cash)",
    "payment_card": "कार्ड (Card)",
    "payment_upi": "UPI",
    "withdraw_bank": "बैंक ट्रांसफर",
    "withdraw_upi": "UPI निकासी",
    "otp_title": "OTP सत्यापित करें",
    "otp_desc": "अपने मोबाइल पर भेजे गए 4-अंकीय कोड को दर्ज करें।",
    "otp_verify": "सत्यापित करें और पूरा करें",
    "otp_resend": "कोड पुनः भेजें",
    "otp_invalid": "अमान्य OTP। कृपया पुनः प्रयास करें।",
  },
  bn: {
    "app_title": "Servantra",
    "app_subtitle": "আপনার শহর। আপনার পরিষেবা। একটি অ্যাপ।",
    "role_title": "আপনি Servantra কীভাবে ব্যবহার করবেন?",
    "role_customer_title": "👤 আমার পরিষেবা দরকার",
    "role_customer_desc": "প্লাম্বার, ইলেকট্রিশিয়ান, ক্লিনার ইত্যাদি বুক করুন",
    "role_vendor_title": "🛠️ আমি পরিষেবা প্রদান করি",
    "role_vendor_desc": "আপনার পরিষেবা তালিকাভুক্ত করুন এবং ব্যবসা বাড়ান",
    "email_label": "ইমেইল",
    "password_label": "পাসওয়ার্ড",
    "fullname_label": "পুরো নাম",
    "sign_in": "সাইন ইন করুন",
    "sign_up": "সাইন আপ করুন",
    "already_have_account": "ইতিমধ্যেই অ্যাকাউন্ট আছে? সাইন ইন করুন",
    "dont_have_account": "অ্যাকাউন্ট নেই? সাইন আপ করুন",
    "forgot_password": "পাসওয়ার্ড ভুলে গেছেন?",
    "or_continue_with": "অথবা চালিয়ে যান",
    "sign_in_google": "Google দিয়ে সাইন ইন করুন",
    "loading": "লোড হচ্ছে...",
  },
  ta: {
    "app_title": "Servantra",
    "app_subtitle": "உங்கள் நகரம். உங்கள் சேவைகள். ஒரு செயலி.",
    "role_title": "Servantra ஐ எவ்வாறு பயன்படுத்துவீர்கள்?",
    "role_customer_title": "👤 எனக்கு சேவைகள் தேவை",
    "role_customer_desc": "பிளம்பர், எலக்ட்ரீஷியன் மற்றும் பலரை முன்பதிவு செய்யுங்கள்",
    "role_vendor_title": "🛠️ நான் சேவைகளை வழங்குகிறேன்",
    "role_vendor_desc": "உங்கள் சேவைகளை பட்டியலிட்டு வணிகத்தை வளர்க்கவும்",
    "email_label": "மின்னஞ்சல்",
    "password_label": "கடவுச்சொல்",
    "fullname_label": "முழு பெயர்",
    "sign_in": "உள்நுழைக",
    "sign_up": "பதிவு செய்க",
    "already_have_account": "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக",
    "dont_have_account": "கணக்கு இல்லையா? பதிவு செய்க",
    "forgot_password": "கடவுச்சொல் மறந்துவிட்டதா?",
    "or_continue_with": "அல்லது இதனுடன் தொடரவும்",
    "sign_in_google": "Google உடன் உள்நுழைக",
    "loading": "ஏற்றுகிறது...",
  },
  te: {
    "app_title": "Servantra",
    "app_subtitle": "మీ నగరం. మీ సేవలు. ఒకే యాప్.",
    "role_title": "మీరు Servantra ని ఎలా ఉపయోగిస్తారు?",
    "role_customer_title": "👤 నాకు సేవలు కావాలి",
    "role_customer_desc": "ప్లంబర్లు, ఎలక్ట్రీషియన్లు & మరిన్ని బుక్ చేయండి",
    "role_vendor_title": "🛠️ నేను సేవలను అందిస్తాను",
    "role_vendor_desc": "మీ సేవలను జాబితా చేయండి & వ్యాపారాన్ని పెంచుకోండి",
    "email_label": "ఈమెయిల్",
    "password_label": "పాస్‌వర్డ్",
    "fullname_label": "పూర్తి పేరు",
    "sign_in": "సైన్ ఇన్ చేయండి",
    "sign_up": "సైన్ అప్ చేయండి",
    "already_have_account": "ఇప్పటికే ఖాతా ఉందా? సైన్ ఇన్ చేయండి",
    "dont_have_account": "ఖాతా లేదా? సైన్ అప్ చేయండి",
    "forgot_password": "పాస్‌వర్డ్ మర్చిపోయారా?",
    "or_continue_with": "లేదా దీనితో కొనసాగించండి",
    "sign_in_google": "Google తో సైన్ ఇన్ చేయండి",
    "loading": "లోడ్ అవుతోంది...",
  },
  mr: {
    "app_title": "Servantra",
    "app_subtitle": "तुमचे शहर. तुमच्या सेवा. एक ॲप.",
    "role_title": "तुम्ही Servantra कसे वापराल?",
    "role_customer_title": "👤 मला सेवा हवी आहे",
    "role_customer_desc": "प्लंबर, इलेक्ट्रिशियन आणि बरेच काही बुक करा",
    "role_vendor_title": "🛠️ मी सेवा पुरवतो",
    "role_vendor_desc": "तुमच्या सेवा सूचीबद्ध करा आणि व्यवसाय वाढवा",
    "email_label": "ईमेल",
    "password_label": "पासवर्ड",
    "fullname_label": "पूर्ण नाव",
    "sign_in": "साइन इन करा",
    "sign_up": "साइन अप करा",
    "already_have_account": "आधीच खाते आहे? साइन इन करा",
    "dont_have_account": "खाते नाही? साइन अप करा",
    "forgot_password": "पासवर्ड विसरलात?",
    "or_continue_with": "किंवा यासह सुरू ठेवा",
    "sign_in_google": "Google सह साइन इन करा",
    "loading": "लोड करत आहे...",
  },
  gu: {
    "app_title": "Servantra",
    "app_subtitle": "તમારું શહેર. તમારી સેવાઓ. એક એપ.",
    "role_title": "તમે Servantra નો ઉપયોગ કેવી રીતે કરશો?",
    "role_customer_title": "👤 મને સેવા જોઈએ છે",
    "role_customer_desc": "પ્લમ્બર, ઇલેક્ટ્રિશિયન વગેરે બુક કરો",
    "role_vendor_title": "🛠️ હું સેવા પ્રદાન કરું છું",
    "role_vendor_desc": "તમારી સેવાઓ લિસ્ટ કરો અને વ્યવસાય વધારો",
    "email_label": "ઈમેલ",
    "password_label": "પાસવર્ડ",
    "fullname_label": "પૂરું નામ",
    "sign_in": "સાઇન ઇન કરો",
    "sign_up": "સાઇન અપ કરો",
    "already_have_account": "શું તમારી પાસે પહેલેથી ખાતું છે? સાઇન ઇન કરો",
    "dont_have_account": "ખાતું નથી? સાઇન અપ કરો",
    "forgot_password": "પાસવર્ડ ભૂલી ગયા છો?",
    "or_continue_with": "અથવા આની સાથે ચાલુ રાખો",
    "sign_in_google": "Google સાથે સાઇન ઇન કરો",
    "loading": "લોડ થઈ રહ્યું છે...",
  },
  es: {
    "app_title": "Servantra",
    "app_subtitle": "Tu ciudad. Tus servicios. Una aplicación.",
    "role_title": "¿Cómo usarás Servantra?",
    "role_customer_title": "👤 Necesito servicios",
    "role_customer_desc": "Reserva fontaneros, electricistas y más",
    "role_vendor_title": "🛠️ Proveo servicios",
    "role_vendor_desc": "Enumera tus servicios y haz crecer tu negocio",
    "email_label": "Correo electrónico",
    "password_label": "Contraseña",
    "fullname_label": "Nombre completo",
    "sign_in": "Iniciar sesión",
    "sign_up": "Regístrate",
    "already_have_account": "¿Ya tienes una cuenta? Iniciar sesión",
    "dont_have_account": "¿No tienes cuenta? Regístrate",
    "forgot_password": "¿Olvidaste tu contraseña?",
    "or_continue_with": "o continuar con",
    "sign_in_google": "Iniciar sesión con Google",
    "loading": "Cargando...",
  },
  fr: {
    "app_title": "Servantra",
    "app_subtitle": "Votre ville. Vos services. Une application.",
    "role_title": "Comment allez-vous utiliser Servantra?",
    "role_customer_title": "👤 J'ai besoin de services",
    "role_customer_desc": "Réservez des plombiers, électriciens et plus",
    "role_vendor_title": "🛠️ Je fournis des services",
    "role_vendor_desc": "Listez vos services et développez votre activité",
    "email_label": "Email",
    "password_label": "Mot de passe",
    "fullname_label": "Nom complet",
    "sign_in": "Se connecter",
    "sign_up": "S'inscrire",
    "already_have_account": "Vous avez déjà un compte? Se connecter",
    "dont_have_account": "Pas de compte? S'inscrire",
    "forgot_password": "Mot de passe oublié?",
    "or_continue_with": "ou continuer avec",
    "sign_in_google": "Se connecter avec Google",
    "loading": "Chargement...",
  },
  wa: {
    "app_title": "Servantra",
    "app_subtitle": "Ur city. Ur services. 1 App fr.",
    "role_title": "What's the vibe?",
    "role_customer_title": "👤 I need a guy",
    "role_customer_desc": "Get plumbers, cleaners, whoever u need ASAP",
    "role_vendor_title": "🛠️ I'm the guy",
    "role_vendor_desc": "List ur stuff & get that bag 💰",
    "email_label": "Ur Email",
    "password_label": "Pass",
    "fullname_label": "Ur Name",
    "sign_in": "Let me in",
    "sign_up": "Make acc",
    "already_have_account": "Got an acc? Login bro",
    "dont_have_account": "New here? Sign up",
    "forgot_password": "Forgot pass? 💀",
    "or_continue_with": "or just use",
    "sign_in_google": "Google Login",
    "loading": "Hold up...",
  }
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("servantra_lang") as Language;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (language === lang) return;
    
    setLanguageState(lang);
    localStorage.setItem("servantra_lang", lang);
    
    if (lang !== 'wa') {
      if (lang === 'en') {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      } else {
        document.cookie = `googtrans=/en/${lang}; path=/`;
        document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
      }
      
      window.setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const t = (key: string) => {
    return translations[language][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
