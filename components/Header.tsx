// ============================================
// FILE: components/Header.tsx
// PURPOSE: Universal navigation header for all pages (except Dashboard)
// FIX: Removed white background bar issue
// LAST MODIFIED: December 19, 2024
// ============================================

"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Get user role from metadata
  const metadata = user?.unsafeMetadata as any;
  const userRole = metadata?.role || "SUPER_ADMIN";

  const getRoleBadge = () => {
    const badges: {
      [key: string]: { color: string; icon: string; label: string };
    } = {
      SUPER_ADMIN: {
        color: "from-red-500 to-pink-600",
        icon: "👑",
        label: "Super Admin",
      },
      AGENCY_ADMIN: {
        color: "from-blue-500 to-purple-600",
        icon: "🏢",
        label: "Agency Admin",
      },
      AGENCY_USER: {
        color: "from-green-500 to-teal-600",
        icon: "👤",
        label: "Member",
      },
    };
    return badges[userRole] || badges["SUPER_ADMIN"];
  };

  const roleBadge = getRoleBadge();

  // Navigation items
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/members", label: "Members", icon: "👥" },
    { href: "/agencies", label: "Agencies", icon: "🏢" },
    { href: "/events", label: "Events", icon: "📅" },
    { href: "/billing", label: "Billing", icon: "💰" },
    { href: "/documents", label: "Documents", icon: "📁" },
    { href: "/reports", label: "Reports", icon: "📈" },
  ];

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-2xl font-bold text-white hover:opacity-90 transition-opacity"
            >
              <span>⚡</span>
              <span>MemberHub Pro</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    pathname === item.href
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Info */}
          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div
              className={`hidden sm:flex px-3 py-1 bg-gradient-to-r ${roleBadge.color} rounded-full items-center gap-2`}
            >
              <span>{roleBadge.icon}</span>
              <span className="text-white text-sm font-medium">
                {roleBadge.label}
              </span>
            </div>

            {/* User Name */}
            <div className="hidden sm:block text-white/80">
              <span className="text-sm">Welcome, </span>
              <span className="font-medium">{user?.firstName || "User"}</span>
            </div>

            {/* User Button */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => {
                // You can implement a mobile menu here if needed
                alert("Mobile menu coming soon!");
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
