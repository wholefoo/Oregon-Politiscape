import { Link } from "wouter";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Blog Articles", href: "/posts" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a2332] text-gray-300 py-10 mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
                data-testid={`footer-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://ballotpedia.org/Oregon_elections,_2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
              data-testid="footer-link-ballotpedia"
            >
              Ballotpedia Oregon Elections, 2026
            </a>
          </nav>
          <p className="text-xs text-gray-500" data-testid="text-copyright">
            Oregon Politiscape
          </p>
        </div>
      </div>
    </footer>
  );
}
