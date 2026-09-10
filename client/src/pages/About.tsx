import Layout from "@/components/Layout";
import HeroBanner from "@/components/HeroBanner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

export default function About() {
  return (
    <Layout>
      <SEOHead
        title="About Us"
        description="Oregon Politiscape exists to equip Oregonians with clear, principled analysis of the political landscape — rooted in the founding ideals of the American republic and constitutional governance."
        canonicalPath="/about"
        ogImage="/images/header-banner.png"
      />

      <HeroBanner
        image="/images/header-banner.png"
        alt="About Oregon Politiscape"
        title="About Us"
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16" data-testid="section-about">
        <div className="border-b-2 border-amber-700 dark:border-amber-500 pb-1 mb-8">
          <h2 className="font-serif text-xs uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
            Our Mission
          </h2>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed">
          <p className="text-foreground/90">
            Oregon Politiscape believes in the power of active citizenship, providing readers
            with resources to understand the intricacies of Oregon's politics and encouraging
            them to engage in informed discourse.
          </p>
          <p className="text-foreground/90">
            It stands as an essential resource for Oregonians and political enthusiasts seeking
            to understand and contribute to the political processes that shape their communities.
          </p>
          <p className="text-foreground/90">
            Through in-depth articles on founding documents, the legacy of the Founding Fathers,
            and the evolving political spectrum of Oregon, we aim to foster a deeper understanding
            of the principles that guide our republic.
          </p>
        </div>

        <div className="mt-10">
          <Link href="/contact">
            <Button size="lg" data-testid="button-get-in-touch">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
