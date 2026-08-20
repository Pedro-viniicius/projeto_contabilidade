import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { SCRIPT_TEMA } from "@/components/tema/preferencia-tema";
import { URL_BASE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: {
    default: "Clareza — área de trabalho tributária para contadores",
    template: "%s · Clareza",
  },
  description:
    "Área de trabalho para contadores: compare cenários Pessoa Física e CNPJ, audite a composição dos encargos e acompanhe o estágio de validação das premissas em uma única tela.",
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
    title: "Clareza — área de trabalho tributária para contadores",
    description:
      "Compare cenários Pessoa Física e CNPJ, audite a composição dos encargos e as premissas de cálculo.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clareza — área de trabalho tributária para contadores",
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
    /*
      `suppressHydrationWarning`: o script de tema grava `data-tema` no
      <html> antes da hidratação, de propósito. Sem isso o React acusa
      divergência com o HTML do servidor — que não tem como conhecer a
      preferência do aparelho. Vale só para este elemento.
    */
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {/*
          Aplica o tema escolhido antes da primeira pintura. Sem isso a
          tela pisca clara antes da hidratação para quem escolheu escuro.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <a
          href="#conteudo"
          className="sr-only rounded-md bg-accent px-3 py-2 text-sm text-sobre-acento focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50"
        >
          Pular para o conteúdo
        </a>
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
