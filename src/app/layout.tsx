import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { URL_BASE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: {
    default: "Clareza — entenda seus números antes de decidir",
    template: "%s · Clareza",
  },
  description:
    "Simulador financeiro para autônomos e prestadores de serviço. Compare atuar como Pessoa Física ou CNPJ e veja quanto sobra no fim do mês, sem precisar entender de contabilidade.",
  applicationName: "Clareza",
  keywords: [
    "simulador financeiro",
    "autônomo",
    "CNPJ",
    "pessoa física",
    "prestador de serviço",
    "quanto sobra",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Clareza",
    title: "Clareza — entenda seus números antes de decidir",
    description:
      "Compare cenários financeiros como autônomo ou CNPJ e veja quanto realmente sobra no fim do mês.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clareza — entenda seus números antes de decidir",
    description:
      "Compare cenários financeiros como autônomo ou CNPJ e veja quanto realmente sobra no fim do mês.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Clareza",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only rounded-lg bg-accent px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
