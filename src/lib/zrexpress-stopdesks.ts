/**
 * ZR Express Stop Desk Centers Data
 * Source: Liste des bureaux ZRexpress (Mise à jour: 12/10/2025)
 */

export interface ZRStopDesk {
  wilayaId: number;
  wilayaName: string;
  centerName: string;
  address: string;
  phone: string;
  stopDeskPhone: string;
}

export const ZR_EXPRESS_STOPDESKS: ZRStopDesk[] = [
  // 01 - ADRAR
  {
    wilayaId: 1,
    wilayaName: "Adrar",
    centerName: "Adrar",
    address: "À côté de lycée ELMOGHILI, derrière le conseil judiciaire",
    phone: "0661.41.11.00",
    stopDeskPhone: "0661.41.11.00",
  },

  // 02 - CHLEF
  {
    wilayaId: 2,
    wilayaName: "Chlef",
    centerName: "Chlef",
    address: "Hay aroudj, derrière ADE en face le musée",
    phone: "0770.99.45.28",
    stopDeskPhone: "0770.99.46.74",
  },
  {
    wilayaId: 2,
    wilayaName: "Chlef",
    centerName: "Tenes",
    address:
      "N°6 commune de Tenes A, Rue Boufadis, Lot 51 Bâtiments, à côté de la caserne militaire, Route Marina Bâtiments Mandil",
    phone: "0770.99.35.71",
    stopDeskPhone: "0770.99.35.72",
  },

  // 03 - LAGHOUAT
  {
    wilayaId: 3,
    wilayaName: "Laghouat",
    centerName: "Laghouat",
    address: "Cité Mhafir, En face parking du département de biologie",
    phone: "0674.40.38.81",
    stopDeskPhone: "0670.30.03.97",
  },

  // 04 - OUM EL BOUAGHI
  {
    wilayaId: 4,
    wilayaName: "Oum El Bouaghi",
    centerName: "Ain El Beida",
    address: "Tahsise El Amel, en face le collège Koshari, Ain El Bayda",
    phone: "0698.63.12.34",
    stopDeskPhone: "0660.73.74.78",
  },
  {
    wilayaId: 4,
    wilayaName: "Oum El Bouaghi",
    centerName: "Centre-Ville",
    address: "N°392 cité ennacer",
    phone: "0698.63.12.34",
    stopDeskPhone: "0770.07.29.11",
  },

  // 05 - BATNA
  {
    wilayaId: 5,
    wilayaName: "Batna",
    centerName: "Batna",
    address: "Les allés jadida erriad, à côté supérette el bahja",
    phone: "0659.78.12.34",
    stopDeskPhone: "0770.55.80.86",
  },

  // 06 - BEJAIA
  {
    wilayaId: 6,
    wilayaName: "Béjaïa",
    centerName: "Béjaïa",
    address: "Edimco, Cité somacob",
    phone: "0698.86.12.34",
    stopDeskPhone: "0770.96.82.04",
  },
  {
    wilayaId: 6,
    wilayaName: "Béjaïa",
    centerName: "Akbou",
    address: "Gare ferroviaire, à côté salle des fêtes HADAD",
    phone: "0770.10.46.84",
    stopDeskPhone: "0770.10.46.92",
  },

  // 07 - BISKRA
  {
    wilayaId: 7,
    wilayaName: "Biskra",
    centerName: "Biskra",
    address: "El koures, en face salle des fêtes soukara",
    phone: "0771.53.40.58",
    stopDeskPhone: "0770.72.87.34",
  },

  // 08 - BECHAR
  {
    wilayaId: 8,
    wilayaName: "Béchar",
    centerName: "Béchar",
    address: "Cité 220 log, À côté de la Direction de l'Eau (ADE)",
    phone: "0770.05.94.98",
    stopDeskPhone: "0770.76.53.73",
  },

  // 09 - BLIDA
  {
    wilayaId: 9,
    wilayaName: "Blida",
    centerName: "Blida-Ville",
    address: "Cité Ben Mokadem Mohammed N°276-Ramoul en face l'agence",
    phone: "0562.29.42.14",
    stopDeskPhone: "0799.71.81.02",
  },
  {
    wilayaId: 9,
    wilayaName: "Blida",
    centerName: "Bouguara",
    address: "Rue Hamidouche Mouloud, Route d'Alger, Bouguara",
    phone: "0771.92.80.94",
    stopDeskPhone: "0779.42.62.22",
  },
  {
    wilayaId: 9,
    wilayaName: "Blida",
    centerName: "Mouzaia",
    address: "Rue Ben Ahmed Ali Aslaoui, N° 45, Mouzaia",
    phone: "0774.53.19.22",
    stopDeskPhone: "0773.86.25.07",
  },

  // 10 - BOUIRA
  {
    wilayaId: 10,
    wilayaName: "Bouira",
    centerName: "Bouira",
    address: "338 log, En face de l'hôtel Sofy",
    phone: "06.57.70.05.64",
    stopDeskPhone: "0770.77.87.43",
  },

  // 11 - TAMANRASSET
  {
    wilayaId: 11,
    wilayaName: "Tamanrasset",
    centerName: "Tamanrasset",
    address: "Cité El Wiam, en face CASNOS",
    phone: "0770.99.42.57",
    stopDeskPhone: "0670.74.39.61",
  },

  // 12 - TEBESSA
  {
    wilayaId: 12,
    wilayaName: "Tébessa",
    centerName: "Tébessa",
    address:
      "Tahsis El arebi El Tebsi (Skanska) en face la Direction d'Etat de la Poste d'Algerie de Tebessa",
    phone: "0659.43.06.81",
    stopDeskPhone: "0779.87.30.36",
  },

  // 13 - TLEMCEN
  {
    wilayaId: 13,
    wilayaName: "Tlemcen",
    centerName: "Tlemcen",
    address: "En face Rondpoint cité des oliviers",
    phone: "0660.88.41.56",
    stopDeskPhone: "0671.44.6.27",
  },

  // 14 - TIARET
  {
    wilayaId: 14,
    wilayaName: "Tiaret",
    centerName: "Tiaret",
    address:
      "Route l'académié en face de l'hopital du rein, à côté de la librairie Mimouni",
    phone: "0667.18.42.55",
    stopDeskPhone: "0770.38.32.20",
  },

  // 15 - TIZI OUZOU
  {
    wilayaId: 15,
    wilayaName: "Tizi Ouzou",
    centerName: "Tizi Ouzou",
    address:
      "Lot Sud-Ouest 314, à côté du Boulevard Stiti (anciennement Concorde), à proximité des Trois Roses et de la salle Omnisport Need for Gym",
    phone: "0770.18.06.02",
    stopDeskPhone: "0770.18.06.02",
  },

  // 16 - ALGER
  {
    wilayaId: 16,
    wilayaName: "Alger",
    centerName: "Birkhadem",
    address: "Rue des Rosiers, El Malha Birkhadem",
    phone: "0770.70.50.07",
    stopDeskPhone: "0770.58.40.33",
  },
  {
    wilayaId: 16,
    wilayaName: "Alger",
    centerName: "Ouled Fayet",
    address: "Ouled Fayet rue Boualem Rasoul, pas loin de Société Générale",
    phone: "0770.07.27.03",
    stopDeskPhone: "0770.06.94.04",
  },
  {
    wilayaId: 16,
    wilayaName: "Alger",
    centerName: "Reghaia",
    address: "Cité Amirouche 692 (Batigec) Bt 03 Num A07",
    phone: "0799.57.57.15",
    stopDeskPhone: "0770.21.54.48",
  },
  {
    wilayaId: 16,
    wilayaName: "Alger",
    centerName: "Bordj El Kiffan",
    address: "Lido, Pas loin de stade de tennis",
    phone: "0770.36.39.02",
    stopDeskPhone: "0770.36.39.02",
  },
  {
    wilayaId: 16,
    wilayaName: "Alger",
    centerName: "Birtouta",
    address:
      "Cité de l'anciens abatoire, derrière la salle des fetes bent sultan, Birtouta",
    phone: "0770.93.49.22",
    stopDeskPhone: "0776.06.31.54",
  },
  {
    wilayaId: 16,
    wilayaName: "Alger",
    centerName: "Baraki",
    address:
      "Baraki, Route de Larbaa Bougaraa, dans le meme immeuble que la selle de musculation OLYMPIC GYM",
    phone: "0770.18.38.44",
    stopDeskPhone: "0770.18.38.71",
  },

  // 17 - DJELFA
  {
    wilayaId: 17,
    wilayaName: "Djelfa",
    centerName: "Djelfa",
    address:
      "Cité berbih, à côté de la direction de l'action sociale et de la solidarité LA DASS",
    phone: "0657.70.01.76",
    stopDeskPhone: "0770.28.29.35",
  },

  // 18 - JIJEL
  {
    wilayaId: 18,
    wilayaName: "Jijel",
    centerName: "Jijel",
    address:
      "Rue Kamal Ismail, en face de l'entrée principale de l'Université Jijel Ekiti",
    phone: "0657.64.62.84",
    stopDeskPhone: "0660.16.93.08",
  },
  {
    wilayaId: 18,
    wilayaName: "Jijel",
    centerName: "Taher",
    address:
      "Boukaabour, la route menant à la clinique d'ophtalmologie Mahanan",
    phone: "0670.42.32.04",
    stopDeskPhone: "0670.42.32.05",
  },

  // 19 - SETIF
  {
    wilayaId: 19,
    wilayaName: "Sétif",
    centerName: "Sétif-Ville",
    address: "Cité Dalas 3ème tranche, à côté de la maison LG et IRIS",
    phone: "0770.78.80.97",
    stopDeskPhone: "0770.18.85.05",
  },
  {
    wilayaId: 19,
    wilayaName: "Sétif",
    centerName: "El Eulma",
    address:
      "Logement covalente, derrière hôtel Rif, à coté la mosquée Imam Shaafei",
    phone: "0770.78.80.97",
    stopDeskPhone: "0770.80.40.09",
  },

  // 20 - SAIDA
  {
    wilayaId: 20,
    wilayaName: "Saïda",
    centerName: "Saïda",
    address: "Cité 5 juillet, en face la pharmacie 5 juillet",
    phone: "0795.27.12.65",
    stopDeskPhone: "0770.39.16.95",
  },

  // 21 - SKIKDA
  {
    wilayaId: 21,
    wilayaName: "Skikda",
    centerName: "Skikda",
    address: "Cité Mohammed Namous N°02 Mag 02, pas loin de Hammam Derradji",
    phone: "0770.30.88.09",
    stopDeskPhone: "0773.85.06.22",
  },

  // 22 - SIDI BEL ABBES
  {
    wilayaId: 22,
    wilayaName: "Sidi Bel Abbès",
    centerName: "Sidi Bel Abbès",
    address:
      "Ben Hamouda, En face à la Station de Tramway AADL Ben Hamouda, à côté des magasins Bébé Luxe",
    phone: "0778.15.20.27",
    stopDeskPhone: "0770.57.93.68",
  },

  // 23 - ANNABA
  {
    wilayaId: 23,
    wilayaName: "Annaba",
    centerName: "Annaba-Ville",
    address: "Rue l'avant-port, à côté de supérette Ben Amara",
    phone: "0770.35.07.90",
    stopDeskPhone: "0657.81.29.59",
  },
  {
    wilayaId: 23,
    wilayaName: "Annaba",
    centerName: "El Bouni",
    address: "EL-Bouni, En face Algérie Télécom",
    phone: "0797.40.57.33",
    stopDeskPhone: "0770.29.99.73",
  },

  // 24 - GUELMA
  {
    wilayaId: 24,
    wilayaName: "Guelma",
    centerName: "Guelma",
    address: "À côté de cafétera de la fontaine - fontaine la",
    phone: "0791.48.22.66",
    stopDeskPhone: "0770.96.22.21",
  },

  // 25 - CONSTANTINE
  {
    wilayaId: 25,
    wilayaName: "Constantine",
    centerName: "Zouaghi",
    address: "Cité tlemcen, 72, Zouaghi Slimen",
    phone: "0770.77.71.59",
    stopDeskPhone: "0770.54.53.05",
  },
  {
    wilayaId: 25,
    wilayaName: "Constantine",
    centerName: "Ali Mendjeli",
    address: "Zone industrielle, Nouvelle ville Ali Mendjeli",
    phone: "0770.77.71.59",
    stopDeskPhone: "0770.14.49.99",
  },
  {
    wilayaId: 25,
    wilayaName: "Constantine",
    centerName: "Belle Vue",
    address: "Belle vue",
    phone: "0770.77.71.59",
    stopDeskPhone: "0770.79.60.44",
  },

  // 26 - MEDEA
  {
    wilayaId: 26,
    wilayaName: "Médéa",
    centerName: "Médéa",
    address:
      "Beziwech rue takhabit, au-dessous du cabinet de gynécologie dr khelifi",
    phone: "0779.46.02.70",
    stopDeskPhone: "0660.65.10.15",
  },

  // 27 - MOSTAGANEM
  {
    wilayaId: 27,
    wilayaName: "Mostaganem",
    centerName: "Mostaganem",
    address: "Cité colonel Amirouche, En face Tribunal",
    phone: "0670.26.92.10",
    stopDeskPhone: "0660.67.37.78",
  },

  // 28 - M\'SILA
  {
    wilayaId: 28,
    wilayaName: "M'Sila",
    centerName: "M'Sila",
    address: "Cité cheikh Mokrani, à côté de la mosquée Aisha oum el mouminine",
    phone: "0770.64.16.63",
    stopDeskPhone: "0770.52.29.72",
  },
  {
    wilayaId: 28,
    wilayaName: "M'Sila",
    centerName: "Bousaada",
    address:
      "City HADHABA Rute Mouhamed Atik N° 52/11 Bousaada, À Côté de Branche Municipale",
    phone: "0770.29.78.55",
    stopDeskPhone: "0770.29.78.57",
  },

  // 29 - MASCARA
  {
    wilayaId: 29,
    wilayaName: "Mascara",
    centerName: "Mascara",
    address: "Rue Mahour Mahie Eddine, en face les Pompiers",
    phone: "0668.05.25.17",
    stopDeskPhone: "0793.57.76.79",
  },

  // 30 - OUARGLA
  {
    wilayaId: 30,
    wilayaName: "Ouargla",
    centerName: "Ouargla",
    address: "Cité Tazegrar, à côté hôtel de police",
    phone: "0792.78.57.46",
    stopDeskPhone: "0654.73.52.53",
  },
  {
    wilayaId: 30,
    wilayaName: "Ouargla",
    centerName: "Hassi Messaoud",
    address: "Cité 1850 logement, en face Maison KIA",
    phone: "0770.55.88.88",
    stopDeskPhone: "0654.74.52.53",
  },

  // 31 - ORAN
  {
    wilayaId: 31,
    wilayaName: "Oran",
    centerName: "El Morchid",
    address: "El morchid, à côté des magasins d'électroménagers",
    phone: "0770.39.52.00",
    stopDeskPhone: "0770.12.84.13",
  },
  {
    wilayaId: 31,
    wilayaName: "Oran",
    centerName: "Canastel",
    address:
      "Quartier chahid Heni Bachir, Canastel, Route de CASNOS, Commune de Bir El Djir",
    phone: "0770.60.13.17",
    stopDeskPhone: "0770.76.80.77",
  },
  {
    wilayaId: 31,
    wilayaName: "Oran",
    centerName: "Maraval",
    address: "Derrière le magasin Look de Maraval",
    phone: "0770.16.96.59",
    stopDeskPhone: "0770.16.99.93",
  },

  // 32 - EL BAYADH
  {
    wilayaId: 32,
    wilayaName: "El Bayadh",
    centerName: "El Bayadh",
    address:
      "Cité ancien stade, à côté de l'huissier de justice Djouadi Malika",
    phone: "0770.22.96.32",
    stopDeskPhone: "0770.22.96.32",
  },

  // 34 - BORDJ BOU ARRERIDJ
  {
    wilayaId: 34,
    wilayaName: "Bordj Bou Arréridj",
    centerName: "Bordj Bou Arréridj",
    address: "Rue chelbabi Messaoud, En face showroom AMIR AUTO",
    phone: "0770.70.91.66",
    stopDeskPhone: "0770.42.76.33",
  },

  // 35 - BOUMERDES
  {
    wilayaId: 35,
    wilayaName: "Boumerdès",
    centerName: "Boumerdès",
    address: "Rue Mohamed El Mahdi, Sur le chemin de l'hôtel les Lilas",
    phone: "0773.74.98.99",
    stopDeskPhone: "0775.43.54.33",
  },
  {
    wilayaId: 35,
    wilayaName: "Boumerdès",
    centerName: "Bordj Menaiel",
    address:
      "Cooperative Elghazali, cité 20 aout, BORDJ MENAIEL, en face DR. SADJI",
    phone: "0775.06.72.89",
    stopDeskPhone: "0553.05.92.69",
  },

  // 36 - EL TARF
  {
    wilayaId: 36,
    wilayaName: "El Tarf",
    centerName: "El Tarf",
    address: "Rue khmiss tine, en face le premier arrondissement",
    phone: "0670.43.22.38",
    stopDeskPhone: "0670.02.51.05",
  },

  // 38 - TISSEMSILT
  {
    wilayaId: 38,
    wilayaName: "Tissemsilt",
    centerName: "Tissemsilt",
    address: "Quartier El-Marjha, à côté de la pharmacie Ben Moussa",
    phone: "0770.79.80.60",
    stopDeskPhone: "0770.79.80.48",
  },

  // 39 - EL OUED
  {
    wilayaId: 39,
    wilayaName: "El Oued",
    centerName: "El Oued",
    address: "Cité Sidi Abdellah, derrière la poste",
    phone: "0791.69.99.02",
    stopDeskPhone: "0698.90.15.50",
  },

  // 40 - KHENCHELA
  {
    wilayaId: 40,
    wilayaName: "Khenchela",
    centerName: "Khenchela",
    address:
      "Route Babar 1, Bou Maaraf, Lablali, a côté de supérette Merah et de la clinique Al-Ihsan",
    phone: "0560.62.23.25",
    stopDeskPhone: "0657.98.93.65",
  },

  // 41 - SOUK AHRAS
  {
    wilayaId: 41,
    wilayaName: "Souk Ahras",
    centerName: "Souk Ahras",
    address: "Route nationale N°16 les sapins",
    phone: "0792.27.06.61",
    stopDeskPhone: "0770.96.16.15",
  },

  // 42 - TIPAZA
  {
    wilayaId: 42,
    wilayaName: "Tipaza",
    centerName: "Tipaza",
    address: "La nouvelle AADL 1700, en face l'ONPS",
    phone: "0770.42.07.24",
    stopDeskPhone: "0770.92.31.37",
  },
  {
    wilayaId: 42,
    wilayaName: "Tipaza",
    centerName: "Kolea",
    address: "Route d'Alger à côté du café de ver",
    phone: "0551.20.04.59",
    stopDeskPhone: "0551.21.06.91",
  },

  // 43 - MILA
  {
    wilayaId: 43,
    wilayaName: "Mila",
    centerName: "Mila",
    address: "Jamouaa Milkia N°34, à côté l'agence Sonalgaz",
    phone: "0657.22.47.73",
    stopDeskPhone: "0660.90.94.48",
  },

  // 44 - AIN DEFLA
  {
    wilayaId: 44,
    wilayaName: "Aïn Defla",
    centerName: "Aïn Defla",
    address: "Rond-point cyliste, En face la daira",
    phone: "0770.99.42.68",
    stopDeskPhone: "0770.99.45.81",
  },

  // 45 - NAAMA
  {
    wilayaId: 45,
    wilayaName: "Naâma",
    centerName: "Naâma",
    address: "Route nationale n°6, en face de l'hôtel Al Amin",
    phone: "0699.29.60.40",
    stopDeskPhone: "0770.03.39.23",
  },

  // 46 - AIN TEMOUCHENT
  {
    wilayaId: 46,
    wilayaName: "Aïn Témouchent",
    centerName: "Aïn Témouchent",
    address: "Hai Ezaitoun, à côté de la mosquée Oussama Abu Zaid (El Bechari)",
    phone: "0770.76.66.82",
    stopDeskPhone: "0770.76.66.90",
  },

  // 47 - GHARDAIA
  {
    wilayaId: 47,
    wilayaName: "Ghardaïa",
    centerName: "Ghardaïa",
    address:
      "Hadj Masoud, en face au commissariat de police et de protection civile",
    phone: "0770.50.50.18",
    stopDeskPhone: "0654.76.52.52",
  },

  // 48 - RELIZANE
  {
    wilayaId: 48,
    wilayaName: "Relizane",
    centerName: "Relizane",
    address: "Îlot 183, Boulevard de la république N°45, Centre-ville",
    phone: "0770.96.40.17",
    stopDeskPhone: "0770.96.40.52",
  },

  // 49 - TIMIMOUN
  {
    wilayaId: 49,
    wilayaName: "Timimoun",
    centerName: "Timimoun",
    address: "En face la station El Haj Mamo, à côté de la pharmacie arabe",
    phone: "0658.50.49.36",
    stopDeskPhone: "0655.52.86.16",
  },

  // 51 - OULED DJELLAL
  {
    wilayaId: 51,
    wilayaName: "Ouled Djellal",
    centerName: "Ouled Djellal",
    address: "Rue Mithana, à côté la maison de jeune",
    phone: "0770.76.49.05",
    stopDeskPhone: "0770.01.70.55",
  },

  // 52 - BENI ABBES
  {
    wilayaId: 52,
    wilayaName: "Béni Abbès",
    centerName: "Béni Abbès",
    address:
      "Cité el moustakbel, en face de la nouvelle annexe de l'APC et du nouveau siège de la nouvelle banque d'algérie",
    phone: "0662.56.67.02",
    stopDeskPhone: "0656.92.83.39",
  },

  // 55 - TOUGGOURT
  {
    wilayaId: 55,
    wilayaName: "Touggourt",
    centerName: "Touggourt",
    address: "Cité sidi abdessalem, Entre BEA et CPA",
    phone: "0791.69.99.02",
    stopDeskPhone: "0663.66.64.22",
  },

  // 59 - AFLOU
  {
    wilayaId: 59,
    wilayaName: "Aflou",
    centerName: "Aflou",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 60 - BARIKA
  {
    wilayaId: 60,
    wilayaName: "Barika",
    centerName: "Barika",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 61 - KSAR CHELLALA
  {
    wilayaId: 61,
    wilayaName: "Ksar Chellala",
    centerName: "Ksar Chellala",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 62 - MESSAAD
  {
    wilayaId: 62,
    wilayaName: "Messaad",
    centerName: "Messaad",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 63 - AIN OUSSARA
  {
    wilayaId: 63,
    wilayaName: "Aïn Oussara",
    centerName: "Aïn Oussara",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 64 - BOU SAADA
  {
    wilayaId: 64,
    wilayaName: "Bou Saâda",
    centerName: "Bou Saâda",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 65 - EL ABIODH SIDI CHEIKH
  {
    wilayaId: 65,
    wilayaName: "El Abiodh Sidi Cheikh",
    centerName: "El Abiodh Sidi Cheikh",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 66 - EL KANTARA
  {
    wilayaId: 66,
    wilayaName: "El Kantara",
    centerName: "El Kantara",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 67 - BIR EL ATER
  {
    wilayaId: 67,
    wilayaName: "Bir El Ater",
    centerName: "Bir El Ater",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 68 - KSAR EL BOUKHARI
  {
    wilayaId: 68,
    wilayaName: "Ksar El Boukhari",
    centerName: "Ksar El Boukhari",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },

  // 69 - EL ARICHA
  {
    wilayaId: 69,
    wilayaName: "El Aricha",
    centerName: "El Aricha",
    address: "",
    phone: "",
    stopDeskPhone: "",
  },
];

// Get stop desks by wilaya ID
export function getZRStopDesks(wilayaId: number): ZRStopDesk[] {
  return ZR_EXPRESS_STOPDESKS.filter((sd) => sd.wilayaId === wilayaId);
}

// Check if wilaya has ZR Express stop desk
export function hasZRStopDesk(wilayaId: number): boolean {
  return ZR_EXPRESS_STOPDESKS.some((sd) => sd.wilayaId === wilayaId);
}

// Get all wilayas with stop desks
export function getZRStopDeskWilayas(): number[] {
  return [...new Set(ZR_EXPRESS_STOPDESKS.map((sd) => sd.wilayaId))];
}

// Total stop desk centers
export const TOTAL_ZR_STOPDESK_CENTERS = ZR_EXPRESS_STOPDESKS.length;
