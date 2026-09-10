import Layout from "@/components/Layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="not-found-page">
        <h1 className="font-serif text-5xl mb-4 text-foreground">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="text-amber-700 dark:text-amber-400 hover:underline font-serif text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
          data-testid="link-go-home"
        >
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
