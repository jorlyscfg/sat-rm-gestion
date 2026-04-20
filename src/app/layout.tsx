import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { createInsForgeServerClient } from "@/lib/insforge";
import { TopNav } from "@/components/layout/top-nav";
import { AuthSync } from "@/components/auth/auth-sync";
import { SessionProvider } from "@/components/auth/session-provider";
import type { Profile, UserRole } from "@/types";
import { logger } from "@/lib/logger";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SATS-RM | Gestión de Sargazo",
  description: "Sistema de Gestión Operativa para Respuesta al Sargazo",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488",
};

async function getProfile(): Promise<(Profile & { role: UserRole }) | null> {
  const accessToken = (await cookies()).get("insforge_access_token")?.value;
  if (!accessToken) return null;

  const insforge = createInsForgeServerClient(accessToken);
  const { data: userData, error: authError } = await insforge.auth.getCurrentUser();
  if (authError || !userData?.user) return null;

  const { data, error } = await insforge.database
    .from("profiles")
    .select()
    .eq("user_id", userData.user.id)
    .single();

  if (error || !data) return null;
  return data as Profile & { role: UserRole };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();
  logger.info('[RootLayout] Rendering', { hasProfile: !!profile, role: profile?.role });

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col bg-zinc-50">
        <SessionProvider profile={profile}>
          <AuthSync />
          <TopNav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}