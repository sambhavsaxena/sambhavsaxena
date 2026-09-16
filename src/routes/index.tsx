import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useDebounced } from "@/hooks/use-debounced";
import { sanitizeTerm, toIlikePattern } from "@/lib/search";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const PAGE_SIZE = 8;
const TAGS_COLLAPSED = 12;

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
}

function Home() {
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showAllTags, setShowAllTags] = useState(false);

  const search = useDebounced(q.trim());

  // Any change to the filters invalidates the current page offset.
  useEffect(() => {
    setPage(0);
  }, [search, activeTag]);

  // Tags come from every published post, not just the visible page.
  const { data: allTags = [] } = useQuery({
    queryKey: ["posts", "tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("tags")
        .eq("published", true);
      if (error) throw error;
      const s = new Set<string>();
      data.forEach((p) => (p.tags ?? []).forEach((t) => s.add(t)));
      return Array.from(s).sort();
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["posts", "published", { search, activeTag, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(
          "id,slug,title,excerpt,tags,view_count,like_count,published_at,created_at",
          { count: "exact" },
        )
        .eq("published", true);

      if (activeTag) query = query.contains("tags", [activeTag]);

      if (search) {
        const pattern = toIlikePattern(search);
        // `cs` is an exact tag match; the ilike arms cover partial text.
        const tag = sanitizeTerm(search).toLowerCase();
        query = query.or(
          `title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern},tags.cs.{${tag}}`,
        );
      }

      const from = page * PAGE_SIZE;
      const { data, error, count } = await query
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { posts: (data ?? []) as PostRow[], count: count ?? 0 };
    },
  });

  const posts = data?.posts ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(search || activeTag);

  const visibleTags = useMemo(
    () => (showAllTags ? allTags : allTags.slice(0, TAGS_COLLAPSED)),
    [allTags, showAllTags],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 w-full">
        <section className="pt-20 pb-12">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight"
          >
            Notes from my{" "}
            <span className="italic text-muted-foreground">localhost</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-6 text-muted-foreground max-w-xl leading-relaxed"
          >
            A place where I write not just about engineering or the projects I build, but also the
            things I'm thinking through.
          </motion.p>
        </section>

        <section className="border-t hairline pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search posts or tags…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground py-1"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
              >
                clear
              </button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              <button
                onClick={() => setActiveTag(null)}
                className={`text-xs font-mono px-2.5 py-1 border transition-colors ${activeTag === null
                    ? "border-foreground text-foreground"
                    : "hairline text-muted-foreground hover:text-foreground"
                  }`}
              >
                all
              </button>
              {visibleTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t === activeTag ? null : t)}
                  className={`text-xs font-mono px-2.5 py-1 border transition-colors ${activeTag === t
                      ? "border-foreground text-foreground"
                      : "hairline text-muted-foreground hover:text-foreground"
                    }`}
                >
                  #{t}
                </button>
              ))}
              {allTags.length > TAGS_COLLAPSED && (
                <button
                  onClick={() => setShowAllTags((v) => !v)}
                  className="text-xs font-mono px-2.5 py-1 border hairline text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllTags
                    ? "show less"
                    : `show more (+${allTags.length - TAGS_COLLAPSED})`}
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <p className="text-muted-foreground text-sm font-mono">loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-sm font-mono py-12">
              {hasFilters ? "no matches." : "no posts yet."}
            </p>
          ) : (
            <ul
              className={`divide-y divide-hairline transition-opacity ${isFetching ? "opacity-60" : ""
                }`}
            >
              {posts.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="py-6 group"
                >
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                    <div className="flex items-baseline justify-between gap-4 mb-1.5">
                      <h2 className="font-serif text-2xl tracking-tight group-hover:italic transition-all">
                        {p.title}
                      </h2>
                      <time className="font-mono text-xs text-muted-foreground shrink-0">
                        {new Date(p.published_at ?? p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    {p.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                        {p.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      {p.tags.length > 0 && (
                        <span>{p.tags.map((t) => `#${t}`).join(" ")}</span>
                      )}
                      <span className="ml-auto flex gap-3">
                        <span>{p.view_count} views</span>
                        <span>♡ {p.like_count}</span>
                      </span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="flex items-center justify-between gap-4 border-t hairline mt-2 pt-6 font-mono text-xs">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="px-2.5 py-1 border hairline text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
      >
        ← prev
      </button>
      <span className="text-muted-foreground">
        {page + 1} / {pageCount}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        className="px-2.5 py-1 border hairline text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
      >
        next →
      </button>
    </nav>
  );
}
