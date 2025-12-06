import { NextRequest, NextResponse } from "next/server";
import { getYalidineClient } from "@/lib/yalidine";
import { getZRClient } from "@/lib/zrexpress";
import { prisma } from "@/lib/prisma";

// GET /api/tracking - Get tracking info for a package
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tracking = searchParams.get('tracking');
        const provider = searchParams.get('provider') || 'auto';

        if (!tracking) {
            return NextResponse.json({ error: "Numéro de suivi requis" }, { status: 400 });
        }

        // Auto-detect provider from tracking format
        let detectedProvider = provider;
        if (provider === 'auto') {
            if (tracking.toLowerCase().startsWith('yal-')) {
                detectedProvider = 'yalidine';
            } else if (tracking.toLowerCase().startsWith('zr')) {
                detectedProvider = 'zrexpress';
            } else {
                // Try both
                detectedProvider = 'both';
            }
        }

        let result = null;

        // Try Yalidine
        if (detectedProvider === 'yalidine' || detectedProvider === 'both') {
            try {
                const yalidineClient = getYalidineClient();
                const yalidineResult = await yalidineClient.getParcel(tracking);
                
                if (yalidineResult.data && yalidineResult.data.length > 0) {
                    const parcel = yalidineResult.data[0];
                    
                    // Get tracking history
                    let history: { status: string; date: string; location?: string; completed: boolean; current: boolean }[] = [];
                    try {
                        const historyResult = await yalidineClient.getTrackingHistory(tracking);
                        if (historyResult.data) {
                            history = historyResult.data.map((h: any, index: number, arr: any[]) => ({
                                status: h.status,
                                date: new Date(h.date).toLocaleString('fr-FR'),
                                location: h.center_name || h.wilaya_name,
                                completed: true,
                                current: index === 0
                            }));
                        }
                    } catch (e) {
                        console.error('Error fetching Yalidine history:', e);
                    }

                    result = {
                        found: true,
                        provider: 'Yalidine',
                        tracking: parcel.tracking,
                        status: parcel.last_status || 'En cours',
                        customerName: `${parcel.firstname} ${parcel.familyname}`,
                        destination: `${parcel.to_commune_name}, ${parcel.to_wilaya_name}`,
                        history: history.length > 0 ? history : [
                            { status: parcel.last_status || 'En cours', date: 'Maintenant', completed: true, current: true }
                        ]
                    };
                }
            } catch (e) {
                console.error('Yalidine tracking error:', e);
            }
        }

        // Try ZR Express if not found
        if (!result && (detectedProvider === 'zrexpress' || detectedProvider === 'both')) {
            try {
                const zrClient = getZRClient();
                const zrResult = await zrClient.getTrackingInfo([tracking]);
                
                if (zrResult && zrResult.length > 0) {
                    const parcel = zrResult[0];
                    
                    result = {
                        found: true,
                        provider: 'ZR Express',
                        tracking: parcel.Tracking,
                        status: parcel.Situation || 'En cours',
                        customerName: parcel.Client,
                        destination: `${parcel.Commune}, ${parcel.Wilaya}`,
                        history: [
                            { 
                                status: parcel.Situation || 'En cours', 
                                date: parcel.DateMAJ ? new Date(parcel.DateMAJ).toLocaleString('fr-FR') : 'Maintenant',
                                completed: true, 
                                current: true 
                            },
                            {
                                status: 'Colis créé',
                                date: parcel.DateCreation ? new Date(parcel.DateCreation).toLocaleString('fr-FR') : '',
                                completed: true,
                                current: false
                            }
                        ]
                    };
                }
            } catch (e) {
                console.error('ZR Express tracking error:', e);
            }
        }

        // If still not found, check local database
        if (!result) {
            const order = await prisma.order.findFirst({
                where: { trackingNumber: tracking },
                include: { items: true }
            });

            if (order) {
                result = {
                    found: true,
                    provider: order.deliveryProvider || 'Inconnu',
                    tracking: order.trackingNumber || tracking,
                    status: order.trackingStatus || order.status,
                    customerName: order.customerName,
                    destination: `${order.customerCity}, Wilaya ${order.customerWilaya}`,
                    history: [
                        { 
                            status: order.trackingStatus || order.status, 
                            date: order.updatedAt.toLocaleString('fr-FR'),
                            completed: true, 
                            current: true 
                        }
                    ]
                };
            }
        }

        if (result) {
            return NextResponse.json(result);
        }

        return NextResponse.json({
            found: false,
            error: "Colis non trouvé. Vérifiez votre numéro de suivi."
        });

    } catch (error) {
        console.error("Tracking API error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la recherche du colis" },
            { status: 500 }
        );
    }
}

// POST /api/tracking/sync - Sync tracking status for an order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId requis" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order || !order.trackingNumber) {
            return NextResponse.json({ error: "Commande ou tracking non trouvé" }, { status: 404 });
        }

        let newStatus = order.trackingStatus;
        let updated = false;

        // Fetch from appropriate provider
        if (order.deliveryProvider === 'Yalidine') {
            try {
                const yalidineClient = getYalidineClient();
                const result = await yalidineClient.getParcel(order.trackingNumber);
                
                if (result.data && result.data.length > 0) {
                    newStatus = result.data[0].last_status;
                    updated = true;
                }
            } catch (e) {
                console.error('Yalidine sync error:', e);
            }
        } else if (order.deliveryProvider === 'ZR Express') {
            try {
                const zrClient = getZRClient();
                const result = await zrClient.getTrackingInfo([order.trackingNumber]);
                
                if (result && result.length > 0) {
                    newStatus = result[0].Situation;
                    updated = true;
                }
            } catch (e) {
                console.error('ZR Express sync error:', e);
            }
        }

        if (updated && newStatus !== order.trackingStatus) {
            // Map delivery status to order status
            let orderStatus = order.status;
            const statusLower = newStatus?.toLowerCase() || '';
            
            if (statusLower.includes('livré') || statusLower.includes('delivered')) {
                orderStatus = 'DELIVERED';
            } else if (statusLower.includes('retour') || statusLower.includes('échec') || statusLower.includes('annul')) {
                orderStatus = 'CANCELLED';
            } else if (statusLower.includes('expédié') || statusLower.includes('transit') || statusLower.includes('sorti')) {
                orderStatus = 'SHIPPED';
            }

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    trackingStatus: newStatus,
                    status: orderStatus
                }
            });

            return NextResponse.json({
                success: true,
                previousStatus: order.trackingStatus,
                newStatus: newStatus,
                orderStatus: orderStatus
            });
        }

        return NextResponse.json({
            success: true,
            status: newStatus,
            message: "Aucun changement de statut"
        });

    } catch (error) {
        console.error("Tracking sync error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la synchronisation" },
            { status: 500 }
        );
    }
}
