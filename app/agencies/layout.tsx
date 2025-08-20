// app/agencies/layout.tsx
// Layout wrapper to ensure consistent styling with the rest of the site

import Header from "@/components/Header";

export default function AgenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto">{children}</div>
      </main>
    </div>
  );
}
