import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sambhav Saxena" },
      { name: "description", content: "Sambhav Saxena — Full-stack engineer working on AI workflows, integrations and Frappe." },
      { property: "og:title", content: "About — Sambhav Saxena" },
      { property: "og:description", content: "Full-stack engineer in India." },
    ],
  }),
  component: About,
});

const links = [
  { label: "github", href: "https://github.com/sambhavsaxena" },
  { label: "linkedin", href: "https://linkedin.com/in/sambhavsaxena" },
  { label: "twitter", href: "https://twitter.com/_sambhavsaxena" },
  { label: "mail", href: "mailto:sambhavsaxena02@gmail.com" },
];

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto px-6 w-full pt-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="font-mono text-xs text-muted-foreground mb-4">// about</p>
          <h1 className="font-serif text-5xl tracking-tight leading-[1.1]">
            Hi,
          </h1>
        </motion.div>

        <div className="mt-10 space-y-6 text-[15px] leading-[1.8] text-foreground/85">
          <p className="text-justify">
            I'm Sambhav. I'm love working on near real time, distributed, highly scalable systems for clients across industries.
            My expertize includes but is not limited to finance+tech products, lending, tickers, trading software, real-time communication and other performant systems.
          </p>
          <p className="text-justify">
              I write about tech, finance, business, history, culture, science, stars and human behaviour.
            </p>
        </div>

        <div className="mt-12 border-t hairline pt-6">
          <p className="font-mono text-xs text-muted-foreground mb-4">// elsewhere</p>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={l.label !== "mail" ? "_blank" : undefined}
                  rel="noreferrer"
                  className="font-mono text-sm hover:italic block py-1"
                >
                  → {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
