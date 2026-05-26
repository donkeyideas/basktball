import { Bebas_Neue, Archivo, JetBrains_Mono } from "next/font/google";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const archivo = Archivo({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bebas.variable} ${archivo.variable} ${jbMono.variable}`}>
      {children}
    </div>
  );
}
