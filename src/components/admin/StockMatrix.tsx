"use client";

interface StockMatrixProps {
  sizes: string[];
  colors: string[];
  variants: { size: string; color: string; stock: number }[];
  onChange: (variants: { size: string; color: string; stock: number }[]) => void;
}

export default function StockMatrix({
  sizes,
  colors,
  variants,
  onChange,
}: StockMatrixProps) {
  const getStock = (size: string, color: string) => {
    const v = variants.find((v) => v.size === size && v.color === color);
    return v?.stock ?? 0;
  };

  const setStock = (size: string, color: string, stock: number) => {
    const existing = variants.filter(
      (v) => !(v.size === size && v.color === color),
    );
    onChange([...existing, { size, color, stock }]);
  };

  const totalBySize = (size: string) =>
    colors.reduce((sum, color) => sum + getStock(size, color), 0);

  const totalByColor = (color: string) =>
    sizes.reduce((sum, size) => sum + getStock(size, color), 0);

  const grandTotal = variants.reduce((sum, v) => sum + v.stock, 0);

  if (sizes.length === 0 || colors.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        Ajoutez des tailles et couleurs pour configurer le stock par variante.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Taille / Couleur
            </th>
            {colors.map((color) => (
              <th
                key={color}
                className="p-2 text-xs font-bold text-gray-500 uppercase tracking-widest text-center"
              >
                {color}
              </th>
            ))}
            <th className="p-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size} className="border-t border-gray-100">
              <td className="p-2 font-medium text-gray-700">{size}</td>
              {colors.map((color) => (
                <td key={`${size}-${color}`} className="p-2">
                  <input
                    type="number"
                    min="0"
                    value={getStock(size, color)}
                    onChange={(e) =>
                      setStock(size, color, parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-gray-50 border-none p-2 rounded-lg text-center focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm"
                  />
                </td>
              ))}
              <td className="p-2 text-center text-gray-400 font-medium">
                {totalBySize(size)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-200">
            <td className="p-2 text-xs font-bold text-gray-400 uppercase">
              Total
            </td>
            {colors.map((color) => (
              <td
                key={color}
                className="p-2 text-center text-gray-400 font-medium"
              >
                {totalByColor(color)}
              </td>
            ))}
            <td className="p-2 text-center font-bold text-gray-700">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
