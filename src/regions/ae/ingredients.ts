import type { Ingredient } from '../../types';

/**
 * The Dubai catalogue. Macros are per 100 g (per 100 ml for liquids) and are
 * carried over from the Swedish and Croatian rows for the same product —
 * chicken breast is chicken breast, and retyping ninety nutrition panels would
 * only invent transcription errors. The rows with no counterpart elsewhere —
 * tahini, freekeh, labneh, the spice blends — follow manufacturer declarations
 * for what Union Coop and Lulu actually stock.
 *
 * Prices are approximate AED/kg shelf prices and exist to give the plan a
 * realistic weekly cost. They are hand-estimated, exactly as the other regions'
 * are, and will drift. Treat the total as a planning figure and not a receipt.
 *
 * `name` and `en` hold the same string throughout, and so do `packName` and
 * `packNameEn`. This is the first region whose own language is English: there
 * is genuinely only one name, and `ingredientSubtitle` returns '' rather than
 * printing it twice.
 *
 * Ids carry an `ae-` prefix. The ingredient registry is shared across regions
 * rather than split per region, which is only sound while ids do not collide;
 * the prefix makes that true by construction. See src/regions/regions.test.ts.
 *
 * Pork sits in the meat section here as it does elsewhere, tagged `meat` and
 * `pork`. Note that UAE supermarkets sell it from a separate licensed room
 * rather than the main chiller — the shopping list cannot say so, but the
 * `pork` tag lets anyone who would rather not walk in there switch it off.
 */
