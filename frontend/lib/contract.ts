export type Provenance = "computed" | "external";

export interface ValueWithMeta<T = number> {
  value: T | null;
  unit: string | null;
  source: Provenance;
}

export type TrappingCategory = "Low" | "Moderate" | "High" | "Severe";

export interface TrappingReading {
  index: ValueWithMeta;
  category: TrappingCategory | null;
  interpretation: string | null;
  mixingDepthM: ValueWithMeta;
  windSpeedMs: ValueWithMeta;
  typicalMixingDepthM: ValueWithMeta;
}

export type InversionClass = "None" | "Weak" | "Moderate" | "Strong";

export interface InversionSeriesPoint {
  hourIso: string;
  strengthCPerKm: number | null;
  classification: InversionClass | null;
}

export interface InversionReading {
  present: boolean | null;
  strength: ValueWithMeta;
  classification: InversionClass | null;
  verticalSpanM: [number, number];
  explainerText: string;
  forwardSeries72h: InversionSeriesPoint[];
}

export interface TrappingSeriesPoint {
  hourIso: string;
  trappingIndex: number | null;
  category: string | null;
}

export interface RecoveryEstimate {
  withinWindow: boolean;
  estimatedDay?: string;
  estimatedPartOfDay?: "Morning" | "Afternoon" | "Evening" | "Night";
  driver?: string;
  uncertaintyNote?: string;
}

export interface M2Diagnostics {
  location: string;
  hourIso: string;
  serverNowIso: string;
  trapping: TrappingReading;
  trappingThresholdIndex: number;
  trappingSeries72h: TrappingSeriesPoint[];
  inversion: InversionReading;
  recovery: RecoveryEstimate;
}

export type PollutantCategory =
  | "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";

export interface CategoryBand {
  label: PollutantCategory;
  min: number;
  max: number;
}

export interface PollutantReading {
  reading: ValueWithMeta;
  category: PollutantCategory | null;
  timestampIso: string;
}

export interface PollutantSeriesPoint {
  hourIso: string;
  pm25: number | null;
  ozone: number | null;
}

export interface PollutantPeak {
  hourIso: string;
  value: number;
}

export interface M3Forecast {
  location: string;
  hourIso: string;
  pm25: PollutantReading;
  ozone: PollutantReading;
  series72h: PollutantSeriesPoint[];
  pm25Peak: PollutantPeak;
  ozonePeak: PollutantPeak;
  pm25Bands: CategoryBand[];
  ozoneBands: CategoryBand[];
}
