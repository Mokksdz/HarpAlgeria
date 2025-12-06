import { NextRequest, NextResponse } from "next/server";
import { getYalidineClient, orderToYalidineParcel } from "@/lib/yalidine";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

// GET /api/shipping/yalidine - Tester la connexion et récupérer infos
export async function GET(request: NextRequest) {
    try {
        await requireAdmin(request);
        
        const client = getYalidineClient();
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        // Test de connexion (default action)
        if (!action || action === 'test') {
            try {
                const connectionTest = await client.testConnection();
                return NextResponse.json({
                    connected: connectionTest.success,
                    provider: 'Yalidine',
                    message: connectionTest.message
                });
            } catch (testError) {
                console.error('Yalidine test connection error:', testError);
                return NextResponse.json({
                    connected: false,
                    provider: 'Yalidine',
                    message: 'Erreur de test de connexion'
                });
            }
        }

        // Récupérer les wilayas
        if (action === 'wilayas') {
            const result = await client.getWilayas();
            return NextResponse.json({ data: result.data });
        }

        // Récupérer les communes
        if (action === 'communes') {
            const wilayaId = searchParams.get('wilaya_id');
            const result = await client.getCommunes(wilayaId ? parseInt(wilayaId) : undefined);
            return NextResponse.json({ data: result.data });
        }

        // Récupérer les centres (stop desk)
        if (action === 'centers') {
            const wilayaId = searchParams.get('wilaya_id');
            const result = await client.getCenters(wilayaId ? parseInt(wilayaId) : undefined);
            return NextResponse.json({ data: result.data });
        }

        // Récupérer les tarifs
        if (action === 'fees') {
            const fromWilaya = searchParams.get('from_wilaya_id') || '16'; // Alger par défaut
            const toWilaya = searchParams.get('to_wilaya_id');
            if (!toWilaya) {
                return NextResponse.json({ error: "to_wilaya_id requis" }, { status: 400 });
            }
            const result = await client.getFees(parseInt(fromWilaya), parseInt(toWilaya));
            return NextResponse.json({ data: result });
        }

        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });

    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/shipping/yalidine - Créer une expédition
export async function POST(request: NextRequest) {
    try {
        await requireAdmin(request);
        
        const body = await request.json();
        const { orderId, orderData } = body;

        if (!orderId || !orderData) {
            return NextResponse.json(
                { error: "orderId et orderData sont requis" },
                { status: 400 }
            );
        }

        const client = getYalidineClient();

        // Convertir en format Yalidine
        const parcel = orderToYalidineParcel({
            id: orderId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            address: orderData.address,
            wilaya: orderData.wilaya,
            commune: orderData.commune,
            total: orderData.total,
            items: orderData.items || [],
            deliveryType: orderData.deliveryType,
            stopDeskId: orderData.stopDeskId,
        }, orderData.fromWilaya || 'Alger');

        // Créer le colis
        const result = await client.createParcel(parcel);

        if (result.success) {
            return NextResponse.json({
                success: true,
                tracking: result.tracking,
                label: result.label,
                labels: result.labels,
                import_id: result.import_id
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.message || 'Erreur de création'
            }, { status: 400 });
        }

    } catch (error) {
        return handleApiError(error);
    }
}
