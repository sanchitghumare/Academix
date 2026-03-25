
import "./globals.css";
import Navbar from "../components/navbar";
// import Footer from "../components/footer";
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
      <body className="bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-size-[20px_20px] text-white">
        <SessionWrapper> 
          <Navbar />
          <div className="min-h-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-size-[20px_20px] text-white">
            {children}
          </div>
          {/* <Footer /> */}
        </SessionWrapper>
      </body>
    </html>
  );
}