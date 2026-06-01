import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: { translation: {
    dashboard: "Dashboard", profile: "Profile", attendance: "Attendance",
    leaves: "Leaves", payslips: "Payslips", documents: "Documents",
    assets: "Assets", notifications: "Notifications", messages: "Messages",
    settings: "Settings", login: "Login", logout: "Logout",
    welcomeBack: "Welcome back", checkIn: "Check In", checkOut: "Check Out",
  }},
  hi: { translation: {
    dashboard: "डैशबोर्ड", profile: "प्रोफ़ाइल", attendance: "उपस्थिति",
    leaves: "अवकाश", payslips: "वेतन पर्ची", documents: "दस्तावेज़",
    assets: "संपत्तियाँ", notifications: "सूचनाएँ", messages: "संदेश",
    settings: "सेटिंग्स", login: "लॉगिन", logout: "लॉगआउट",
    welcomeBack: "वापसी पर स्वागत है", checkIn: "चेक इन", checkOut: "चेक आउट",
  }},
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources, fallbackLng: "en", interpolation: { escapeValue: false },
});
export default i18n;
