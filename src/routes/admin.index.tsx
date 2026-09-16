import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { AdminGate } from "@/components/admin-gate";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminGate>
      <AdminList />
    </AdminGate>
  ),
});

const PAGE_SIZE = 15;

function AdminList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-posts", page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const { data, error, count } = await supabase
        .from("posts")
        .select("id,slug,title,published,view_count,like_count,updated_at", {
          count: "exact",
        })
        .order("updated_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { posts: data ?? [], count: count ?? 0 };
    },
  });

  const posts = data?.posts ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // A delete can empty the last page; step back so the list is never blank.
  useEffect(() => {
    if (page > 0 && page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("deleted");
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 w-full pt-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="font-mono text-xs text-muted-foreground">// admin</p>
            <h1 className="font-serif text-4xl mt-1">Your posts</h1>
          </div>
          <Link
            to="/admin/$id"
            params={{ id: "new" }}
            className="font-mono text-xs px-3 py-2 border border-foreground hover:bg-foreground hover:text-background flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> new
          </Link>
        </div>
        {isLoading ? (
          <p className="font-mono text-sm text-muted-foreground">loading…</p>
        ) : posts.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">
            no posts yet — write your first.
          </p>
        ) : (
          <ul
            className={`divide-y divide-hairline transition-opacity ${
              isFetching ? "opacity-60" : ""
            }`}
          >
            {posts.map((p) => (
              <li key={p.id} className="py-4 flex items-center justify-between gap-4">
                <Link to="/admin/$id" params={{ id: p.id }} className="flex-1 min-w-0">
                  <div className="font-serif text-lg truncate hover:italic">{p.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-1 flex gap-3">
                    <span>{p.published ? "published" : "draft"}</span>
                    <span>·</span>
                    <span>{p.view_count} views</span>
                    <span>·</span>
                    <span>{p.like_count} likes</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    if (confirm("delete this post?")) del.mutate(p.id);
                  }}
                  className="text-muted-foreground hover:text-destructive p-2"
                  aria-label="delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <nav className="flex items-center justify-between gap-4 border-t hairline mt-2 pt-6 font-mono text-xs">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-2.5 py-1 border hairline text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
            >
              ← prev
            </button>
            <span className="text-muted-foreground">
              {page + 1} / {pageCount} · {total} posts
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pageCount - 1}
              className="px-2.5 py-1 border hairline text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
            >
              next →
            </button>
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
