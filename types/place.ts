export interface Location {
  lat: number;
  lng: number;
}

export interface ReviewDistribution {
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
}

export interface OpeningHour {
  day: string;
  hours: string;
}

export interface Place {
  // Identidad
  title: string;
  subTitle?: string;
  placeId: string;
  categoryName: string;
  categories: string[];

  // Ubicación
  location: Location;
  address?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  countryCode?: string;

  // Contacto (Opcionales segun porcentaje de presencia)
  phone?: string;
  website?: string;
  url: string;

  // Valoraciones
  totalScore?: number;
  reviewsCount: number;
  reviewsDistribution?: ReviewDistribution;

  // Horarios
  openingHours?: OpeningHour[];
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;

  // Foto
  imageUrl?: string;
  imagesCount?: number;
}
