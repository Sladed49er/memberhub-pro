// app/agencies/layout.tsx
// Layout wrapper to ensure consistent styling with the rest of the site

import Header from "@/components/Header";

export default function AgenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  );
}