export const AE_INGREDIENTS: Ingredient[] = [

  // ── Fruit & Veg ─────────────────────────────────────────────────────────
  { id: 'ae-banana', name: 'Banana', en: 'Banana', dept: 'produce', kcal: 89, protein: 1.1, carbs: 21, fat: 0.3, pricePerKg: 6.5, packSize: 1000, packName: 'loose', packNameEn: 'loose', unitWeight: 120, tags: [] },
  { id: 'ae-broccoli', name: 'Broccoli', en: 'Broccoli', dept: 'produce', kcal: 34, protein: 2.8, carbs: 4, fat: 0.4, pricePerKg: 13, packSize: 500, packName: 'approx 500 g', packNameEn: 'approx 500 g', tags: [] },
  { id: 'ae-cauliflower', name: 'Cauliflower', en: 'Cauliflower', dept: 'produce', kcal: 25, protein: 1.9, carbs: 3, fat: 0.3, pricePerKg: 9, packSize: 600, packName: '1 head approx 600 g', packNameEn: '1 head approx 600 g', tags: [] },
  { id: 'ae-bell-pepper', name: 'Bell pepper', en: 'Bell pepper', dept: 'produce', kcal: 31, protein: 1, carbs: 6, fat: 0.3, pricePerKg: 12, packSize: 450, packName: 'pack of 3', packNameEn: 'pack of 3', unitWeight: 150, tags: [] },
  { id: 'ae-onion', name: 'Yellow onion', en: 'Yellow onion', dept: 'produce', kcal: 40, protein: 1.1, carbs: 8, fat: 0.1, pricePerKg: 4, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', unitWeight: 110, staple: true, tags: [] },
  { id: 'ae-red-onion', name: 'Red onion', en: 'Red onion', dept: 'produce', kcal: 40, protein: 1.1, carbs: 8, fat: 0.1, pricePerKg: 5.5, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', unitWeight: 100, tags: [] },
  { id: 'ae-garlic', name: 'Garlic', en: 'Garlic', dept: 'produce', kcal: 149, protein: 6, carbs: 30, fat: 0.5, pricePerKg: 18, packSize: 200, packName: 'net 200 g', packNameEn: 'net 200 g', unitWeight: 5, staple: true, tags: [] },
  { id: 'ae-carrots', name: 'Carrots', en: 'Carrots', dept: 'produce', kcal: 41, protein: 0.9, carbs: 8, fat: 0.2, pricePerKg: 5, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'ae-potatoes', name: 'Potatoes', en: 'Potatoes', dept: 'produce', kcal: 77, protein: 2, carbs: 16, fat: 0.1, pricePerKg: 4.5, packSize: 2000, packName: 'bag 2 kg', packNameEn: 'bag 2 kg', tags: [] },
  { id: 'ae-sweet-potato', name: 'Sweet potato', en: 'Sweet potato', dept: 'produce', kcal: 86, protein: 1.6, carbs: 18, fat: 0.1, pricePerKg: 9, packSize: 1000, packName: 'loose', packNameEn: 'loose', tags: [] },
  { id: 'ae-tomato', name: 'Tomato', en: 'Tomato', dept: 'produce', kcal: 18, protein: 0.9, carbs: 3, fat: 0.2, pricePerKg: 7, packSize: 1000, packName: 'pack 1 kg', packNameEn: 'pack 1 kg', unitWeight: 110, tags: [] },
  { id: 'ae-cherry-tomatoes', name: 'Cherry tomatoes', en: 'Cherry tomatoes', dept: 'produce', kcal: 30, protein: 0.9, carbs: 4, fat: 0.3, pricePerKg: 18, packSize: 250, packName: 'punnet 250 g', packNameEn: 'punnet 250 g', tags: [] },
  { id: 'ae-cucumber', name: 'Cucumber', en: 'Cucumber', dept: 'produce', kcal: 15, protein: 0.7, carbs: 2, fat: 0.1, pricePerKg: 6, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', tags: [] },
  { id: 'ae-aubergine', name: 'Aubergine', en: 'Aubergine', dept: 'produce', kcal: 25, protein: 1, carbs: 3, fat: 0.2, pricePerKg: 7, packSize: 500, packName: 'approx 500 g', packNameEn: 'approx 500 g', unitWeight: 250, tags: [] },
  { id: 'ae-courgette', name: 'Courgette', en: 'Courgette', dept: 'produce', kcal: 17, protein: 1.2, carbs: 2, fat: 0.3, pricePerKg: 7, packSize: 500, packName: 'approx 500 g', packNameEn: 'approx 500 g', tags: [] },
  { id: 'ae-baby-spinach', name: 'Baby spinach', en: 'Baby spinach', dept: 'produce', kcal: 23, protein: 2.9, carbs: 1, fat: 0.4, pricePerKg: 22, packSize: 200, packName: 'bag 200 g', packNameEn: 'bag 200 g', storeQuery: 'spinach', tags: [] },
  { id: 'ae-mushrooms', name: 'Mushrooms', en: 'Mushrooms', dept: 'produce', kcal: 22, protein: 3.1, carbs: 0.3, fat: 0.3, pricePerKg: 20, packSize: 250, packName: 'punnet 250 g', packNameEn: 'punnet 250 g', tags: [] },
  { id: 'ae-avocado', name: 'Avocado', en: 'Avocado', dept: 'produce', kcal: 160, protein: 2, carbs: 2, fat: 15, pricePerKg: 24, packSize: 400, packName: 'pack of 2', packNameEn: 'pack of 2', unitWeight: 200, tags: [] },
  { id: 'ae-lemon', name: 'Lemon', en: 'Lemon', dept: 'produce', kcal: 29, protein: 1.1, carbs: 3, fat: 0.3, pricePerKg: 9, packSize: 500, packName: 'net 500 g', packNameEn: 'net 500 g', unitWeight: 100, staple: true, tags: [] },
  { id: 'ae-ginger', name: 'Ginger', en: 'Ginger', dept: 'produce', kcal: 80, protein: 1.8, carbs: 15, fat: 0.8, pricePerKg: 14, packSize: 100, packName: 'loose', packNameEn: 'loose', staple: true, tags: [] },
  { id: 'ae-parsley', name: 'Flat-leaf parsley', en: 'Flat-leaf parsley', dept: 'produce', kcal: 36, protein: 3, carbs: 3, fat: 0.8, pricePerKg: 20, packSize: 100, packName: 'bunch approx 100 g', packNameEn: 'bunch approx 100 g', tags: [] },
  { id: 'ae-mint', name: 'Fresh mint', en: 'Fresh mint', dept: 'produce', kcal: 44, protein: 3.3, carbs: 5, fat: 0.7, pricePerKg: 22, packSize: 50, packName: 'bunch approx 50 g', packNameEn: 'bunch approx 50 g', tags: [] },
  { id: 'ae-coriander', name: 'Fresh coriander', en: 'Fresh coriander', dept: 'produce', kcal: 23, protein: 2.1, carbs: 1, fat: 0.5, pricePerKg: 20, packSize: 50, packName: 'bunch approx 50 g', packNameEn: 'bunch approx 50 g', tags: [] },

  // ── Meat ────────────────────────────────────────────────────────────────
  { id: 'ae-chicken-breast', name: 'Chicken breast', en: 'Chicken breast', dept: 'meat', kcal: 106, protein: 22.5, carbs: 0, fat: 1.7, pricePerKg: 26, packSize: 900, packName: 'tray approx 900 g', packNameEn: 'tray approx 900 g', tags: ['meat'] },
  { id: 'ae-chicken-thigh', name: 'Chicken thigh fillet', en: 'Chicken thigh fillet', dept: 'meat', kcal: 150, protein: 19, carbs: 0, fat: 8, pricePerKg: 19, packSize: 800, packName: 'tray approx 800 g', packNameEn: 'tray approx 800 g', tags: ['meat'] },
  { id: 'ae-turkey-breast', name: 'Turkey breast', en: 'Turkey breast', dept: 'meat', kcal: 105, protein: 23, carbs: 0.5, fat: 1, pricePerKg: 38, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['meat'] },
  { id: 'ae-lean-beef-mince', name: 'Lean beef mince 5%', en: 'Lean beef mince 5%', dept: 'meat', kcal: 130, protein: 21, carbs: 0, fat: 5, pricePerKg: 42, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', storeQuery: 'beef mince', tags: ['meat'] },
  { id: 'ae-beef-mince', name: 'Beef mince 10%', en: 'Beef mince 10%', dept: 'meat', kcal: 176, protein: 19, carbs: 0, fat: 11, pricePerKg: 32, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', storeQuery: 'beef mince', tags: ['meat'] },
  { id: 'ae-lamb-leg', name: 'Boneless lamb leg', en: 'Boneless lamb leg', dept: 'meat', kcal: 200, protein: 20, carbs: 0, fat: 13, pricePerKg: 55, packSize: 800, packName: 'pack approx 800 g', packNameEn: 'pack approx 800 g', tags: ['meat'] },
  { id: 'ae-lamb-mince', name: 'Lamb mince', en: 'Lamb mince', dept: 'meat', kcal: 230, protein: 19, carbs: 0, fat: 17, pricePerKg: 45, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', tags: ['meat'] },
  // Sold from a separate licensed room rather than the main chiller here, so
  // both rows are tagged `meat` first and `pork` second — see the module note.
  { id: 'ae-pork-tenderloin', name: 'Pork tenderloin', en: 'Pork tenderloin', dept: 'meat', kcal: 112, protein: 21, carbs: 0, fat: 3, pricePerKg: 48, packSize: 500, packName: 'pack approx 500 g', packNameEn: 'pack approx 500 g', tags: ['meat', 'pork'] },
  { id: 'ae-bacon', name: 'Bacon', en: 'Bacon', dept: 'meat', kcal: 340, protein: 17, carbs: 1, fat: 30, pricePerKg: 60, packSize: 200, packName: 'pack 200 g', packNameEn: 'pack 200 g', tags: ['meat', 'pork'] },

  // ── Fish ────────────────────────────────────────────────────────────────
  { id: 'ae-salmon-fillet', name: 'Salmon fillet', en: 'Salmon fillet', dept: 'fish', kcal: 208, protein: 20, carbs: 0, fat: 13, pricePerKg: 65, packSize: 500, packName: 'pack approx 500 g', packNameEn: 'pack approx 500 g', tags: ['fish'] },
  { id: 'ae-hammour-fillet', name: 'Hammour fillet', en: 'Hammour fillet', dept: 'fish', kcal: 92, protein: 19, carbs: 0, fat: 1, pricePerKg: 55, packSize: 500, packName: 'pack approx 500 g', packNameEn: 'pack approx 500 g', tags: ['fish'] },
  { id: 'ae-cod-fillet', name: 'Cod fillet', en: 'Cod fillet', dept: 'fish', kcal: 82, protein: 18, carbs: 0, fat: 0.7, pricePerKg: 48, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['fish'] },
  { id: 'ae-shrimp', name: 'Peeled shrimp', en: 'Peeled shrimp', dept: 'fish', kcal: 99, protein: 20, carbs: 0, fat: 1, pricePerKg: 52, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['fish'] },

  // ── Dairy & Eggs ────────────────────────────────────────────────────────
  { id: 'ae-eggs', name: 'Eggs', en: 'Eggs', dept: 'dairy', kcal: 143, protein: 12.6, carbs: 0.3, fat: 9.5, pricePerKg: 14, packSize: 900, packName: 'tray of 15', packNameEn: 'tray of 15', unitWeight: 60, tags: ['egg'] },
  { id: 'ae-egg-whites', name: 'Liquid egg whites', en: 'Liquid egg whites', dept: 'dairy', kcal: 48, protein: 11, carbs: 0.7, fat: 0, pricePerKg: 24, packSize: 500, packName: 'carton 500 g', packNameEn: 'carton 500 g', tags: ['egg'] },
  { id: 'ae-labneh', name: 'Labneh', en: 'Labneh', dept: 'dairy', kcal: 150, protein: 6, carbs: 4, fat: 12, pricePerKg: 22, packSize: 500, packName: 'tub 500 g', packNameEn: 'tub 500 g', tags: ['dairy', 'lactose'] },
  { id: 'ae-cottage-cheese', name: 'Cottage cheese', en: 'Cottage cheese', dept: 'dairy', kcal: 79, protein: 12, carbs: 2.5, fat: 2, pricePerKg: 26, packSize: 400, packName: 'tub 400 g', packNameEn: 'tub 400 g', tags: ['dairy', 'lactose'] },
  { id: 'ae-greek-yoghurt', name: 'Greek yoghurt 2%', en: 'Greek yoghurt 2%', dept: 'dairy', kcal: 73, protein: 9, carbs: 4, fat: 2, pricePerKg: 18, packSize: 1000, packName: 'tub 1 kg', packNameEn: 'tub 1 kg', storeQuery: 'greek yoghurt', tags: ['dairy', 'lactose'] },
  { id: 'ae-laban', name: 'Laban', en: 'Laban', dept: 'dairy', kcal: 45, protein: 3.4, carbs: 5, fat: 1.5, pricePerKg: 8, packSize: 1000, packName: 'bottle 1 l', packNameEn: 'bottle 1 l', tags: ['dairy', 'lactose'] },
  { id: 'ae-protein-milk', name: 'High-protein milk', en: 'High-protein milk', dept: 'dairy', kcal: 60, protein: 8, carbs: 5.5, fat: 0.5, pricePerKg: 13, packSize: 1000, packName: 'carton 1 l', packNameEn: 'carton 1 l', tags: ['dairy', 'lactose'] },
  { id: 'ae-milk', name: 'Milk 1.5%', en: 'Milk 1.5%', dept: 'dairy', kcal: 45, protein: 3.5, carbs: 5, fat: 1.5, pricePerKg: 7, packSize: 1000, packName: 'bottle 1 l', packNameEn: 'bottle 1 l', storeQuery: 'milk', tags: ['dairy', 'lactose'] },
  { id: 'ae-grated-cheese', name: 'Grated cheese', en: 'Grated cheese', dept: 'dairy', kcal: 265, protein: 30, carbs: 1, fat: 17, pricePerKg: 40, packSize: 200, packName: 'bag 200 g', packNameEn: 'bag 200 g', tags: ['dairy'] },
  { id: 'ae-feta', name: 'Feta', en: 'Feta', dept: 'dairy', kcal: 265, protein: 14, carbs: 1, fat: 22, pricePerKg: 34, packSize: 200, packName: 'pack 200 g', packNameEn: 'pack 200 g', tags: ['dairy'] },
  { id: 'ae-halloumi', name: 'Halloumi', en: 'Halloumi', dept: 'dairy', kcal: 320, protein: 22, carbs: 2, fat: 25, pricePerKg: 46, packSize: 250, packName: 'pack 250 g', packNameEn: 'pack 250 g', tags: ['dairy'] },
  { id: 'ae-parmesan', name: 'Parmesan, grated', en: 'Parmesan, grated', dept: 'dairy', kcal: 400, protein: 32, carbs: 0, fat: 30, pricePerKg: 85, packSize: 150, packName: 'pack 150 g', packNameEn: 'pack 150 g', tags: ['dairy'] },
  { id: 'ae-cream-cheese', name: 'Cream cheese spread', en: 'Cream cheese spread', dept: 'dairy', kcal: 230, protein: 8, carbs: 5, fat: 20, pricePerKg: 32, packSize: 240, packName: 'tub 240 g', packNameEn: 'tub 240 g', tags: ['dairy', 'lactose'] },
  { id: 'ae-butter', name: 'Butter', en: 'Butter', dept: 'dairy', kcal: 730, protein: 0.5, carbs: 0.5, fat: 81, pricePerKg: 38, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', staple: true, tags: ['dairy'] },
  { id: 'ae-tofu', name: 'Firm tofu', en: 'Firm tofu', dept: 'dairy', kcal: 130, protein: 14, carbs: 2, fat: 7, pricePerKg: 30, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['soy'] },

  // ── Bread & Bakery ──────────────────────────────────────────────────────
  { id: 'ae-flatbread', name: 'Arabic flatbread', en: 'Arabic flatbread', dept: 'bread', kcal: 275, protein: 9, carbs: 55, fat: 1.5, pricePerKg: 7, packSize: 350, packName: 'bag of 5', packNameEn: 'bag of 5', unitWeight: 70, tags: ['gluten'] },
  { id: 'ae-pita', name: 'Pita bread', en: 'Pita bread', dept: 'bread', kcal: 275, protein: 9, carbs: 54, fat: 1.2, pricePerKg: 9, packSize: 360, packName: 'bag of 6', packNameEn: 'bag of 6', unitWeight: 60, tags: ['gluten'] },
  { id: 'ae-wholegrain-bread', name: 'Wholegrain bread', en: 'Wholegrain bread', dept: 'bread', kcal: 240, protein: 9, carbs: 38, fat: 3.5, pricePerKg: 14, packSize: 600, packName: 'loaf 600 g', packNameEn: 'loaf 600 g', unitWeight: 35, tags: ['gluten'] },
  { id: 'ae-crispbread', name: 'Crispbread', en: 'Crispbread', dept: 'bread', kcal: 350, protein: 10, carbs: 60, fat: 3, pricePerKg: 24, packSize: 250, packName: 'pack 250 g', packNameEn: 'pack 250 g', unitWeight: 12, tags: ['gluten'] },
  { id: 'ae-tortilla', name: 'Wholegrain tortilla', en: 'Wholegrain tortilla', dept: 'bread', kcal: 290, protein: 9, carbs: 46, fat: 6, pricePerKg: 22, packSize: 320, packName: 'pack of 8', packNameEn: 'pack of 8', unitWeight: 40, tags: ['gluten'] },

  // ── Pantry ──────────────────────────────────────────────────────────────
  { id: 'ae-canned-tuna', name: 'Tuna in water', en: 'Tuna in water', dept: 'pantry', kcal: 100, protein: 23, carbs: 0, fat: 1, pricePerKg: 30, packSize: 140, packName: 'tin 185 g (140 g drained)', packNameEn: 'tin 185 g (140 g drained)', storeQuery: 'tuna', tags: ['fish'] },
  { id: 'ae-oats', name: 'Rolled oats', en: 'Rolled oats', dept: 'pantry', kcal: 370, protein: 13, carbs: 58, fat: 7, pricePerKg: 10, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', tags: ['gluten'] },
  { id: 'ae-basmati-rice', name: 'Basmati rice', en: 'Basmati rice', dept: 'pantry', kcal: 350, protein: 7, carbs: 78, fat: 0.6, pricePerKg: 9, packSize: 5000, packName: 'bag 5 kg', packNameEn: 'bag 5 kg', tags: [] },
  { id: 'ae-brown-rice', name: 'Brown rice', en: 'Brown rice', dept: 'pantry', kcal: 350, protein: 8, carbs: 72, fat: 2.7, pricePerKg: 13, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'ae-bulgur', name: 'Bulgur wheat', en: 'Bulgur wheat', dept: 'pantry', kcal: 342, protein: 12, carbs: 63, fat: 1.3, pricePerKg: 9, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', tags: ['gluten'] },
  { id: 'ae-freekeh', name: 'Freekeh', en: 'Freekeh', dept: 'pantry', kcal: 350, protein: 13, carbs: 65, fat: 2.5, pricePerKg: 16, packSize: 900, packName: 'bag 900 g', packNameEn: 'bag 900 g', tags: ['gluten'] },
  { id: 'ae-couscous', name: 'Couscous', en: 'Couscous', dept: 'pantry', kcal: 360, protein: 12, carbs: 72, fat: 1.5, pricePerKg: 14, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', tags: ['gluten'] },
  { id: 'ae-pasta', name: 'Wholegrain pasta', en: 'Wholegrain pasta', dept: 'pantry', kcal: 350, protein: 13, carbs: 62, fat: 2.5, pricePerKg: 13, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', tags: ['gluten'] },
  { id: 'ae-red-lentils', name: 'Red lentils', en: 'Red lentils', dept: 'pantry', kcal: 350, protein: 24, carbs: 50, fat: 1.5, pricePerKg: 11, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'ae-dried-chickpeas', name: 'Dried chickpeas', en: 'Dried chickpeas', dept: 'pantry', kcal: 360, protein: 19, carbs: 55, fat: 6, pricePerKg: 9, packSize: 1000, packName: 'bag 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'ae-chickpeas-tinned', name: 'Chickpeas, tinned', en: 'Chickpeas, tinned', dept: 'pantry', kcal: 120, protein: 7, carbs: 15, fat: 2.6, pricePerKg: 8, packSize: 400, packName: 'tin 400 g (240 g drained)', packNameEn: 'tin 400 g (240 g drained)', storeQuery: 'chickpeas', tags: [] },
  { id: 'ae-fava-beans', name: 'Fava beans, tinned', en: 'Fava beans, tinned', dept: 'pantry', kcal: 110, protein: 7, carbs: 14, fat: 0.6, pricePerKg: 7, packSize: 400, packName: 'tin 400 g', packNameEn: 'tin 400 g', tags: [] },
  { id: 'ae-hummus', name: 'Hummus', en: 'Hummus', dept: 'pantry', kcal: 170, protein: 7, carbs: 12, fat: 10, pricePerKg: 24, packSize: 250, packName: 'tub 250 g', packNameEn: 'tub 250 g', tags: [] },
  { id: 'ae-tahini', name: 'Tahini', en: 'Tahini', dept: 'pantry', kcal: 595, protein: 17, carbs: 10, fat: 54, pricePerKg: 22, packSize: 400, packName: 'jar 400 g', packNameEn: 'jar 400 g', staple: true, tags: [] },
  { id: 'ae-crushed-tomatoes', name: 'Crushed tomatoes', en: 'Crushed tomatoes', dept: 'pantry', kcal: 32, protein: 1.3, carbs: 5, fat: 0.3, pricePerKg: 8, packSize: 400, packName: 'tin 400 g', packNameEn: 'tin 400 g', tags: [] },
  { id: 'ae-tomato-puree', name: 'Tomato purée', en: 'Tomato purée', dept: 'pantry', kcal: 80, protein: 4, carbs: 12, fat: 0.5, pricePerKg: 18, packSize: 200, packName: 'tin 200 g', packNameEn: 'tin 200 g', staple: true, tags: [] },
  { id: 'ae-pomegranate-molasses', name: 'Pomegranate molasses', en: 'Pomegranate molasses', dept: 'pantry', kcal: 290, protein: 0.5, carbs: 70, fat: 0.2, pricePerKg: 28, packSize: 500, packName: 'bottle 500 ml', packNameEn: 'bottle 500 ml', staple: true, tags: [] },
  { id: 'ae-olive-oil', name: 'Olive oil', en: 'Olive oil', dept: 'pantry', kcal: 884, protein: 0, carbs: 0, fat: 100, pricePerKg: 35, packSize: 1000, packName: 'bottle 1 l', packNameEn: 'bottle 1 l', staple: true, tags: [] },
  { id: 'ae-sunflower-oil', name: 'Sunflower oil', en: 'Sunflower oil', dept: 'pantry', kcal: 900, protein: 0, carbs: 0, fat: 100, pricePerKg: 10, packSize: 1800, packName: 'bottle 1.8 l', packNameEn: 'bottle 1.8 l', staple: true, tags: [] },
  { id: 'ae-cider-vinegar', name: 'Apple cider vinegar', en: 'Apple cider vinegar', dept: 'pantry', kcal: 22, protein: 0.1, carbs: 0.9, fat: 0.1, pricePerKg: 14, packSize: 500, packName: 'bottle 500 ml', packNameEn: 'bottle 500 ml', staple: true, tags: [] },
  { id: 'ae-peanut-butter', name: 'Peanut butter', en: 'Peanut butter', dept: 'pantry', kcal: 600, protein: 25, carbs: 12, fat: 50, pricePerKg: 26, packSize: 500, packName: 'jar 500 g', packNameEn: 'jar 500 g', tags: ['nuts'] },
  { id: 'ae-almonds', name: 'Almonds', en: 'Almonds', dept: 'pantry', kcal: 600, protein: 21, carbs: 6, fat: 52, pricePerKg: 48, packSize: 500, packName: 'bag 500 g', packNameEn: 'bag 500 g', tags: ['nuts'] },
  { id: 'ae-walnuts', name: 'Walnuts', en: 'Walnuts', dept: 'pantry', kcal: 690, protein: 15, carbs: 7, fat: 65, pricePerKg: 55, packSize: 400, packName: 'bag 400 g', packNameEn: 'bag 400 g', tags: ['nuts'] },
  { id: 'ae-chia-seeds', name: 'Chia seeds', en: 'Chia seeds', dept: 'pantry', kcal: 480, protein: 17, carbs: 8, fat: 31, pricePerKg: 40, packSize: 250, packName: 'bag 250 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'ae-whey-protein', name: 'Whey protein powder', en: 'Whey protein powder', dept: 'pantry', kcal: 380, protein: 80, carbs: 6, fat: 5, pricePerKg: 130, packSize: 900, packName: 'tub 900 g', packNameEn: 'tub 900 g', tags: ['dairy'] },
  { id: 'ae-dates', name: 'Dates', en: 'Dates', dept: 'pantry', kcal: 282, protein: 2.5, carbs: 68, fat: 0.4, pricePerKg: 25, packSize: 500, packName: 'box 500 g', packNameEn: 'box 500 g', unitWeight: 8, tags: [] },
  { id: 'ae-honey', name: 'Honey', en: 'Honey', dept: 'pantry', kcal: 320, protein: 0.2, carbs: 82, fat: 0, pricePerKg: 45, packSize: 500, packName: 'jar 500 g', packNameEn: 'jar 500 g', staple: true, tags: [] },
  { id: 'ae-cumin', name: 'Ground cumin', en: 'Ground cumin', dept: 'pantry', kcal: 375, protein: 18, carbs: 44, fat: 22, pricePerKg: 32, packSize: 100, packName: 'pack 100 g', packNameEn: 'pack 100 g', staple: true, tags: [] },
  { id: 'ae-zaatar', name: "Za'atar", en: "Za'atar", dept: 'pantry', kcal: 320, protein: 10, carbs: 40, fat: 12, pricePerKg: 35, packSize: 250, packName: 'pack 250 g', packNameEn: 'pack 250 g', staple: true, tags: [] },
  { id: 'ae-sumac', name: 'Sumac', en: 'Sumac', dept: 'pantry', kcal: 300, protein: 5, carbs: 60, fat: 8, pricePerKg: 40, packSize: 200, packName: 'pack 200 g', packNameEn: 'pack 200 g', staple: true, tags: [] },
  { id: 'ae-baharat', name: 'Baharat', en: 'Baharat', dept: 'pantry', kcal: 330, protein: 12, carbs: 45, fat: 12, pricePerKg: 42, packSize: 100, packName: 'pack 100 g', packNameEn: 'pack 100 g', staple: true, tags: [] },
  { id: 'ae-harissa', name: 'Harissa paste', en: 'Harissa paste', dept: 'pantry', kcal: 120, protein: 3, carbs: 12, fat: 6, pricePerKg: 30, packSize: 200, packName: 'jar 200 g', packNameEn: 'jar 200 g', staple: true, tags: [] },
  { id: 'ae-spices', name: 'Spices (pepper, paprika, cinnamon, turmeric)', en: 'Spices (pepper, paprika, cinnamon, turmeric)', dept: 'pantry', kcal: 300, protein: 10, carbs: 50, fat: 5, pricePerKg: 55, packSize: 100, packName: 'packs', packNameEn: 'packs', staple: true, storeQuery: 'spices', tags: [] },
  { id: 'ae-soy-sauce', name: 'Soy sauce', en: 'Soy sauce', dept: 'pantry', kcal: 60, protein: 6, carbs: 6, fat: 0, pricePerKg: 22, packSize: 250, packName: 'bottle 250 ml', packNameEn: 'bottle 250 ml', staple: true, tags: ['soy', 'gluten'] },
  { id: 'ae-stock-cubes', name: 'Stock cubes', en: 'Stock cubes', dept: 'pantry', kcal: 200, protein: 10, carbs: 20, fat: 10, pricePerKg: 40, packSize: 80, packName: 'pack of 8', packNameEn: 'pack of 8', staple: true, tags: [] },

  // ── Frozen ──────────────────────────────────────────────────────────────
  { id: 'ae-frozen-blueberries', name: 'Frozen blueberries', en: 'Frozen blueberries', dept: 'frozen', kcal: 45, protein: 0.7, carbs: 8, fat: 0.4, pricePerKg: 40, packSize: 500, packName: 'bag 500 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'ae-frozen-peas', name: 'Frozen peas', en: 'Frozen peas', dept: 'frozen', kcal: 80, protein: 5, carbs: 10, fat: 0.5, pricePerKg: 12, packSize: 900, packName: 'bag 900 g', packNameEn: 'bag 900 g', tags: [] },
  { id: 'ae-frozen-spinach', name: 'Frozen spinach', en: 'Frozen spinach', dept: 'frozen', kcal: 25, protein: 3, carbs: 1, fat: 0.4, pricePerKg: 11, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: [] },
  { id: 'ae-frozen-mixed-veg', name: 'Frozen mixed vegetables', en: 'Frozen mixed vegetables', dept: 'frozen', kcal: 40, protein: 2, carbs: 5, fat: 0.5, pricePerKg: 13, packSize: 900, packName: 'bag 900 g', packNameEn: 'bag 900 g', tags: [] },
  { id: 'ae-soy-mince', name: 'Soy mince, frozen', en: 'Soy mince, frozen', dept: 'frozen', kcal: 105, protein: 15, carbs: 5, fat: 2, pricePerKg: 32, packSize: 400, packName: 'bag 400 g', packNameEn: 'bag 400 g', tags: ['soy'] },
];
