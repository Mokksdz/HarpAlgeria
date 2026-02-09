"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/CartProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  deliveryRates,
  getDeliveryPrice,
  DeliveryProvider,
  DeliveryType,
} from "@/lib/delivery-data";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Home,
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { trackEvent } from "@/components/Analytics";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    wilaya: "",
  });

  const [deliveryProvider, setDeliveryProvider] =
    useState<DeliveryProvider>("Yalidine");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("HOME");
  const [shippingPrice, setShippingPrice] = useState(0);
  const [communes, setCommunes] = useState<{ id: number; name: string }[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [stopDeskCenters, setStopDeskCenters] = useState<
    { id: number; name: string; address: string; commune: string }[]
  >([]);
  const [selectedStopDesk, setSelectedStopDesk] = useState<string>("");
  const [loadingStopDesks, setLoadingStopDesks] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Track begin_checkout on page load
  useEffect(() => {
    if (items.length > 0) {
      trackEvent.ga.beginCheckout(
        total,
        items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      );
      trackEvent.fb.initiateCheckout(total, items.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fire only once on mount

  // Fetch communes when wilaya changes
  useEffect(() => {
    if (formData.wilaya) {
      const price = getDeliveryPrice(
        parseInt(formData.wilaya),
        deliveryProvider,
        deliveryType,
      );
      setShippingPrice(price);

      // Fetch communes (public route)
      setLoadingCommunes(true);
      fetch(`/api/shipping/communes?wilaya_id=${formData.wilaya}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) {
            setCommunes(
              data.data.map((c: { id: number; name: string }) => ({
                id: c.id,
                name: c.name,
              })),
            );
          }
        })
        .catch((err) => console.error("Error fetching communes:", err))
        .finally(() => setLoadingCommunes(false));

      // Reset city when wilaya changes
      setFormData((prev) => ({ ...prev, city: "" }));
    } else {
      setCommunes([]);
    }
  }, [formData.wilaya, deliveryProvider, deliveryType]);

  // Fetch stop desk centers when DESK delivery type selected
  useEffect(() => {
    if (formData.wilaya && deliveryType === "DESK") {
      setLoadingStopDesks(true);
      setSelectedStopDesk("");

      if (deliveryProvider === "Yalidine") {
        // Fetch from public centers route
        fetch(`/api/shipping/centers?wilaya_id=${formData.wilaya}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.data && Array.isArray(data.data)) {
              setStopDeskCenters(
                data.data.map(
                  (c: {
                    center_id: number;
                    name: string;
                    address: string;
                    commune_name: string;
                  }) => ({
                    id: c.center_id,
                    name: c.name,
                    address: c.address,
                    commune: c.commune_name,
                  }),
                ),
              );
            } else {
              setStopDeskCenters([]);
            }
          })
          .catch((err) => {
            console.error("Error fetching Yalidine stop desks:", err);
            setStopDeskCenters([]);
          })
          .finally(() => setLoadingStopDesks(false));
      } else if (deliveryProvider === "ZR Express") {
        // Fetch from public centers route
        fetch(`/api/shipping/centers?wilaya_id=${formData.wilaya}&provider=zrexpress`)
          .then((res) => res.json())
          .then((data) => {
            if (data.data && Array.isArray(data.data)) {
              setStopDeskCenters(
                data.data.map(
                  (
                    c: {
                      wilayaId: number;
                      centerName: string;
                      address: string;
                      wilayaName: string;
                    },
                    idx: number,
                  ) => ({
                    id: c.wilayaId * 100 + idx,
                    name: c.centerName,
                    address: c.address,
                    commune: c.wilayaName,
                  }),
                ),
              );
            } else {
              setStopDeskCenters([]);
            }
          })
          .catch((err) => {
            console.error("Error fetching ZR Express stop desks:", err);
            setStopDeskCenters([]);
          })
          .finally(() => setLoadingStopDesks(false));
      }
    } else {
      setStopDeskCenters([]);
      setSelectedStopDesk("");
    }
  }, [formData.wilaya, deliveryProvider, deliveryType]);

  // Update step based on form completion
  useEffect(() => {
    if (formData.firstName && formData.lastName && formData.phone) {
      if (formData.city && formData.wilaya) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else {
      setCurrentStep(1);
    }
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    // Phone: allow only digits and spaces, max 10 digits
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, phone: digits });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "Prénom requis";
    if (!formData.lastName.trim()) errors.lastName = "Nom requis";
    if (!formData.phone || formData.phone.length !== 10)
      errors.phone = "Numéro à 10 chiffres requis (ex: 0550123456)";
    if (formData.phone && !formData.phone.startsWith("0"))
      errors.phone = "Le numéro doit commencer par 0";
    if (!formData.wilaya) errors.wilaya = "Sélectionnez une wilaya";
    if (!formData.city) errors.city = "Sélectionnez une commune";
    if (deliveryType === "DESK" && !selectedStopDesk)
      errors.stopDesk = "Sélectionnez un point de retrait";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      // Get stop desk info if selected
      const stopDeskInfo = selectedStopDesk
        ? stopDeskCenters.find((c) => c.id.toString() === selectedStopDesk)
        : null;

      const orderData = {
        customerName: formData.firstName + " " + formData.lastName,
        customerPhone: formData.phone,
        customerAddress: stopDeskInfo
          ? `Point de retrait: ${stopDeskInfo.name} - ${stopDeskInfo.address}`
          : formData.address,
        customerCity: stopDeskInfo?.commune || formData.city,
        customerWilaya: formData.wilaya,
        deliveryProvider,
        deliveryType,
        shippingPrice,
        stopDeskId: selectedStopDesk ? parseInt(selectedStopDesk) : null,
        total: total + shippingPrice,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // Track shipping & payment info
      trackEvent.ga.addShippingInfo(
        total + shippingPrice,
        `${deliveryProvider}-${deliveryType}`,
      );
      trackEvent.ga.addPaymentInfo(total + shippingPrice, "COD");
      trackEvent.fb.addPaymentInfo(total + shippingPrice);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        clearCart();
        const params = new URLSearchParams({
          id: order.id || "",
          total: String(total + shippingPrice),
          wilaya: formData.wilaya,
        });
        router.push(`/order-confirmation?${params.toString()}`);
      } else {
        alert("Une erreur est survenue. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-white">
        <ShoppingBag size={40} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-serif font-medium mb-2 text-gray-900">
          Votre panier est vide
        </h1>
        <Link
          href="/shop"
          className="mt-6 text-sm uppercase tracking-widest border-b border-gray-900 pb-1 hover:text-gray-600 hover:border-gray-600 transition-all"
        >
          Retourner à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      {/* Minimal Header */}
      <div className="border-b border-gray-100 pb-6 mb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-medium text-gray-900">
              Validation
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
              <Lock size={14} className="text-green-600" />
              Paiement sécurisé
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
          {/* Form Section */}
          <div className="lg:col-span-7 space-y-12">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-12"
            >
              {/* Personal Info */}
              <div>
                <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-sans">
                    1
                  </span>
                  Informations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Prénom <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={cn(
                        "w-full bg-transparent border-b py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300",
                        formErrors.firstName
                          ? "border-red-400"
                          : "border-gray-200",
                      )}
                      placeholder="Votre prénom"
                    />
                    {formErrors.firstName && (
                      <p className="text-xs text-red-500">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Nom <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={cn(
                        "w-full bg-transparent border-b py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300",
                        formErrors.lastName
                          ? "border-red-400"
                          : "border-gray-200",
                      )}
                      placeholder="Votre nom"
                    />
                    {formErrors.lastName && (
                      <p className="text-xs text-red-500">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      name="phone"
                      type="tel"
                      value={
                        formData.phone
                          ? formData.phone.replace(
                              /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                              "$1 $2 $3 $4 $5",
                            )
                          : ""
                      }
                      onChange={handleChange}
                      className={cn(
                        "w-full bg-transparent border-b py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300",
                        formErrors.phone ? "border-red-400" : "border-gray-200",
                      )}
                      placeholder="05 50 12 34 56"
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-sans">
                    2
                  </span>
                  Livraison
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Wilaya <span className="text-red-400">*</span>
                      </label>
                      <select
                        required
                        name="wilaya"
                        value={formData.wilaya}
                        onChange={handleChange}
                        className={cn(
                          "w-full bg-transparent border-b py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors cursor-pointer",
                          formErrors.wilaya
                            ? "border-red-400"
                            : "border-gray-200",
                        )}
                      >
                        <option value="">Sélectionner</option>
                        {deliveryRates.map((rate) => (
                          <option key={rate.wilayaCode} value={rate.wilayaCode}>
                            {rate.wilayaCode} - {rate.wilayaName}
                          </option>
                        ))}
                      </select>
                      {formErrors.wilaya && (
                        <p className="text-xs text-red-500">
                          {formErrors.wilaya}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Commune <span className="text-red-400">*</span>
                      </label>
                      {loadingCommunes ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                          <Loader2 size={16} className="animate-spin" />
                          Chargement des communes...
                        </div>
                      ) : (
                        <select
                          required
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          disabled={!formData.wilaya}
                          className={cn(
                            "w-full bg-transparent border-b py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors cursor-pointer disabled:opacity-50",
                            formErrors.city
                              ? "border-red-400"
                              : "border-gray-200",
                          )}
                        >
                          <option value="">Sélectionner</option>
                          {communes.map((commune) => (
                            <option key={commune.id} value={commune.name}>
                              {commune.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {formErrors.city && (
                        <p className="text-xs text-red-500">
                          {formErrors.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Provider Selection */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 block">
                      Transporteur
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryProvider("Yalidine")}
                        className={cn(
                          "p-4 border transition-all rounded-xl flex items-center gap-3",
                          deliveryProvider === "Yalidine"
                            ? "border-harp-brown bg-harp-cream/50 ring-1 ring-harp-brown"
                            : "border-gray-200 hover:border-harp-caramel hover:bg-gray-50",
                        )}
                      >
                        <div className="w-12 h-12 relative shrink-0">
                          <Image
                            src="/logo yalidine.webp"
                            alt="Yalidine"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="text-left flex-1">
                          <span className="block text-sm font-semibold text-gray-900">
                            Yalidine
                          </span>
                        </div>
                        {deliveryProvider === "Yalidine" && (
                          <CheckCircle2 size={18} className="text-harp-brown" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryProvider("ZR Express")}
                        className={cn(
                          "p-4 border transition-all rounded-xl flex items-center gap-3",
                          deliveryProvider === "ZR Express"
                            ? "border-harp-brown bg-harp-cream/50 ring-1 ring-harp-brown"
                            : "border-gray-200 hover:border-harp-caramel hover:bg-gray-50",
                        )}
                      >
                        <div className="w-12 h-12 relative shrink-0">
                          <Image
                            src="/logo zrexpress.webp"
                            alt="ZR Express"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="text-left flex-1">
                          <span className="block text-sm font-semibold text-gray-900">
                            ZR Express
                          </span>
                        </div>
                        {deliveryProvider === "ZR Express" && (
                          <CheckCircle2 size={18} className="text-harp-brown" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Delivery Type Selection */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 block">
                      Type de livraison
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("HOME")}
                        className={cn(
                          "p-5 text-left border transition-all rounded-xl",
                          deliveryType === "HOME"
                            ? "border-harp-brown bg-harp-cream/50 ring-1 ring-harp-brown"
                            : "border-gray-200 hover:border-harp-caramel hover:bg-gray-50",
                        )}
                      >
                        <Home
                          size={20}
                          className={cn(
                            "mb-2",
                            deliveryType === "HOME"
                              ? "text-harp-brown"
                              : "text-gray-400",
                          )}
                        />
                        <span className="block text-sm font-medium text-gray-900 mb-1">
                          À Domicile
                        </span>
                        <span className="block text-xs text-gray-500">
                          Livré chez vous
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("DESK")}
                        className={cn(
                          "p-5 text-left border transition-all rounded-xl",
                          deliveryType === "DESK"
                            ? "border-harp-brown bg-harp-cream/50 ring-1 ring-harp-brown"
                            : "border-gray-200 hover:border-harp-caramel hover:bg-gray-50",
                        )}
                      >
                        <Building2
                          size={20}
                          className={cn(
                            "mb-2",
                            deliveryType === "DESK"
                              ? "text-harp-brown"
                              : "text-gray-400",
                          )}
                        />
                        <span className="block text-sm font-medium text-gray-900 mb-1">
                          Point Relais
                        </span>
                        <span className="block text-xs text-gray-500">
                          Retrait en bureau
                        </span>
                      </button>
                    </div>
                  </div>

                  {deliveryType === "DESK" && formData.wilaya && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Point de retrait
                      </label>
                      {loadingStopDesks ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                          <Loader2 size={16} className="animate-spin" />
                          Chargement...
                        </div>
                      ) : stopDeskCenters.length > 0 ? (
                        <select
                          value={selectedStopDesk}
                          onChange={(e) => setSelectedStopDesk(e.target.value)}
                          className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors cursor-pointer"
                          required
                        >
                          <option value="">Choisir un bureau</option>
                          {stopDeskCenters.map((center) => (
                            <option key={center.id} value={center.id}>
                              {center.name} - {center.commune}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-red-500 py-2">
                          Aucun point de retrait disponible. Veuillez choisir la
                          livraison à domicile.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Address - only shown for HOME delivery, optional */}
                  {deliveryType === "HOME" && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Adresse <span className="text-gray-400 normal-case tracking-normal font-normal">(optionnel)</span>
                      </label>
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={cn(
                          "w-full bg-transparent border-b py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300",
                          formErrors.address
                            ? "border-red-400"
                            : "border-gray-200",
                        )}
                        placeholder="Cité, rue, n°..."
                      />
                      {formErrors.address && (
                        <p className="text-xs text-red-500">
                          {formErrors.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary - Sticky */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 bg-[#F9F9F9] p-8 rounded-sm">
              <h2 className="font-serif font-medium text-gray-900 mb-6">
                Récapitulatif
              </h2>

              <div className="space-y-6 mb-8">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex gap-4"
                  >
                    <div className="relative w-16 h-20 bg-white shrink-0 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.size} / {item.color}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          Qté: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.price.toLocaleString()} DZD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="text-gray-900">
                    {total.toLocaleString()} DZD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    Livraison
                    {formData.wilaya && (
                      <span className="text-[10px] bg-harp-cream text-harp-brown px-2 py-0.5 rounded-full">
                        {deliveryProvider}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-900">
                    {formData.wilaya
                      ? `${shippingPrice.toLocaleString()} DZD`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-harp-brown">
                    {(total + shippingPrice).toLocaleString()} DZD
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || !formData.wilaya}
                className="w-full bg-harp-brown text-white py-4 rounded-xl font-medium hover:bg-harp-caramel transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-harp-brown/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    Confirmer la commande
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="bg-gradient-to-r from-harp-cream to-harp-beige rounded-xl p-4 border border-harp-beige">
                <div className="flex items-center gap-3 text-harp-brown">
                  <CreditCard size={20} />
                  <div>
                    <p className="font-medium text-sm">
                      Paiement à la livraison
                    </p>
                    <p className="text-xs text-harp-brown">
                      Cash on Delivery (COD)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Clock size={18} className="mx-auto text-gray-500 mb-1" />
                  <p className="text-xs font-medium text-gray-700">
                    Livraison 24-72h
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Shield size={18} className="mx-auto text-gray-500 mb-1" />
                  <p className="text-xs font-medium text-gray-700">
                    Achat sécurisé
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
