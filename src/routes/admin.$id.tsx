import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { AdminGate } from "@/components/admin-gate";
import { Markdown } from "@/components/markdown";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin/$id")({
  component: () => (
    <AdminGate>
      <Editor />
    </AdminGate>
  ),
});

function Editor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    supabase.from("posts").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt ?? "");
      setContent(data.content ?? "");
      setTagsStr((data.tags ?? []).join(", "));
      setCoverImage(data.cover_image ?? "");
      setPublished(data.published);
    });
  }, [id, isNew]);

  useEffect(() => {
    if (isNew && title && !slug) setSlug(slugify(title));
  }, [title, isNew, slug]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadImage(f);
    if (url) setCoverImage(url);
  };

  const insertImage = async () => {
    fileRef.current?.click();
  };

  const onInline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadImage(f);
    if (url) setContent((c) => `${c}\n\n![${f.name}](${url})\n`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async (publish?: boolean) => {
    if (!title.trim() || !slug.trim()) {
      toast.error("title and slug required");
      return;
    }
    setBusy(true);
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    const finalPublished = publish ?? published;
    const payload = {
      title: title.trim(),
      slug: slugify(slug),
      excerpt: excerpt.trim() || null,
      content,
      tags,
      cover_image: coverImage || null,
      published: finalPublished,
      author_id: user!.id,
      published_at: finalPublished && !published ? new Date().toISOString() : undefined,
    };

    if (isNew) {
      const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("created");
      nav({ to: "/admin/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      setBusy(false);
      if (error) return toast.error(error.message);
      setPublished(finalPublished);
      toast.success("saved");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 w-full pt-10">
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-xs text-muted-foreground">// {isNew ? "new post" : "editing"}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPreview((p) => !p)}
              className="font-mono text-xs px-3 py-1.5 border hairline hover:border-foreground"
            >
              {preview ? "edit" : "preview"}
            </button>
            <button
              onClick={() => save(false)}
              disabled={busy}
              className="font-mono text-xs px-3 py-1.5 border hairline hover:border-foreground disabled:opacity-50"
            >
              save draft
            </button>
            <button
              onClick={() => save(true)}
              disabled={busy}
              className="font-mono text-xs px-3 py-1.5 border border-foreground bg-foreground text-background hover:opacity-80 disabled:opacity-50"
            >
              {published ? "update" : "publish"}
            </button>
          </div>
        </div>

        {preview ? (
          <article>
            <h1 className="font-serif text-5xl mb-6">{title || "Untitled"}</h1>
            {coverImage && <img src={coverImage} alt="" className="w-full rounded border hairline mb-8" />}
            <Markdown>{content}</Markdown>
          </article>
        ) : (
          <div className="space-y-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent outline-none font-serif text-4xl tracking-tight placeholder:text-muted-foreground/50"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug"
                className="bg-transparent border-b hairline outline-none font-mono text-sm py-1.5 focus:border-foreground"
              />
              <input
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="tags, comma, separated"
                className="bg-transparent border-b hairline outline-none font-mono text-sm py-1.5 focus:border-foreground"
              />
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="excerpt (1–2 lines)"
              rows={2}
              className="w-full bg-transparent border-b hairline outline-none text-sm py-1.5 resize-none focus:border-foreground"
            />

            <div className="flex items-center gap-3 pt-2">
              <label className="font-mono text-xs px-3 py-1.5 border hairline cursor-pointer hover:border-foreground">
                <input type="file" accept="image/*" className="hidden" onChange={onCover} />
                cover image
              </label>
              {coverImage && (
                <>
                  <img src={coverImage} alt="" className="h-10 w-16 object-cover rounded border hairline" />
                  <button
                    onClick={() => setCoverImage("")}
                    className="font-mono text-xs text-muted-foreground hover:text-destructive"
                  >
                    remove
                  </button>
                </>
              )}
            </div>

            <div className="border hairline rounded">
              <div className="flex justify-between border-b hairline px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground">markdown</span>
                <button
                  onClick={insertImage}
                  className="font-mono text-xs flex items-center gap-1.5 hover:text-foreground text-muted-foreground"
                >
                  <ImagePlus className="w-3 h-3" /> insert image
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onInline} />
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Write in markdown…"
                rows={20}
                className="w-full bg-transparent outline-none p-4 font-mono text-sm leading-relaxed resize-y"
              />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
