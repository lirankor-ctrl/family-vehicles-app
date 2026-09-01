import { AccidentSceneCategory } from '../types';

/** Hebrew labels for the guided scene-documentation checklist (wizard step 5). */
export const SCENE_CATEGORY_LABELS: Record<AccidentSceneCategory, string> = {
  wide_scene: 'צילום רחב של זירת התאונה',
  my_car_all_sides: 'הרכב שלי מכל הצדדים',
  my_car_damage_closeup: 'תקריב הנזק לרכב שלי',
  other_car: 'הרכב השני',
  other_car_damage_closeup: 'תקריב הנזק לרכב השני',
  other_car_plate: 'לוחית הרישוי של הרכב השני',
  vehicles_position: 'מיקום הרכבים ביחס לכביש',
  road_signs: 'תמרורים',
  traffic_lights: 'רמזורים',
  road_markings: 'סימוני כביש',
  skid_marks: 'סימני בלימה',
  debris: 'שברי רכב / חלקים על הכביש',
  additional_info: 'מידע נוסף שעשוי לעזור להבין מה קרה',
};
