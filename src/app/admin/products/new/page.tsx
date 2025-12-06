"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Plus, Image as ImageIcon, Video, Loader2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Collection {
    id: string;
    nameFr: string;
    nameAr: string;
}

interface UploadedMedia {
    url: string;
    type: 'image' | 'video';
    uploading?: boolean;
}

export default function NewProductPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [mediaItems, setMediaItems] = useState<UploadedMedia[]>([]);
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const [newImageUrl, setNewImageUrl] = useState("");
    const [formData, setFormData] = useState({
        nameFr: "",
        nameAr: "",
        descriptionFr: "",
        descriptionAr: "",
        price: "",
        stock: "10",
        sizes: "S, M, L, XL",
        colors: "Beige, Noir, Kaki",
        collectionId: "",
        showSizeGuide: true,
        freeShipping: false,
        freeShippingThreshold: "",
    });

    useEffect(() => {
        fetch("/api/collections")
            .then(res => res.json())
            .then(data => setCollections(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error fetching collections:", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            
            if (!isVideo && !isImage) {
                alert(`Le fichier ${file.name} n'est pas une image ou vidéo valide`);
                continue;
            }

            // Add placeholder with uploading state
            const tempId = Date.now() + Math.random();
            const tempUrl = URL.createObjectURL(file);
            
            setMediaItems(prev => [...prev, { 
                url: tempUrl, 
                type: isVideo ? 'video' : 'image',
                uploading: true 
            }]);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    // Replace temp URL with real URL
                    setMediaItems(prev => prev.map(item => 
                        item.url === tempUrl 
                            ? { url: data.url, type: isVideo ? 'video' : 'image', uploading: false }
                            : item
                    ));
                } else {
                    // Remove failed upload
                    setMediaItems(prev => prev.filter(item => item.url !== tempUrl));
                    alert(`Erreur lors de l'upload de ${file.name}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                setMediaItems(prev => prev.filter(item => item.url !== tempUrl));
                alert(`Erreur lors de l'upload de ${file.name}`);
            }
        }
    };

    const addImageUrl = () => {
        if (newImageUrl.trim() && !mediaItems.find(m => m.url === newImageUrl.trim())) {
            const isVideo = newImageUrl.includes('.mp4') || newImageUrl.includes('.webm') || newImageUrl.includes('.mov');
            setMediaItems([...mediaItems, { url: newImageUrl.trim(), type: isVideo ? 'video' : 'image' }]);
            setNewImageUrl("");
        }
    };

    const removeMedia = (index: number) => {
        setMediaItems(mediaItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const completedMedia = mediaItems.filter(m => !m.uploading);
        if (completedMedia.length === 0) {
            alert("Veuillez ajouter au moins une image ou vidéo");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: parseInt(formData.price),
                    stock: parseInt(formData.stock) || 0,
                    images: completedMedia.map(m => m.url),
                    sizes: formData.sizes.split(",").map((s) => s.trim()),
                    colors: formData.colors.split(",").map((s) => s.trim()),
                    collectionId: formData.collectionId || null,
                    showSizeGuide: formData.showSizeGuide,
                    freeShipping: formData.freeShipping,
                    freeShippingThreshold: formData.freeShipping ? (parseFloat(formData.freeShippingThreshold) || 0) : 0,
                }),
            });

            if (response.ok) {
                router.push("/admin/products");
            } else {
                const error = await response.json();
                alert(error.error || "Erreur lors de la création du produit");
            }
        } catch (error) {
            console.error("Error creating product:", error);
            alert("Erreur lors de la création du produit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <Link href="/admin/products" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-6">
                    <ArrowLeft size={16} />
                    <span className="text-sm font-medium">Retour aux produits</span>
                </Link>

                <h1 className="text-3xl font-serif font-medium text-gray-900">Nouveau Produit</h1>
                <p className="text-gray-500 text-sm mt-2">Remplissez les informations du produit</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-50 pb-4">Informations de base</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nom (Français) *</label>
                            <input
                                required
                                name="nameFr"
                                value={formData.nameFr}
                                onChange={handleChange}
                                placeholder="Ex: Trench Classique Beige"
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2" dir="rtl">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">الاسم (بالعربية) *</label>
                            <input
                                required
                                name="nameAr"
                                value={formData.nameAr}
                                onChange={handleChange}
                                placeholder="مثال: معطف كلاسيكي بيج"
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description (Français) *</label>
                            <textarea
                                required
                                name="descriptionFr"
                                value={formData.descriptionFr}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Décrivez le produit..."
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2" dir="rtl">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">الوصف (بالعربية) *</label>
                            <textarea
                                required
                                name="descriptionAr"
                                value={formData.descriptionAr}
                                onChange={handleChange}
                                rows={4}
                                placeholder="وصف المنتج..."
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Price, Stock & Collection */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-50 pb-4">Prix, Stock & Collection</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prix (DZD) *</label>
                            <div className="relative">
                                <input
                                    required
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="12500"
                                    min="0"
                                    className="w-full bg-gray-50 border-none p-3 pr-16 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">DZD</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stock disponible *</label>
                            <input
                                required
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="10"
                                min="0"
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Collection</label>
                            <select
                                name="collectionId"
                                value={formData.collectionId}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all text-gray-600"
                            >
                                <option value="">-- Aucune collection --</option>
                                {collections.map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                        {collection.nameFr}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Images & Videos */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <h2 className="text-lg font-medium text-gray-900">Images & Vidéos</h2>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setUploadMode('file')}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    uploadMode === 'file' 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Upload size={14} className="inline mr-1.5" />
                                Upload
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMode('url')}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    uploadMode === 'url' 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <LinkIcon size={14} className="inline mr-1.5" />
                                URL
                            </button>
                        </div>
                    </div>
                    
                    {uploadMode === 'file' ? (
                        <div className="mb-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-12 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                                        <Upload size={24} className="text-gray-400 group-hover:text-gray-900" />
                                    </div>
                                    <p className="text-gray-900 font-medium">Cliquez pour uploader</p>
                                    <p className="text-gray-400 text-xs mt-1">Images (JPG, PNG, WebP) ou Vidéos (MP4, WebM)</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3 mb-4">
                            <input
                                type="url"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="https://exemple.com/image.jpg"
                                className="flex-1 bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                            />
                            <button
                                type="button"
                                onClick={addImageUrl}
                                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <Plus size={18} />
                                Ajouter
                            </button>
                        </div>
                    )}

                    {/* Free Shipping Toggle */}
                    <div className="mb-6 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                    <span className="text-lg">🚚</span>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900">Livraison gratuite</span>
                                    <p className="text-xs text-gray-500 mt-0.5">Ce produit sera livré gratuitement</p>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.freeShipping}
                                    onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked, freeShippingThreshold: e.target.checked ? formData.freeShippingThreshold : "" })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                        </label>
                        
                        {/* Threshold input - shown when free shipping is enabled */}
                        {formData.freeShipping && (
                            <div className="mt-4 pt-4 border-t border-emerald-100/50 animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Seuil minimum (optionnel)
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">À partir de</span>
                                    <div className="relative flex-1 max-w-[200px]">
                                        <input
                                            type="number"
                                            value={formData.freeShippingThreshold}
                                            onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                                            placeholder="0"
                                            min="0"
                                            className="w-full border border-emerald-200 bg-white p-2 pr-14 rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">DZD</span>
                                    </div>
                                </div>
                                <p className="text-xs text-emerald-600 mt-2 font-medium">
                                    {formData.freeShippingThreshold && parseInt(formData.freeShippingThreshold) > 0 
                                        ? `Livraison gratuite pour les commandes de ${parseInt(formData.freeShippingThreshold).toLocaleString()} DZD et plus`
                                        : "Laissez vide ou 0 pour livraison gratuite sans condition"}
                                </p>
                            </div>
                        )}
                    </div>

                    {mediaItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {mediaItems.map((media, index) => (
                                <div key={index} className="relative group aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
                                    {media.type === 'video' ? (
                                        <video
                                            src={media.url}
                                            className="w-full h-full object-cover"
                                            muted
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={media.url}
                                            alt={`Media ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://placehold.co/300x400/F5F1EC/4A3A2A?text=Error`;
                                            }}
                                        />
                                    )}
                                    
                                    {/* Uploading overlay */}
                                    {media.uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 size={32} className="text-white animate-spin" />
                                        </div>
                                    )}
                                    
                                    {/* Type badge */}
                                    {media.type === 'video' && (
                                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                            <Video size={12} />
                                            Vidéo
                                        </div>
                                    )}
                                    
                                    {/* Remove button */}
                                    {!media.uploading && (
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    
                                    {/* Primary badge */}
                                    {index === 0 && !media.uploading && (
                                        <span className="absolute bottom-2 left-2 bg-gray-900/90 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded">
                                            Principal
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <ImageIcon size={20} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 text-sm">Aucun média ajouté</p>
                            <p className="text-gray-400 text-xs">Uploadez des images ou vidéos</p>
                        </div>
                    )}
                </div>

                {/* Variants */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-50 pb-4">Variantes</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tailles disponibles *</label>
                            <input
                                required
                                name="sizes"
                                value={formData.sizes}
                                onChange={handleChange}
                                placeholder="S, M, L, XL"
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1 pl-1">Séparez par des virgules</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Couleurs disponibles *</label>
                            <input
                                required
                                name="colors"
                                value={formData.colors}
                                onChange={handleChange}
                                placeholder="Beige, Noir, Kaki"
                                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1 pl-1">Séparez par des virgules</p>
                        </div>
                    </div>

                    {/* Size Guide Toggle */}
                    <div className="mt-6 pt-6 border-t border-gray-50">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <span className="text-sm font-medium text-gray-900">Afficher le guide des tailles</span>
                                <p className="text-xs text-gray-500 mt-0.5">Permet aux clients de voir les mesures</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.showSizeGuide}
                                    onChange={(e) => setFormData({ ...formData, showSizeGuide: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4 pt-4 pb-10">
                    <Link
                        href="/admin/products"
                        className="px-6 py-3 text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Création...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Créer le produit
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
