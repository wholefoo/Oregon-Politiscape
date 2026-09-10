import { useState, useEffect, useRef, useCallback } from "react";
import { processContent } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Article, Category, ContactMessage, PipelineRun, RssFeed, PipelineSettings } from "@shared/schema";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  FileText,
  FolderOpen,
  Mail,
  Save,
  X,
  Eye,
  Code,
  ArrowLeft,
  Zap,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Rss,
  ToggleLeft,
  ToggleRight,
  Loader2,
  FlaskConical,
  Youtube,
} from "lucide-react";

type ArticleSummary = Omit<Article, "content">;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function ArticleEditor({
  article,
  categories,
  onSave,
  onCancel,
  isPending,
}: {
  article?: Article;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage || "");
  const [categoryId, setCategoryId] = useState<string>(
    article?.categoryId?.toString() || (categories[0]?.id?.toString() || "")
  );
  const [published, setPublished] = useState(article?.published ?? true);
  const [autoSlug, setAutoSlug] = useState(!article);
  const [previewMode, setPreviewMode] = useState(false);
  const [editorMode, setEditorMode] = useState<"text" | "html">("html");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      const { url } = await res.json();
      const textarea = textareaRef.current;
      const insertion = editorMode === "html"
        ? `\n<img src="${url}" alt="${file.name}" />\n`
        : `\n![${file.name}](${url})\n`;
      if (textarea) {
        const pos = textarea.selectionStart;
        setContent(prev => prev.substring(0, pos) + insertion + prev.substring(pos));
      } else {
        setContent(prev => prev + insertion);
      }
      toast({ title: "Image uploaded", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [toast, editorMode]);

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  const handleSubmit = () => {
    onSave({
      title,
      slug,
      excerpt,
      content,
      featuredImage: featuredImage || null,
      categoryId: parseInt(categoryId),
      published,
    });
  };

  const insertSnippet = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const sel = content.substring(start, end);
    const isHtml = editorMode === "html";
    let insertion = "";

    switch (tag) {
      case "bold":
        insertion = isHtml ? `<strong>${sel || "bold text"}</strong>` : `**${sel || "bold text"}**`;
        break;
      case "italic":
        insertion = isHtml ? `<em>${sel || "italic text"}</em>` : `*${sel || "italic text"}*`;
        break;
      case "h1":
        insertion = isHtml ? `\n<h1>${sel || "Heading 1"}</h1>\n` : `\n# ${sel || "Heading 1"}\n`;
        break;
      case "h2":
        insertion = isHtml ? `\n<h2>${sel || "Heading 2"}</h2>\n` : `\n## ${sel || "Heading 2"}\n`;
        break;
      case "h3":
        insertion = isHtml ? `\n<h3>${sel || "Heading 3"}</h3>\n` : `\n### ${sel || "Heading 3"}\n`;
        break;
      case "link":
        insertion = isHtml
          ? `<a href="https://example.com">${sel || "link text"}</a>`
          : `[${sel || "link text"}](https://example.com)`;
        break;
      case "image":
        insertion = isHtml
          ? `<img src="https://example.com/image.jpg" alt="${sel || "alt text"}" />`
          : `![${sel || "alt text"}](https://example.com/image.jpg)`;
        break;
      case "ul":
        insertion = isHtml
          ? `\n<ul>\n  <li>${sel || "List item"}</li>\n</ul>\n`
          : `\n- ${sel || "List item"}\n`;
        break;
      case "ol":
        insertion = isHtml
          ? `\n<ol>\n  <li>${sel || "List item"}</li>\n</ol>\n`
          : `\n1. ${sel || "List item"}\n`;
        break;
      case "blockquote":
        insertion = isHtml
          ? `\n<blockquote>${sel || "Quote"}</blockquote>\n`
          : `\n> ${sel || "Quote"}\n`;
        break;
      case "code":
        if (isHtml) {
          insertion = sel.includes("\n") ? `\n<pre><code>${sel}</code></pre>\n` : `<code>${sel || "code"}</code>`;
        } else {
          insertion = sel.includes("\n") ? `\n\`\`\`\n${sel}\n\`\`\`\n` : `\`${sel || "code"}\``;
        }
        break;
      case "hr":
        insertion = isHtml ? `\n<hr />\n` : `\n---\n`;
        break;
      case "div":
        insertion = `\n<div>\n  ${sel}\n</div>\n`;
        break;
      case "p":
        insertion = `<p>${sel || "Paragraph text"}</p>\n`;
        break;
      case "span":
        insertion = `<span>${sel || "text"}</span>`;
        break;
      default:
        insertion = sel;
    }

    const newContent = content.substring(0, start) + insertion + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} data-testid="button-back-to-list">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={published}
              onCheckedChange={setPublished}
              data-testid="switch-published"
            />
            <Label>Published</Label>
          </div>
          <Button onClick={handleSubmit} disabled={isPending || !title || !content || !categoryId} data-testid="button-save-article">
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Input
            placeholder="Article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold"
            data-testid="input-article-title"
          />

          <div className="flex items-center gap-2">
            <Input
              placeholder="url-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              className="font-mono text-sm"
              data-testid="input-article-slug"
            />
          </div>

          <Textarea
            placeholder="Brief excerpt / summary"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            data-testid="input-article-excerpt"
          />

          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1 p-2 bg-muted border-b flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("bold")} title="Bold" data-testid="button-format-bold">
                <strong>B</strong>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("italic")} title="Italic" data-testid="button-format-italic">
                <em>I</em>
              </Button>
              <span className="w-px h-6 bg-border mx-1" />
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("h1")} title="Heading 1" data-testid="button-format-h1">
                H1
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("h2")} title="Heading 2" data-testid="button-format-h2">
                H2
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("h3")} title="Heading 3" data-testid="button-format-h3">
                H3
              </Button>
              <span className="w-px h-6 bg-border mx-1" />
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("link")} title="Link" data-testid="button-format-link">
                🔗
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("image")} title="Insert image URL" data-testid="button-format-image">
                🖼️
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload image from computer"
                data-testid="button-upload-image"
              >
                {isUploading ? "⏳" : "📤"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                data-testid="input-image-file"
              />
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("ul")} title="Unordered List" data-testid="button-format-ul">
                • List
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("ol")} title="Ordered List" data-testid="button-format-ol">
                1. List
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("blockquote")} title="Blockquote" data-testid="button-format-quote">
                ❝
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("code")} title="Code" data-testid="button-format-code">
                {"</>"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => insertSnippet("hr")} title="Horizontal Rule" data-testid="button-format-hr">
                ―
              </Button>
              {editorMode === "html" && (
                <>
                  <span className="w-px h-6 bg-border mx-1" />
                  <Button size="sm" variant="ghost" onClick={() => insertSnippet("p")} title="Paragraph" data-testid="button-format-p">
                    P
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => insertSnippet("div")} title="Div block" data-testid="button-format-div">
                    div
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => insertSnippet("span")} title="Span" data-testid="button-format-span">
                    span
                  </Button>
                </>
              )}
              <span className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditorMode(editorMode === "text" ? "html" : "text")}
                title="Toggle between Text (Markdown) and HTML editing mode"
                data-testid="button-toggle-mode"
                className={editorMode === "html" ? "border-amber-500 text-amber-700 dark:text-amber-400" : ""}
              >
                {editorMode === "html" ? <><Code className="h-4 w-4 mr-1" /> HTML</> : <>Text</>}
              </Button>
              <Button
                size="sm"
                variant={previewMode ? "default" : "outline"}
                onClick={() => setPreviewMode(!previewMode)}
                data-testid="button-toggle-preview"
              >
                {previewMode ? <><Code className="h-4 w-4 mr-1" /> Edit</> : <><Eye className="h-4 w-4 mr-1" /> Preview</>}
              </Button>
            </div>

            {previewMode ? (
              <div
                className="p-4 min-h-[400px] prose prose-sm max-w-none dark:prose-invert"
                data-testid="content-preview"
                dangerouslySetInnerHTML={{ __html: processContent(content) }}
              />
            ) : (
              <Textarea
                ref={textareaRef}
                placeholder={editorMode === "html" ? "Write HTML here... e.g. <p>Hello world</p>" : "Write your content here... (Markdown supported)"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] rounded-none border-0 font-mono text-sm resize-y"
                data-testid="input-article-content"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) handleImageUpload(file);
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()} data-testid={`select-category-${cat.id}`}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Image URL or path"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                data-testid="input-featured-image"
              />
              {featuredImage && (
                <img
                  src={featuredImage}
                  alt="Preview"
                  className="w-full rounded border object-cover max-h-40"
                  data-testid="img-featured-preview"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ArticlesList({
  onEdit,
  onNew,
}: {
  onEdit: (id: number) => void;
  onNew: () => void;
}) {
  const { toast } = useToast();

  const { data: articles, isLoading } = useQuery<ArticleSummary[]>({
    queryKey: ["/api/admin/articles"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article deleted" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login?returnTo=/admin"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const categoryMap = new Map(categories?.map((c) => [c.id, c.name]) || []);

  if (isLoading) {
    return <div className="text-center py-10 text-muted-foreground">Loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-articles-heading">Articles ({articles?.length || 0})</h2>
        <Button onClick={onNew} data-testid="button-new-article">
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>
      <div className="space-y-2">
        {articles?.map((article) => (
          <Card key={article.id} className="hover:bg-muted/50 transition-colors" data-testid={`card-article-${article.id}`}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate" data-testid={`text-article-title-${article.id}`}>{article.title}</h3>
                  {!article.published && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-200" data-testid={`badge-draft-${article.id}`}>
                      Draft
                    </span>
                  )}
                  {article.excerpt?.startsWith("[AI Draft]") && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1" data-testid={`badge-ai-${article.id}`}>
                      <Zap className="h-3 w-3" /> AI Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {categoryMap.get(article.categoryId) || "No category"} · /{article.slug}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <Button size="sm" variant="ghost" onClick={() => onEdit(article.id)} data-testid={`button-edit-article-${article.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive" data-testid={`button-delete-article-${article.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete article?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{article.title}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(article.id)} data-testid="button-confirm-delete">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface CategoryMatchResult {
  scores: { id: number; name: string; slug: string; score: number }[];
  winner: { id: number; name: string; slug: string; score: number } | null;
}

function CategoriesPanel() {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [testHeadline, setTestHeadline] = useState("");
  const [testSummary, setTestSummary] = useState("");
  const [testResult, setTestResult] = useState<CategoryMatchResult | null>(null);
  const [testPending, setTestPending] = useState(false);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description: string; keywords: string }) => {
      if (editing) {
        await apiRequest("PATCH", `/api/admin/categories/${editing.id}`, data);
      } else {
        await apiRequest("POST", "/api/admin/categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: editing ? "Category updated" : "Category created" });
      resetForm();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login?returnTo=/admin"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login?returnTo=/admin"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEditing(null);
    setAdding(false);
    setName("");
    setSlug("");
    setDescription("");
    setKeywords("");
    setTestHeadline("");
    setTestSummary("");
    setTestResult(null);
  };

  const runTestMatch = async () => {
    if (!testHeadline.trim() || !categories) return;
    setTestPending(true);
    setTestResult(null);
    try {
      const categoriesPayload = categories.map((cat) =>
        cat.id === editing?.id
          ? { id: cat.id, slug: cat.slug, name: cat.name, keywords: keywords.trim() || null }
          : { id: cat.id, slug: cat.slug, name: cat.name, keywords: cat.keywords || null }
      );
      const res = await apiRequest("POST", "/api/admin/pipeline/test-category", {
        headline: testHeadline.trim(),
        summary: testSummary.trim(),
        categories: categoriesPayload,
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      toast({ title: "Test failed", description: err.message, variant: "destructive" });
    } finally {
      setTestPending(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setAdding(true);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setKeywords(cat.keywords || "");
  };

  const startAdd = () => {
    resetForm();
    setAdding(true);
  };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-categories-heading">Categories ({categories?.length || 0})</h2>
        <Button onClick={startAdd} data-testid="button-new-category">
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="Category name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editing) setSlug(slugify(e.target.value));
              }}
              data-testid="input-category-name"
            />
            <Input
              placeholder="url-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono text-sm"
              data-testid="input-category-slug"
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-category-description"
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Matching Keywords (comma-separated)</Label>
              <Textarea
                placeholder="e.g. constitution, bill of rights, amendment, founding document"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={3}
                className="text-sm font-mono"
                data-testid="input-category-keywords"
              />
              <p className="text-xs text-muted-foreground">
                Keywords used to automatically assign AI-generated articles to this category. Leave blank to use defaults.
              </p>
            </div>
            <div className="border rounded-md p-3 space-y-2 bg-muted/30">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                Test Matching
              </Label>
              <p className="text-xs text-muted-foreground">
                Paste a headline and summary to see which category would win with the current (unsaved) keyword list.
              </p>
              <Input
                placeholder="Headline"
                value={testHeadline}
                onChange={(e) => { setTestHeadline(e.target.value); setTestResult(null); }}
                className="text-sm"
                data-testid="input-test-headline"
              />
              <Textarea
                placeholder="Summary (optional)"
                value={testSummary}
                onChange={(e) => { setTestSummary(e.target.value); setTestResult(null); }}
                rows={2}
                className="text-sm"
                data-testid="input-test-summary"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={runTestMatch}
                disabled={testPending || !testHeadline.trim()}
                data-testid="button-test-match"
              >
                {testPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5 mr-1.5" />}
                {testPending ? "Testing…" : "Test"}
              </Button>
              {testResult && (
                <div className="space-y-1.5 pt-1" data-testid="div-test-result">
                  <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${testResult.winner && testResult.winner.score > 0 ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"}`}>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Winner: <strong>{testResult.winner?.name ?? "None"}</strong>
                      {testResult.winner && (
                        <span className="ml-1.5 font-normal text-xs opacity-75">
                          (score: {testResult.winner.score}{testResult.winner.score === 0 ? " — fallback, no keywords matched" : ""})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[...testResult.scores]
                      .sort((a, b) => b.score - a.score)
                      .map((s) => (
                        <span
                          key={s.id}
                          className={`text-xs px-2 py-0.5 rounded-full border ${s.id === testResult.winner?.id ? "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 font-semibold" : "bg-muted border-border text-muted-foreground"}`}
                          data-testid={`badge-score-${s.id}`}
                        >
                          {s.name}: {s.score}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => saveMutation.mutate({ name, slug, description, keywords: keywords.trim() || "" })}
                disabled={saveMutation.isPending || !name || !slug}
                data-testid="button-save-category"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={resetForm} data-testid="button-cancel-category">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {categories?.map((cat) => (
          <Card key={cat.id} data-testid={`card-category-${cat.id}`}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div>
                <h3 className="font-medium" data-testid={`text-category-name-${cat.id}`}>{cat.name}</h3>
                <p className="text-sm text-muted-foreground">
                  /{cat.slug}{cat.description ? ` · ${cat.description}` : ""}
                </p>
                {cat.keywords?.trim() ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5" data-testid={`text-category-keywords-${cat.id}`}>
                    {cat.keywords.split(",").filter(k => k.trim()).length} custom keyword{cat.keywords.split(",").filter(k => k.trim()).length !== 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 mt-0.5" data-testid={`text-category-keywords-default-${cat.id}`}>
                    Using default keywords
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(cat)} data-testid={`button-edit-category-${cat.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive" data-testid={`button-delete-category-${cat.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete category?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{cat.name}". Articles in this category will need to be reassigned.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(cat.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MessagesPanel() {
  const { data: messages, isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/messages"],
  });

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" data-testid="text-messages-heading">Contact Messages ({messages?.length || 0})</h2>
      <div className="space-y-2">
        {messages?.length === 0 && (
          <p className="text-muted-foreground text-center py-10">No messages yet.</p>
        )}
        {messages?.map((msg) => (
          <Card key={msg.id} data-testid={`card-message-${msg.id}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium" data-testid={`text-message-name-${msg.id}`}>{msg.name}</span>
                <span className="text-xs text-muted-foreground">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1" data-testid={`text-message-email-${msg.id}`}>{msg.email}</p>
              <p className="text-sm" data-testid={`text-message-body-${msg.id}`}>{msg.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface PipelineRunResult {
  sourcesChecked: number;
  articlesGenerated: number;
  status: "success" | "partial" | "error";
  errorMessage?: string;
}

function PipelinePanel({ onEditArticle, categories }: { onEditArticle: (id: number) => void; categories: Category[] }) {
  const { toast } = useToast();
  const [maxArticlesInput, setMaxArticlesInput] = useState<string>("");
  const [notificationEmailInput, setNotificationEmailInput] = useState<string>("");
  const [emailInitialized, setEmailInitialized] = useState(false);

  const { data: runs, isLoading: runsLoading, refetch: refetchRuns } = useQuery<PipelineRun[]>({
    queryKey: ["/api/admin/pipeline/runs"],
  });

  const { data: aiDrafts, isLoading: draftsLoading } = useQuery<ArticleSummary[]>({
    queryKey: ["/api/admin/articles"],
    select: (arts) => arts.filter((a) => !a.published && a.excerpt?.startsWith("[AI Draft]")),
  });

  const { data: pipelineSettingsData } = useQuery<PipelineSettings>({
    queryKey: ["/api/admin/pipeline/settings"],
  });

  useEffect(() => {
    if (pipelineSettingsData) {
      if (maxArticlesInput === "") {
        setMaxArticlesInput(String(pipelineSettingsData.maxArticlesPerRun));
      }
      if (!emailInitialized) {
        setNotificationEmailInput(pipelineSettingsData.notificationEmail ?? "");
        setEmailInitialized(true);
      }
    }
  }, [pipelineSettingsData]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (maxArticlesPerRun: number) => {
      await apiRequest("PATCH", "/api/admin/pipeline/settings", { maxArticlesPerRun });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pipeline/settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  const saveEmailMutation = useMutation({
    mutationFn: async (notificationEmail: string) => {
      await apiRequest("PATCH", "/api/admin/pipeline/settings", { notificationEmail: notificationEmail || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pipeline/settings"] });
      toast({ title: "Notification email saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving email", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveSettings = () => {
    const val = parseInt(maxArticlesInput, 10);
    if (isNaN(val) || val < 1 || val > 50) {
      toast({ title: "Invalid value", description: "Max articles must be between 1 and 50.", variant: "destructive" });
      return;
    }
    saveSettingsMutation.mutate(val);
  };

  const handleSaveEmail = () => {
    const email = notificationEmailInput.trim();
    if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    saveEmailMutation.mutate(email);
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const runMutation = useMutation<PipelineRunResult>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/pipeline/run");
      return res.json() as Promise<PipelineRunResult>;
    },
    onSuccess: (result: PipelineRunResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pipeline/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      refetchRuns();
      const msg = result.articlesGenerated > 0
        ? `${result.articlesGenerated} new draft${result.articlesGenerated !== 1 ? "s" : ""} created and ready for review.`
        : "No new articles matched this run.";
      toast({ title: "Pipeline complete", description: msg });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login?returnTo=/admin"; }, 500);
        return;
      }
      toast({ title: "Pipeline failed", description: error.message, variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/articles/${id}`, { published: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article published" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Draft deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function statusIcon(status: string) {
    if (status === "success") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "partial") return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }

  function statusLabel(status: string) {
    if (status === "success") return "Success";
    if (status === "partial") return "Partial";
    return "Error";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-pipeline-heading">
            <Zap className="h-5 w-5 text-amber-500" />
            Content Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scrapes conservative RSS feeds and generates AI drafts for your review. Runs automatically daily at 6:00 AM.
          </p>
        </div>
        <Button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          data-testid="button-run-pipeline"
        >
          {runMutation.isPending ? (
            <><Clock className="h-4 w-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Run Now</>
          )}
        </Button>
      </div>

      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium">Max articles per run</p>
              <p className="text-xs text-muted-foreground mt-0.5">How many AI drafts to generate each time the pipeline runs</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={50}
                value={maxArticlesInput}
                onChange={(e) => setMaxArticlesInput(e.target.value)}
                className="w-20 text-center"
                data-testid="input-max-articles"
              />
              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-max-articles"
              >
                <Save className="h-4 w-4 mr-1" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <div className="border-t pt-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium">Notification email</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receive an email when new AI drafts are ready for review. Leave blank to fall back to the server default (ADMIN_NOTIFICATION_EMAIL env var), or clear it entirely to disable if no env var is set.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="admin@example.com"
                value={notificationEmailInput}
                onChange={(e) => setNotificationEmailInput(e.target.value)}
                className="w-56"
                data-testid="input-notification-email"
              />
              <Button
                size="sm"
                onClick={handleSaveEmail}
                disabled={saveEmailMutation.isPending}
                data-testid="button-save-notification-email"
              >
                <Save className="h-4 w-4 mr-1" />
                {saveEmailMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">AI Drafts Pending Review</p>
            <p className="text-3xl font-bold mt-1 text-amber-600" data-testid="text-pending-drafts">{draftsLoading ? "…" : (aiDrafts?.length ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Pipeline Runs</p>
            <p className="text-3xl font-bold mt-1" data-testid="text-total-runs">{runsLoading ? "…" : (runs?.length ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Last Run</p>
            <p className="text-sm font-medium mt-1" data-testid="text-last-run">
              {runs && runs.length > 0
                ? new Date(runs[0].ranAt!).toLocaleString()
                : "Never"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(aiDrafts?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            AI Drafts Awaiting Review ({aiDrafts!.length})
          </h3>
          <div className="space-y-2">
            {aiDrafts!.map((article) => (
              <Card key={article.id} className="border-purple-200 dark:border-purple-800" data-testid={`card-ai-draft-${article.id}`}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium truncate" data-testid={`text-draft-title-${article.id}`}>{article.title}</h4>
                      {article.categoryId && (
                        <Badge variant="secondary" className="flex-shrink-0 text-xs" data-testid={`badge-draft-category-${article.id}`}>
                          {categoryMap.get(article.categoryId) ?? "Unknown"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {article.excerpt?.replace("[AI Draft] ", "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditArticle(article.id)}
                      title="Edit this draft"
                      data-testid={`button-edit-draft-${article.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => publishMutation.mutate(article.id)}
                      disabled={publishMutation.isPending}
                      title="Publish now"
                      data-testid={`button-publish-draft-${article.id}`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive" data-testid={`button-delete-draft-${article.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete AI draft?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{article.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(article.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Run History</h3>
        {runsLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading...</div>
        ) : runs?.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No pipeline runs yet. Click "Run Now" to start.</p>
        ) : (
          <div className="space-y-2">
            {runs?.map((run) => {
              const cats: string[] = run.categoriesAssigned ? (() => { try { return JSON.parse(run.categoriesAssigned); } catch { return []; } })() : [];
              return (
                <Card key={run.id} data-testid={`card-run-${run.id}`}>
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      {statusIcon(run.status)}
                      <div>
                        <p className="text-sm font-medium">
                          {statusLabel(run.status)} — {run.articlesGenerated} article{run.articlesGenerated !== 1 ? "s" : ""} generated
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {run.ranAt ? new Date(run.ranAt).toLocaleString() : ""} · {run.sourcesChecked} sources checked
                        </p>
                        {cats.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-run-categories-${run.id}`}>
                            Categories: {cats.join(", ")}
                          </p>
                        )}
                        {run.errorMessage && (
                          <p className="text-xs text-red-500 mt-0.5 truncate max-w-md">{run.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <SourcesSection />

      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            All generated articles are filtered through a conservative, Judeo-Evangelical Christian, and Biblical Creation worldview. No article is published without your review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SourcesSection() {
  const { toast } = useToast();
  const [addingFeed, setAddingFeed] = useState(false);
  const [feedType, setFeedType] = useState<"rss" | "youtube">("rss");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: feeds, isLoading: feedsLoading } = useQuery<RssFeed[]>({
    queryKey: ["/api/admin/feeds"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; url: string; sourceType: string }) => {
      await apiRequest("POST", "/api/admin/feeds", { ...data, enabled: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feeds"] });
      toast({ title: "Feed added" });
      setNewName("");
      setNewUrl("");
      setTestResult(null);
      setAddingFeed(false);
      setFeedType("rss");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/admin/feeds/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feeds"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/feeds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feeds"] });
      toast({ title: "Feed removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleTestFeed = async () => {
    if (!newUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/feeds/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim(), sourceType: feedType }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        const label = feedType === "youtube" ? "video" : "item";
        const extra = data.resolvedUrl ? ` · resolved to channel feed` : "";
        setTestResult({ ok: true, message: `Found ${data.itemCount} ${label}${data.itemCount !== 1 ? "s" : ""} in "${data.title}"${extra}` });
      } else {
        setTestResult({ ok: false, message: data.message || "Feed test failed" });
      }
    } catch {
      setTestResult({ ok: false, message: "Could not reach the feed" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddFeed = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setTestResult(null);
    addMutation.mutate({ name: newName.trim(), url: newUrl.trim(), sourceType: feedType });
  };

  const handleCancel = () => {
    setAddingFeed(false);
    setNewName("");
    setNewUrl("");
    setTestResult(null);
    setFeedType("rss");
  };

  const enabledCount = feeds?.filter((f) => f.enabled).length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Rss className="h-4 w-4 text-amber-500" />
          Sources ({enabledCount} of {feeds?.length ?? 0} active)
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addingFeed ? handleCancel() : setAddingFeed(true)}
          data-testid="button-add-feed-toggle"
        >
          {addingFeed ? <><X className="h-4 w-4 mr-1" /> Cancel</> : <><Plus className="h-4 w-4 mr-1" /> Add Feed</>}
        </Button>
      </div>

      {addingFeed && (
        <Card className="mb-3 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-1 p-1 bg-muted rounded-md w-fit">
              <button
                onClick={() => { setFeedType("rss"); setNewUrl(""); setTestResult(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${feedType === "rss" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-feed-type-rss"
              >
                <Rss className="h-3.5 w-3.5" />
                RSS Feed
              </button>
              <button
                onClick={() => { setFeedType("youtube"); setNewUrl(""); setTestResult(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${feedType === "youtube" ? "bg-red-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-feed-type-youtube"
              >
                <Youtube className="h-3.5 w-3.5" />
                YouTube
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Display name (e.g. The Federalist)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                data-testid="input-feed-name"
              />
              <div className="flex gap-2">
                <Input
                  placeholder={feedType === "youtube" ? "Channel URL or @handle (e.g. @ChannelName)" : "RSS URL (e.g. https://example.com/feed)"}
                  value={newUrl}
                  onChange={(e) => { setNewUrl(e.target.value); setTestResult(null); }}
                  type={feedType === "rss" ? "url" : "text"}
                  data-testid="input-feed-url"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestFeed}
                  disabled={isTesting || !newUrl.trim()}
                  data-testid="button-test-feed"
                  title={feedType === "youtube" ? "Test this YouTube channel" : "Test this RSS URL"}
                >
                  {isTesting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FlaskConical className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {feedType === "youtube" && (
              <p className="text-xs text-muted-foreground">
                Paste a full channel URL (e.g. <code className="bg-muted px-1 rounded">https://www.youtube.com/@ChannelName</code>), a <code className="bg-muted px-1 rounded">@handle</code>, or a raw channel ID starting with <code className="bg-muted px-1 rounded">UC</code>.
              </p>
            )}
            {testResult && (
              <div className={`flex items-center gap-2 text-sm px-1 ${testResult.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`} data-testid="text-test-result">
                {testResult.ok
                  ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                {testResult.message}
              </div>
            )}
            <Button
              size="sm"
              onClick={handleAddFeed}
              disabled={addMutation.isPending || !newName.trim() || !newUrl.trim()}
              data-testid="button-save-feed"
            >
              <Save className="h-4 w-4 mr-2" />
              {addMutation.isPending ? "Adding..." : feedType === "youtube" ? "Add YouTube Channel" : "Add Feed"}
            </Button>
          </CardContent>
        </Card>
      )}

      {feedsLoading ? (
        <div className="text-center py-6 text-muted-foreground">Loading sources...</div>
      ) : feeds?.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">No feeds configured. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {feeds?.map((feed) => (
            <Card key={feed.id} className={feed.enabled ? "" : "opacity-60"} data-testid={`card-feed-${feed.id}`}>
              <CardContent className="flex items-center justify-between py-2 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: feed.id, enabled: !feed.enabled })}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title={feed.enabled ? "Disable this feed" : "Enable this feed"}
                    disabled={toggleMutation.isPending}
                    data-testid={`button-toggle-feed-${feed.id}`}
                  >
                    {feed.enabled
                      ? <ToggleRight className="h-5 w-5 text-green-500" />
                      : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" data-testid={`text-feed-name-${feed.id}`}>{feed.name}</p>
                      {feed.sourceType === "youtube" && (
                        <span
                          className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                          data-testid={`badge-youtube-${feed.id}`}
                        >
                          <Youtube className="h-3 w-3" />
                          YouTube
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-feed-url-${feed.id}`}>{feed.url}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive flex-shrink-0 ml-2" data-testid={`button-delete-feed-${feed.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove feed?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove "{feed.name}" from the pipeline. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(feed.id)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [creatingArticle, setCreatingArticle] = useState(false);
  const [activeTab, setActiveTab] = useState("articles");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: editingArticle } = useQuery<Article>({
    queryKey: ["/api/admin/articles", editingArticleId],
    enabled: editingArticleId !== null,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/articles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article created" });
      setCreatingArticle(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login?returnTo=/admin"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/admin/articles/${editingArticleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article updated" });
      setEditingArticleId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login?returnTo=/admin"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login?returnTo=/admin";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (creatingArticle) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold" data-testid="text-admin-title">New Article</h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <ArticleEditor
            categories={categories || []}
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setCreatingArticle(false)}
            isPending={createMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (editingArticleId !== null && editingArticle) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold" data-testid="text-admin-title">Edit Article</h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <ArticleEditor
            article={editingArticle}
            categories={categories || []}
            onSave={(data) => updateMutation.mutate(data)}
            onCancel={() => setEditingArticleId(null)}
            isPending={updateMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold" data-testid="text-admin-title">Admin Dashboard</h1>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-view-site">
              ← View Site
            </a>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground" data-testid="text-admin-user">
                {user.firstName || user.email || "Admin"}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6" data-testid="admin-tabs">
            <TabsTrigger value="articles" data-testid="tab-articles">
              <FileText className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              <Mail className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="pipeline" data-testid="tab-pipeline">
              <Zap className="h-4 w-4 mr-2" />
              Pipeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            <ArticlesList
              onEdit={(id) => setEditingArticleId(id)}
              onNew={() => setCreatingArticle(true)}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesPanel />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesPanel />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelinePanel onEditArticle={(id) => setEditingArticleId(id)} categories={categories || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
