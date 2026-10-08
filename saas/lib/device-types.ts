// Mirrors src/knowledge.py TYPES — label_fr per device_type key the engine
// classifies devices into. Kept here for the pricing simulator's dropdowns.
export const DEVICE_TYPE_LABEL: Record<string, string> = {
  laser_hair_removal: "Laser épilation définitive",
  picosecond_laser: "Laser picoseconde",
  rf_microneedling: "Radiofréquence micro-aiguilles",
  hifu: "HIFU ultrasons focalisés",
  ipl_platform: "Plateforme IPL multi-applications",
  body_contouring: "Remodelage corporel / cryolipolyse",
  rf_skin_tightening: "Radiofréquence raffermissement",
  cryotherapy_cooling: "Refroidissement cutané / cryo",
  vascular_laser: "Laser vasculaire",
  co2_laser: "Laser CO2 fractionné",
  led_phototherapy: "Photothérapie LED",
  imaging_analysis: "Système d'imagerie et diagnostic cutané",
  multi_platform: "Plateforme esthétique multi-applications",
  acoustic_wave: "Ondes acoustiques / ondes de choc",
  sweat_reduction: "Traitement de l'hyperhidrose (micro-ondes)",
  hydro_oxygen_facial: "Soin visage hydro / oxygène",
  aesthetic_generic: "Appareil esthétique / médical (générique)",
};
