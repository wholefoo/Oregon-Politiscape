import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const navLinks = [
    { label: "Home", href: "/" },
    ...categories.map((cat) => ({
      label: cat.name,
      href: `/category/${cat.slug}`,
    })),
  ];

  return (
    <nav className="bg-[#1a2332] fixed top-0 left-0 right-0 z-50" aria-label="Main navigation" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-sans tracking-wide transition-colors duration-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap ${
                  location === link.href
                    ? "text-white border-b-2 border-amber-400"
                    : "text-gray-300 hover:text-white"
                }`}
                data-testid={`nav-link-${link.href.replace(/\//g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <a
            href="https://ballotpedia.org/Oregon_elections,_2026"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:block ml-2 px-3 py-2 text-sm font-sans border border-amber-500/50 text-amber-400 hover:text-amber-300 hover:border-amber-400 transition-colors duration-200 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap flex-shrink-0"
            data-testid="nav-link-ballotpedia"
          >
            Ballotpedia Oregon Elections, 2026
          </a>
          <div className="lg:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
              className="text-gray-300 no-default-hover-elevate no-default-active-elevate"
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden bg-[#1a2332] border-t border-gray-700 pb-3" data-testid="mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${
                location === link.href
                  ? "text-amber-400 bg-[#243044]"
                  : "text-gray-300 hover:text-white hover:bg-[#243044]"
              }`}
              data-testid={`mobile-nav-link-${link.href.replace(/\//g, "-")}`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://ballotpedia.org/Oregon_elections,_2026"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 text-amber-400 hover:text-amber-300 hover:bg-[#243044]"
            data-testid="mobile-nav-link-ballotpedia"
          >
            Ballotpedia Oregon Elections, 2026
          </a>
        </div>
      )}
    </nav>
  );
}
