import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center bg-white">
            <Loader2 size={32} className="text-gray-900 animate-spin" />
        </div>
    );
}
