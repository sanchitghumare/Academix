
import "./globals.css";
import SessionWrapper from "../components/sessionwrapper";
export const metadata = {
  title: "Academix",
  description: "Academix is a platform that helps you track your attendance and progress in your learning journey. We provide you with real-time analytics and insights to help you stay on track and achieve your goals.",
  manifest: "/manifest.json?v=2",
  icons: {
    icon: "/favicon.io.png",
    shortcut: "/favicon.io.png",
    apple: "/favicon.io.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Academix",
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
          <div className="min-h-screen bg-[#09090b] text-white">
            {children}
          </div>
          {/* <Footer /> */}
        </SessionWrapper>
      </body>
    </html>
  );
}