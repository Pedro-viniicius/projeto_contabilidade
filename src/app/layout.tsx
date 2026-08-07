import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { StatusModelo } from "@/components/layout/status-modelo";
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
    default: "Clareza — simulador tributário para contadores",
    template: "%s · Clareza",
  },
  description:
    "Ferramenta de apoio à decisão para contadores: compare cenários Pessoa Física e CNPJ, veja o impacto mensal e anual e audite as premissas de cálculo.",
  applicationName: "Clareza",
  keywords: [
    "simulador tributário",
    "contador",
    "pessoa física",
    "CNPJ",
    "pró-labore",
    "comparação tributária",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Clareza",
    title: "Clareza — simulador tributário para contadores",
    description:
      "Compare cenários Pessoa Física e CNPJ, veja o impacto mensal e anual e audite as premissas de cálculo.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clareza — simulador tributário para contadores",
    description:
      "Compare cenários Pessoa Física e CNPJ e audite as premissas de cálculo.",
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
    { media: "(prefers-color-scheme: light)", color: "#f6f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e10" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only rounded-md bg-accent px-3 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50"
        >
          Pular para o conteúdo
        </a>
        <AppShell statusModelo={<StatusModelo />}>{children}</AppShell>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
