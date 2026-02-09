"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Newspaper,
  Save,
  X,
  Upload,
  Loader2,
  ExternalLink,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface BlogPost {
  id: string;
  slug: string;
  titleFr: string;
  titleAr: string;
  excerptFr: string | null;
  excerptAr: string | null;
  contentFr: string;
  contentAr: string;
  coverImage: string | null;
  category: string;
  tags: string | null;
  authorName: string;
  isPublished: boolean;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogFormData {
  titleFr: string;
  slug: string;
  excerptFr: string;
  contentFr: string;
  coverImage: string;
  category: string;
  tags: string;
  authorName: string;
  isPublished: boolean;
}

const CATEGORIES = [
  { value: "STYLE", label: "Style" },
  { value: "LOOKBOOK", label: "Lookbook" },
  { value: "TIPS", label: "Conseils" },
  { value: "NEWS", label: "Actualités" },
];

function getCategoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.value === key)?.label || key;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const EMPTY_FORM: BlogFormData = {
  titleFr: "",
  slug: "",
  excerptFr: "",
  contentFr: "",
  coverImage: "",
  category: "STYLE",
  tags: "",
  authorName: "L'Équipe Harp",
  isPublished: false,
};

// =============================================================================
// Component
// =============================================================================

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ==========================================================================
  // Fetch all posts (admin sees all, including drafts)
  // ==========================================================================

  const fetchAllPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v3/blog?limit=100&admin=true");
      const data = await res.json();

      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch blog posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const openCreate = () => {
    setEditingPost(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      titleFr: post.titleFr,
      slug: post.slug,
      excerptFr: post.excerptFr || "",
      contentFr: post.contentFr,
      coverImage: post.coverImage || "",
      category: post.category,
      tags: post.tags || "",
      authorName: post.authorName,
      isPublished: post.isPublished,
    });
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      titleFr: title,
      slug: editingPost ? prev.slug : slugify(title),
    }));
  };

  const handleCoverUpload = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, coverImage: data.url }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.titleFr.trim() || !formData.contentFr.trim()) {
      alert("Le titre et le contenu sont requis.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        titleAr: formData.titleFr,
        excerptAr: formData.excerptFr,
        contentAr: formData.contentFr,
      };

      if (editingPost) {
        // Update
        const res = await fetch(`/api/v3/blog/${editingPost.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || "Erreur lors de la mise à jour");
          return;
        }
      } else {
        // Create
        const res = await fetch("/api/v3/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || "Erreur lors de la création");
          return;
        }
      }

      setShowModal(false);
      setEditingPost(null);
      setFormData(EMPTY_FORM);
      fetchAllPosts();
    } catch (err) {
      console.error("Save error:", err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Supprimer l'article "${post.titleFr}" ?`)) return;

    try {
      const res = await fetch(`/api/v3/blog/${post.slug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
      } else {
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/v3/blog/${post.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished: !post.isPublished,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllPosts();
      }
    } catch (err) {
      console.error("Toggle publish error:", err);
    }
  };

  // ==========================================================================
  // Filtered posts
  // ==========================================================================

  const filteredPosts = posts.filter((p) => {
    const matchSearch =
      p.titleFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      filterCategory === "ALL" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Journal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez les articles du blog Harp
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          Nouvel article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Newspaper size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Articles</p>
            <p className="text-2xl font-semibold text-gray-900">
              {posts.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Publiés</p>
            <p className="text-2xl font-semibold text-gray-900">
              {posts.filter((p) => p.isPublished).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <EyeOff size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Brouillons</p>
            <p className="text-2xl font-semibold text-gray-900">
              {posts.filter((p) => !p.isPublished).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Vues</p>
            <p className="text-2xl font-semibold text-gray-900">
              {posts.reduce((sum, p) => sum + p.views, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
        >
          <option value="ALL">Toutes catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vues
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {post.coverImage ? (
                            <Image
                              src={post.coverImage}
                              alt={post.titleFr}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper size={18} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
                            {post.titleFr}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[250px]">
                            /journal/{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {getCategoryLabel(post.category)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                          post.isPublished
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
                        )}
                      >
                        {post.isPublished ? "Publié" : "Brouillon"}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">
                        {post.views}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(
                          post.publishedAt || post.createdAt,
                        ).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.isPublished && (
                          <Link
                            href={`/journal/${post.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir l'article"
                          >
                            <ExternalLink size={16} />
                          </Link>
                        )}
                        <button
                          onClick={() => openEdit(post)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-medium text-gray-900">
                {editingPost ? "Modifier l'article" : "Nouvel article"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titleFr}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Le titre de votre article"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug (URL)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">/journal/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }))
                    }
                    placeholder="mon-article"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Extrait
                </label>
                <textarea
                  value={formData.excerptFr}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      excerptFr: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Un bref résumé de l'article..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contenu <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.contentFr}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contentFr: e.target.value,
                    }))
                  }
                  rows={12}
                  placeholder="Le contenu de votre article (HTML supporté)..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all resize-y font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Vous pouvez utiliser du HTML pour le formatage (h2, p, strong,
                  em, img, ul, li, blockquote...)
                </p>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image de couverture
                </label>
                <div className="flex items-start gap-4">
                  {formData.coverImage && (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={formData.coverImage}
                        alt="Cover"
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                      <button
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, coverImage: "" }))
                        }
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors",
                        uploading && "opacity-50 pointer-events-none",
                      )}
                    >
                      {uploading ? (
                        <Loader2
                          size={18}
                          className="animate-spin text-gray-400"
                        />
                      ) : (
                        <Upload size={18} className="text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">
                        {uploading ? "Upload en cours..." : "Choisir une image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(file);
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          coverImage: e.target.value,
                        }))
                      }
                      placeholder="...ou collez une URL d'image"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Author Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Auteur
                  </label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        authorName: e.target.value,
                      }))
                    }
                    placeholder="L'Équipe Harp"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder='["mode", "tendances", "été"]'
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Format JSON array, ex: [&quot;mode&quot;,
                  &quot;tendances&quot;]
                </p>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublished: !prev.isPublished,
                    }))
                  }
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    formData.isPublished ? "bg-green-500" : "bg-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      formData.isPublished && "translate-x-5",
                    )}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {formData.isPublished ? "Publié" : "Brouillon"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formData.isPublished
                      ? "L'article est visible publiquement"
                      : "L'article n'est pas encore visible"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm",
                  saving && "opacity-50 pointer-events-none",
                )}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
