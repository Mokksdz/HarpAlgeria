export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-white text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6 text-3xl">
        📡
      </div>
      <h1 className="text-2xl font-serif font-bold mb-2 text-gray-900">
        Vous êtes hors ligne
      </h1>
      <p className="text-gray-500 mb-6 max-w-md">
        Vérifiez votre connexion internet et réessayez. Certaines pages
        consultées récemment sont disponibles hors ligne.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-harp-brown text-white px-6 py-3 rounded-full hover:bg-harp-caramel transition-colors font-medium"
      >
        Réessayer
      </button>
    </div>
  );
}
