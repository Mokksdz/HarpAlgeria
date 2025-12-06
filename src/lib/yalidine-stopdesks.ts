/**
 * Yalidine Stop Desk Centers Data
 * Extracted from: https://yalidine.app/app/centre/
 */

export interface YalidineStopDesk {
  wilayaId: number;
  wilayaName: string;
  centersCount: number;
}

export const YALIDINE_STOPDESKS: YalidineStopDesk[] = [
  { wilayaId: 1, wilayaName: 'Adrar', centersCount: 1 },
  { wilayaId: 2, wilayaName: 'Chlef', centersCount: 3 },
  { wilayaId: 3, wilayaName: 'Laghouat', centersCount: 2 },
  { wilayaId: 4, wilayaName: 'Oum El Bouaghi', centersCount: 2 },
  { wilayaId: 5, wilayaName: 'Batna', centersCount: 3 },
  { wilayaId: 6, wilayaName: 'Béjaïa', centersCount: 4 },
  { wilayaId: 7, wilayaName: 'Biskra', centersCount: 2 },
  { wilayaId: 8, wilayaName: 'Béchar', centersCount: 2 },
  { wilayaId: 9, wilayaName: 'Blida', centersCount: 6 },
  { wilayaId: 10, wilayaName: 'Bouira', centersCount: 3 },
  { wilayaId: 11, wilayaName: 'Tamanrasset', centersCount: 3 },
  { wilayaId: 12, wilayaName: 'Tébessa', centersCount: 3 },
  { wilayaId: 13, wilayaName: 'Tlemcen', centersCount: 5 },
  { wilayaId: 14, wilayaName: 'Tiaret', centersCount: 1 },
  { wilayaId: 15, wilayaName: 'Tizi Ouzou', centersCount: 5 },
  { wilayaId: 16, wilayaName: 'Alger', centersCount: 23 },
  { wilayaId: 17, wilayaName: 'Djelfa', centersCount: 2 },
  { wilayaId: 18, wilayaName: 'Jijel', centersCount: 4 },
  { wilayaId: 19, wilayaName: 'Sétif', centersCount: 7 },
  { wilayaId: 20, wilayaName: 'Saïda', centersCount: 1 },
  { wilayaId: 21, wilayaName: 'Skikda', centersCount: 5 },
  { wilayaId: 22, wilayaName: 'Sidi Bel Abbès', centersCount: 2 },
  { wilayaId: 23, wilayaName: 'Annaba', centersCount: 4 },
  { wilayaId: 24, wilayaName: 'Guelma', centersCount: 2 },
  { wilayaId: 25, wilayaName: 'Constantine', centersCount: 7 },
  { wilayaId: 26, wilayaName: 'Médéa', centersCount: 4 },
  { wilayaId: 27, wilayaName: 'Mostaganem', centersCount: 2 },
  { wilayaId: 28, wilayaName: "M'Sila", centersCount: 4 },
  { wilayaId: 29, wilayaName: 'Mascara', centersCount: 1 },
  { wilayaId: 30, wilayaName: 'Ouargla', centersCount: 3 },
  { wilayaId: 31, wilayaName: 'Oran', centersCount: 7 },
  { wilayaId: 32, wilayaName: 'El Bayadh', centersCount: 1 },
  { wilayaId: 33, wilayaName: 'Illizi', centersCount: 2 },
  { wilayaId: 34, wilayaName: 'Bordj Bou Arreridj', centersCount: 2 },
  { wilayaId: 35, wilayaName: 'Boumerdès', centersCount: 4 },
  { wilayaId: 36, wilayaName: 'El Tarf', centersCount: 2 },
  { wilayaId: 37, wilayaName: 'Tindouf', centersCount: 1 },
  { wilayaId: 38, wilayaName: 'Tissemsilt', centersCount: 1 },
  { wilayaId: 39, wilayaName: 'El Oued', centersCount: 1 },
  { wilayaId: 40, wilayaName: 'Khenchela', centersCount: 1 },
  { wilayaId: 41, wilayaName: 'Souk Ahras', centersCount: 1 },
  { wilayaId: 42, wilayaName: 'Tipaza', centersCount: 4 },
  { wilayaId: 43, wilayaName: 'Mila', centersCount: 2 },
  { wilayaId: 44, wilayaName: 'Aïn Defla', centersCount: 2 },
  { wilayaId: 45, wilayaName: 'Naâma', centersCount: 1 },
  { wilayaId: 46, wilayaName: 'Aïn Témouchent', centersCount: 2 },
  { wilayaId: 47, wilayaName: 'Ghardaïa', centersCount: 2 },
  { wilayaId: 48, wilayaName: 'Relizane', centersCount: 1 },
  { wilayaId: 49, wilayaName: 'Timimoun', centersCount: 1 },
  { wilayaId: 51, wilayaName: 'Ouled Djellal', centersCount: 1 },
  { wilayaId: 53, wilayaName: 'In Salah', centersCount: 1 },
  { wilayaId: 55, wilayaName: 'Touggourt', centersCount: 1 },
  { wilayaId: 56, wilayaName: 'Djanet', centersCount: 1 },
  { wilayaId: 57, wilayaName: "El M'Ghair", centersCount: 2 },
  { wilayaId: 58, wilayaName: 'El Menia', centersCount: 1 },
];

// Get stop desk info by wilaya ID
export function getStopDeskInfo(wilayaId: number): YalidineStopDesk | undefined {
  return YALIDINE_STOPDESKS.find(sd => sd.wilayaId === wilayaId);
}

// Check if wilaya has stop desk centers
export function hasStopDesk(wilayaId: number): boolean {
  const info = getStopDeskInfo(wilayaId);
  return !!info && info.centersCount > 0;
}

// Get stop desk centers count
export function getStopDeskCount(wilayaId: number): number {
  const info = getStopDeskInfo(wilayaId);
  return info?.centersCount || 0;
}

// Total stop desk centers
export const TOTAL_STOPDESK_CENTERS = YALIDINE_STOPDESKS.reduce(
  (sum, sd) => sum + sd.centersCount, 
  0
);
