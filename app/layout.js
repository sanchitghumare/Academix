
import "./globals.css";
import Navbar from "../components/navbar";
import SessionWrapper from "../components/sessionwrapper"; 

export const metadata = {
  title: "Stratos",
  description: "Stratos is a platform that helps you track your attendance and progress in your learning journey. We provide you with real-time analytics and insights to help you stay on track and achieve your goals.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.io.png",
    shortcut: "/favicon.io.png",
    apple: "/favicon.io.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stratos",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#06b6d4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b1120] text-white antialiased">
        <SessionWrapper> 
          <Navbar />
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(79,209,255,0.08),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(110,231,183,0.06),transparent_24%),linear-gradient(180deg,#0b1120_0%,#111827_100%)] text-white">
            {children}
          </div>
          {/* <Footer /> */}
        </SessionWrapper>
      </body>
    </html>
  );
}