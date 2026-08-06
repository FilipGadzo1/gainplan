import type { Ingredient } from '../../types';

/**
 * The Croatian catalogue. Macros are per 100 g (per 100 ml for liquids) and are
 * carried over from the Swedish rows for the same product — chicken breast is
 * chicken breast, and retyping eighty-eight nutrition panels would only invent
 * transcription errors.
 *
 * Prices are approximate EUR/kg shelf prices and exist to give the plan a
 * realistic weekly cost. They are hand-estimated, exactly as the Swedish ones
 * are, and will drift. Croatia publishes real daily price lists under decision
 * NN 75/2025, so these are the numbers a price-snapshot pipeline is meant to
 * replace — until then, treat the total as a planning figure and not a receipt.
 *
 * Ids carry an `hr-` prefix. The ingredient and recipe registries are shared
 * across regions rather than split per region, which is only sound while ids do
 * not collide; the prefix makes that true by construction rather than by
 * vigilance. See the uniqueness tests in src/regions/regions.test.ts.
 */
export const HR_INGREDIENTS: Ingredient[] = [

  // ── Voće i povrće ───────────────────────────────────────────────────────
  { id: 'hr-banana', name: 'Banana', en: 'Banana', dept: 'produce', kcal: 89, protein: 1.1, carbs: 21, fat: 0.3, pricePerKg: 1.35, packSize: 1000, packName: 'rinfuza', packNameEn: 'loose', unitWeight: 120, tags: [] },
  { id: 'hr-jabuka', name: 'Jabuka', en: 'Apple', dept: 'produce', kcal: 52, protein: 0.3, carbs: 12, fat: 0.2, pricePerKg: 1.5, packSize: 1000, packName: 'rinfuza', packNameEn: 'loose', unitWeight: 150, tags: [] },
  { id: 'hr-brokula', name: 'Brokula', en: 'Broccoli', dept: 'produce', kcal: 34, protein: 2.8, carbs: 4, fat: 0.4, pricePerKg: 3.2, packSize: 500, packName: 'cca 500 g', packNameEn: 'approx 500 g', tags: [] },
  { id: 'hr-cvjetaca', name: 'Cvjetača', en: 'Cauliflower', dept: 'produce', kcal: 25, protein: 1.9, carbs: 3, fat: 0.3, pricePerKg: 2.6, packSize: 600, packName: '1 glavica cca 600 g', packNameEn: '1 head approx 600 g', tags: [] },
  { id: 'hr-paprika', name: 'Paprika', en: 'Bell pepper', dept: 'produce', kcal: 31, protein: 1, carbs: 6, fat: 0.3, pricePerKg: 3.2, packSize: 400, packName: 'pak. 3 kom', packNameEn: 'bag of 3', unitWeight: 150, tags: [] },
  { id: 'hr-luk', name: 'Crveni luk', en: 'Yellow onion', dept: 'produce', kcal: 40, protein: 1.1, carbs: 8, fat: 0.1, pricePerKg: 1.2, packSize: 1000, packName: 'vreća 1 kg', packNameEn: 'bag 1 kg', unitWeight: 110, staple: true, tags: [] },
  { id: 'hr-ljubicasti-luk', name: 'Ljubičasti luk', en: 'Red onion', dept: 'produce', kcal: 40, protein: 1.1, carbs: 8, fat: 0.1, pricePerKg: 1.9, packSize: 500, packName: 'vreća 500 g', packNameEn: 'bag 500 g', unitWeight: 100, tags: [] },
  { id: 'hr-cesnjak', name: 'Češnjak', en: 'Garlic', dept: 'produce', kcal: 149, protein: 6, carbs: 30, fat: 0.5, pricePerKg: 7, packSize: 100, packName: '2 glavice', packNameEn: '2 pcs', unitWeight: 5, staple: true, tags: [] },
  { id: 'hr-mrkva', name: 'Mrkva', en: 'Carrots', dept: 'produce', kcal: 41, protein: 0.9, carbs: 8, fat: 0.2, pricePerKg: 1.3, packSize: 1000, packName: 'vreća 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'hr-krumpir', name: 'Krumpir', en: 'Potatoes', dept: 'produce', kcal: 77, protein: 2, carbs: 16, fat: 0.1, pricePerKg: 1.1, packSize: 2000, packName: 'vreća 2 kg', packNameEn: 'bag 2 kg', tags: [] },
  { id: 'hr-batat', name: 'Batat', en: 'Sweet potato', dept: 'produce', kcal: 86, protein: 1.6, carbs: 18, fat: 0.1, pricePerKg: 2.8, packSize: 1000, packName: 'rinfuza', packNameEn: 'loose', tags: [] },
  { id: 'hr-rajcica', name: 'Rajčica', en: 'Tomato', dept: 'produce', kcal: 18, protein: 0.9, carbs: 3, fat: 0.2, pricePerKg: 2.6, packSize: 500, packName: 'cca 500 g', packNameEn: 'approx 500 g', unitWeight: 110, tags: [] },
  { id: 'hr-cherry-rajcica', name: 'Cherry rajčice', en: 'Cherry tomatoes', dept: 'produce', kcal: 30, protein: 0.9, carbs: 4, fat: 0.3, pricePerKg: 5.5, packSize: 250, packName: 'pak. 250 g', packNameEn: 'punnet 250 g', tags: [] },
  { id: 'hr-krastavac', name: 'Krastavac', en: 'Cucumber', dept: 'produce', kcal: 15, protein: 0.7, carbs: 2, fat: 0.1, pricePerKg: 1.9, packSize: 400, packName: '1 kom', packNameEn: '1 pc', tags: [] },
  { id: 'hr-spinat', name: 'Mladi špinat', en: 'Baby spinach', dept: 'produce', kcal: 23, protein: 2.9, carbs: 1, fat: 0.4, pricePerKg: 8, packSize: 200, packName: 'pak. 200 g', packNameEn: 'bag 200 g', tags: [] },
  { id: 'hr-mijesana-salata', name: 'Miješana salata', en: 'Mixed salad', dept: 'produce', kcal: 20, protein: 1.5, carbs: 2, fat: 0.3, pricePerKg: 8.5, packSize: 150, packName: 'pak. 150 g', packNameEn: 'bag 175 g', tags: [] },
  { id: 'hr-avokado', name: 'Avokado', en: 'Avocado', dept: 'produce', kcal: 160, protein: 2, carbs: 2, fat: 15, pricePerKg: 5.5, packSize: 400, packName: 'pak. 2 kom', packNameEn: 'bag of 2', unitWeight: 200, tags: [] },
  { id: 'hr-limun', name: 'Limun', en: 'Lemon', dept: 'produce', kcal: 29, protein: 1.1, carbs: 3, fat: 0.3, pricePerKg: 2.2, packSize: 500, packName: 'mreža 500 g', packNameEn: 'net of 4', unitWeight: 100, staple: true, tags: [] },
  { id: 'hr-sampinjoni', name: 'Šampinjoni', en: 'Mushrooms', dept: 'produce', kcal: 22, protein: 3.1, carbs: 0.3, fat: 0.3, pricePerKg: 4.2, packSize: 250, packName: 'pak. 250 g', packNameEn: 'punnet 250 g', tags: [] },
  { id: 'hr-tikvica', name: 'Tikvica', en: 'Courgette', dept: 'produce', kcal: 17, protein: 1.2, carbs: 2, fat: 0.3, pricePerKg: 2.2, packSize: 400, packName: '1 kom', packNameEn: '1 pc', tags: [] },
  { id: 'hr-dumbir', name: 'Đumbir', en: 'Ginger', dept: 'produce', kcal: 80, protein: 1.8, carbs: 15, fat: 0.8, pricePerKg: 6.5, packSize: 100, packName: 'rinfuza', packNameEn: 'loose', staple: true, tags: [] },
  { id: 'hr-zacinsko-bilje', name: 'Svježe začinsko bilje', en: 'Fresh herbs', dept: 'produce', kcal: 40, protein: 3, carbs: 2, fat: 0.5, pricePerKg: 18, packSize: 25, packName: 'lončić/vrećica', packNameEn: 'pot/bag', tags: [] },

  // ── Meso i mesne prerađevine ────────────────────────────────────────────
  { id: 'hr-pileca-prsa', name: 'Pileća prsa', en: 'Chicken breast', dept: 'meat', kcal: 106, protein: 22.5, carbs: 0, fat: 1.7, pricePerKg: 7.5, packSize: 700, packName: 'pak. cca 700 g', packNameEn: 'pack approx 700 g', tags: ['meat'] },
  { id: 'hr-pileci-zabaci', name: 'Pileći zabaci bez kosti', en: 'Chicken thigh fillet', dept: 'meat', kcal: 150, protein: 19, carbs: 0, fat: 8, pricePerKg: 5.9, packSize: 800, packName: 'pak. cca 800 g', packNameEn: 'pack approx 800 g', tags: ['meat'] },
  { id: 'hr-pureca-prsa', name: 'Pureća prsa', en: 'Turkey breast', dept: 'meat', kcal: 105, protein: 23, carbs: 0.5, fat: 1, pricePerKg: 11.5, packSize: 400, packName: 'pak. 400 g', packNameEn: 'pack 400 g', tags: ['meat'] },
  { id: 'hr-junece-mljeveno', name: 'Juneće mljeveno meso', en: 'Lean beef mince 5%', dept: 'meat', kcal: 130, protein: 21, carbs: 0, fat: 5, pricePerKg: 10.5, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 500 g', tags: ['meat'] },
  { id: 'hr-mjesano-mljeveno', name: 'Miješano mljeveno meso', en: 'Beef mince 10%', dept: 'meat', kcal: 176, protein: 19, carbs: 0, fat: 11, pricePerKg: 7.9, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 500 g', tags: ['meat'] },
  { id: 'hr-svinjski-file', name: 'Svinjski file', en: 'Pork tenderloin', dept: 'meat', kcal: 112, protein: 21, carbs: 0, fat: 3, pricePerKg: 8.9, packSize: 500, packName: 'pak. cca 500 g', packNameEn: 'pack approx 500 g', tags: ['meat', 'pork'] },
  { id: 'hr-slanina', name: 'Slanina', en: 'Bacon', dept: 'meat', kcal: 340, protein: 17, carbs: 1, fat: 30, pricePerKg: 11, packSize: 150, packName: 'pak. 150 g', packNameEn: 'pack 140 g', tags: ['meat', 'pork'] },
  { id: 'hr-sunka', name: 'Pileća šunka', en: 'Sliced ham', dept: 'meat', kcal: 110, protein: 18, carbs: 1, fat: 4, pricePerKg: 9.5, packSize: 150, packName: 'pak. 150 g', packNameEn: 'pack 130 g', tags: ['meat', 'pork'] },

  // ── Riba ────────────────────────────────────────────────────────────────
  { id: 'hr-losos', name: 'File lososa', en: 'Salmon fillet', dept: 'fish', kcal: 208, protein: 20, carbs: 0, fat: 13, pricePerKg: 19, packSize: 500, packName: 'pak. cca 500 g', packNameEn: 'pack approx 500 g', tags: ['fish'] },
  { id: 'hr-oslic', name: 'File oslića', en: 'Cod fillet', dept: 'fish', kcal: 82, protein: 18, carbs: 0, fat: 0.7, pricePerKg: 9.5, packSize: 400, packName: 'pak. 400 g', packNameEn: 'pack 400 g', tags: ['fish'] },
  { id: 'hr-kozice', name: 'Očišćene kozice', en: 'Peeled shrimp', dept: 'fish', kcal: 99, protein: 20, carbs: 0, fat: 1, pricePerKg: 16, packSize: 400, packName: 'pak. 400 g', packNameEn: 'pack 400 g', tags: ['fish'] },

  // ── Mliječni proizvodi i jaja ───────────────────────────────────────────
  { id: 'hr-jaja', name: 'Jaja', en: 'Eggs', dept: 'dairy', kcal: 143, protein: 12.6, carbs: 0.3, fat: 9.5, pricePerKg: 4.2, packSize: 600, packName: 'pak. 10 kom', packNameEn: 'carton of 12', unitWeight: 60, tags: ['egg'] },
  { id: 'hr-bjelanjci', name: 'Tekući bjelanjci', en: 'Liquid egg whites', dept: 'dairy', kcal: 48, protein: 11, carbs: 0.7, fat: 0, pricePerKg: 7.5, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 500 g', tags: ['egg'] },
  { id: 'hr-svjezi-sir', name: 'Svježi sir posni', en: 'Quark, plain', dept: 'dairy', kcal: 62, protein: 11, carbs: 4, fat: 0.2, pricePerKg: 4.6, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 500 g', tags: ['dairy', 'lactose'] },
  { id: 'hr-zrnati-sir', name: 'Zrnati sir', en: 'Cottage cheese', dept: 'dairy', kcal: 79, protein: 12, carbs: 2.5, fat: 2, pricePerKg: 5.5, packSize: 400, packName: 'pak. 400 g', packNameEn: 'pack 500 g', tags: ['dairy', 'lactose'] },
  { id: 'hr-grcki-jogurt', name: 'Grčki jogurt 2%', en: 'Greek yoghurt 2%', dept: 'dairy', kcal: 73, protein: 9, carbs: 4, fat: 2, pricePerKg: 4.4, packSize: 900, packName: 'pak. 900 g', packNameEn: 'tub 1 kg', tags: ['dairy', 'lactose'] },
  { id: 'hr-protein-mlijeko', name: 'Protein mlijeko', en: 'High-protein milk', dept: 'dairy', kcal: 60, protein: 8, carbs: 5.5, fat: 0.5, pricePerKg: 2.8, packSize: 1000, packName: 'pak. 1 l', packNameEn: 'carton 1 l', tags: ['dairy', 'lactose'] },
  { id: 'hr-mlijeko', name: 'Mlijeko 1,5%', en: 'Milk 1.5%', dept: 'dairy', kcal: 45, protein: 3.5, carbs: 5, fat: 1.5, pricePerKg: 1.15, packSize: 1000, packName: 'pak. 1 l', packNameEn: 'carton 1 l', tags: ['dairy', 'lactose'] },
  { id: 'hr-ribani-sir', name: 'Ribani sir', en: 'Grated cheese', dept: 'dairy', kcal: 265, protein: 30, carbs: 1, fat: 17, pricePerKg: 9.9, packSize: 200, packName: 'pak. 200 g', packNameEn: 'bag 250 g', tags: ['dairy'] },
  { id: 'hr-feta', name: 'Feta sir', en: 'Feta', dept: 'dairy', kcal: 265, protein: 14, carbs: 1, fat: 22, pricePerKg: 9.5, packSize: 200, packName: 'pak. 200 g', packNameEn: 'pack 200 g', tags: ['dairy'] },
  { id: 'hr-parmezan', name: 'Parmezan, ribani', en: 'Parmesan', dept: 'dairy', kcal: 400, protein: 32, carbs: 0, fat: 30, pricePerKg: 24, packSize: 100, packName: 'pak. 100 g', packNameEn: 'pack 150 g', tags: ['dairy'] },
  { id: 'hr-halloumi', name: 'Halloumi', en: 'Halloumi', dept: 'dairy', kcal: 320, protein: 22, carbs: 2, fat: 25, pricePerKg: 16, packSize: 225, packName: 'pak. 225 g', packNameEn: 'pack 250 g', tags: ['dairy'] },
  { id: 'hr-vrhnje', name: 'Kiselo vrhnje lagano', en: 'Light crème fraîche', dept: 'dairy', kcal: 130, protein: 3, carbs: 4, fat: 11, pricePerKg: 4.5, packSize: 200, packName: 'pak. 200 g', packNameEn: 'tub 200 ml', tags: ['dairy', 'lactose'] },
  { id: 'hr-maslac', name: 'Maslac', en: 'Butter', dept: 'dairy', kcal: 730, protein: 0.5, carbs: 0.5, fat: 81, pricePerKg: 12, packSize: 250, packName: 'pak. 250 g', packNameEn: 'pack 500 g', staple: true, tags: ['dairy'] },
  { id: 'hr-tofu', name: 'Tofu natur', en: 'Firm tofu', dept: 'dairy', kcal: 130, protein: 14, carbs: 2, fat: 7, pricePerKg: 9, packSize: 400, packName: 'pak. 400 g', packNameEn: 'pack 400 g', tags: ['soy'] },

  // ── Kruh i pekara ───────────────────────────────────────────────────────
  { id: 'hr-integralni-kruh', name: 'Integralni kruh', en: 'Wholegrain bread', dept: 'bread', kcal: 240, protein: 9, carbs: 38, fat: 3.5, pricePerKg: 3.2, packSize: 500, packName: 'štruca 500 g', packNameEn: 'loaf 500 g', unitWeight: 35, tags: ['gluten'] },
  { id: 'hr-prepecenac', name: 'Integralni prepečenac', en: 'Crispbread', dept: 'bread', kcal: 350, protein: 10, carbs: 60, fat: 3, pricePerKg: 5, packSize: 250, packName: 'pak. 250 g', packNameEn: 'pack 250 g', unitWeight: 12, tags: ['gluten'] },
  { id: 'hr-tortilja', name: 'Integralne tortilje', en: 'Wholegrain tortilla', dept: 'bread', kcal: 290, protein: 9, carbs: 46, fat: 6, pricePerKg: 6, packSize: 320, packName: 'pak. 320 g', packNameEn: 'pack of 8', unitWeight: 40, tags: ['gluten'] },

  // ── Smrznuto ────────────────────────────────────────────────────────────
  { id: 'hr-borovnice', name: 'Smrznute borovnice', en: 'Frozen blueberries', dept: 'frozen', kcal: 45, protein: 0.7, carbs: 8, fat: 0.4, pricePerKg: 7, packSize: 450, packName: 'vreća 450 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'hr-maline', name: 'Smrznute maline', en: 'Frozen raspberries', dept: 'frozen', kcal: 52, protein: 1.2, carbs: 5, fat: 0.7, pricePerKg: 7.5, packSize: 450, packName: 'vreća 450 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'hr-grasak', name: 'Smrznuti grašak', en: 'Frozen peas', dept: 'frozen', kcal: 80, protein: 5, carbs: 10, fat: 0.5, pricePerKg: 2.2, packSize: 450, packName: 'vreća 450 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'hr-smrznuti-spinat', name: 'Smrznuti špinat', en: 'Frozen spinach', dept: 'frozen', kcal: 25, protein: 3, carbs: 1, fat: 0.4, pricePerKg: 2.5, packSize: 450, packName: 'vreća 450 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'hr-wok-povrce', name: 'Smrznuto wok povrće', en: 'Frozen stir-fry vegetables', dept: 'frozen', kcal: 40, protein: 2, carbs: 5, fat: 0.5, pricePerKg: 3.2, packSize: 450, packName: 'vreća 450 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'hr-sojino-mljeveno', name: 'Sojino mljeveno, smrznuto', en: 'Soy mince, frozen', dept: 'frozen', kcal: 105, protein: 15, carbs: 5, fat: 2, pricePerKg: 8, packSize: 400, packName: 'vreća 400 g', packNameEn: 'bag 400 g', tags: ['soy'] },

  // ── Trajni proizvodi ────────────────────────────────────────────────────
  { id: 'hr-tuna', name: 'Tuna u vodi', en: 'Canned tuna in water', dept: 'pantry', kcal: 100, protein: 23, carbs: 0, fat: 1, pricePerKg: 11, packSize: 140, packName: 'konz. 185 g (140 g ocijeđeno)', packNameEn: 'tin 185 g (140 g drained)', tags: ['fish'] },
  { id: 'hr-skusa', name: 'Skuša u umaku od rajčice', en: 'Mackerel in tomato sauce', dept: 'pantry', kcal: 190, protein: 15, carbs: 4, fat: 12, pricePerKg: 6.5, packSize: 375, packName: 'konz. 375 g', packNameEn: 'tin 375 g', tags: ['fish'] },
  { id: 'hr-zobene-pahuljice', name: 'Zobene pahuljice', en: 'Rolled oats', dept: 'pantry', kcal: 370, protein: 13, carbs: 58, fat: 7, pricePerKg: 2.2, packSize: 1000, packName: 'pak. 1 kg', packNameEn: 'bag 1.5 kg', tags: ['gluten'] },
  { id: 'hr-riza', name: 'Riža dugo zrno', en: 'Jasmine rice', dept: 'pantry', kcal: 350, protein: 7, carbs: 78, fat: 0.6, pricePerKg: 2.2, packSize: 1000, packName: 'pak. 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'hr-smeda-riza', name: 'Smeđa riža', en: 'Brown rice', dept: 'pantry', kcal: 350, protein: 8, carbs: 72, fat: 2.7, pricePerKg: 3.2, packSize: 1000, packName: 'pak. 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'hr-integralna-tjestenina', name: 'Integralna tjestenina', en: 'Wholegrain pasta', dept: 'pantry', kcal: 350, protein: 13, carbs: 62, fat: 2.5, pricePerKg: 2.6, packSize: 500, packName: 'pak. 500 g', packNameEn: 'bag 1 kg', tags: ['gluten'] },
  { id: 'hr-kuskus', name: 'Kuskus', en: 'Couscous', dept: 'pantry', kcal: 360, protein: 12, carbs: 72, fat: 1.5, pricePerKg: 3, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 500 g', tags: ['gluten'] },
  { id: 'hr-kvinoja', name: 'Kvinoja', en: 'Quinoa', dept: 'pantry', kcal: 368, protein: 14, carbs: 57, fat: 6, pricePerKg: 7.5, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 500 g', tags: [] },
  { id: 'hr-crvena-leca', name: 'Crvena leća', en: 'Red lentils', dept: 'pantry', kcal: 350, protein: 24, carbs: 50, fat: 1.5, pricePerKg: 3.5, packSize: 500, packName: 'pak. 500 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'hr-slanutak', name: 'Slanutak, konzerva', en: 'Chickpeas, canned', dept: 'pantry', kcal: 120, protein: 7, carbs: 15, fat: 2.6, pricePerKg: 3, packSize: 400, packName: 'konz. 400 g', packNameEn: 'tin 380 g drained', tags: [] },
  { id: 'hr-crni-grah', name: 'Crni grah, konzerva', en: 'Black beans, canned', dept: 'pantry', kcal: 110, protein: 7, carbs: 14, fat: 0.6, pricePerKg: 3, packSize: 400, packName: 'konz. 400 g', packNameEn: 'tin 380 g drained', tags: [] },
  { id: 'hr-pelati', name: 'Pasirana rajčica', en: 'Crushed tomatoes', dept: 'pantry', kcal: 32, protein: 1.3, carbs: 5, fat: 0.3, pricePerKg: 2, packSize: 500, packName: 'pak. 500 g', packNameEn: 'pack 400 g', tags: [] },
  { id: 'hr-koncentrat-rajcice', name: 'Koncentrat rajčice', en: 'Tomato purée', dept: 'pantry', kcal: 80, protein: 4, carbs: 12, fat: 0.5, pricePerKg: 5, packSize: 200, packName: 'tuba 200 g', packNameEn: 'tube 200 g', staple: true, tags: [] },
  { id: 'hr-kokosovo-mlijeko', name: 'Kokosovo mlijeko', en: 'Coconut milk', dept: 'pantry', kcal: 180, protein: 2, carbs: 3, fat: 17, pricePerKg: 3.5, packSize: 400, packName: 'konz. 400 ml', packNameEn: 'tin 400 ml', tags: [] },
  { id: 'hr-maslinovo-ulje', name: 'Maslinovo ulje', en: 'Olive oil', dept: 'pantry', kcal: 884, protein: 0, carbs: 0, fat: 100, pricePerKg: 11, packSize: 500, packName: 'boca 500 ml', packNameEn: 'bottle 500 ml', staple: true, tags: [] },
  { id: 'hr-suncokretovo-ulje', name: 'Suncokretovo ulje', en: 'Rapeseed oil', dept: 'pantry', kcal: 900, protein: 0, carbs: 0, fat: 100, pricePerKg: 2.2, packSize: 1000, packName: 'boca 1 l', packNameEn: 'bottle 1 l', staple: true, tags: [] },
  { id: 'hr-maslac-od-kikirikija', name: 'Maslac od kikirikija', en: 'Peanut butter', dept: 'pantry', kcal: 600, protein: 25, carbs: 12, fat: 50, pricePerKg: 9, packSize: 350, packName: 'staklenka 350 g', packNameEn: 'tin 350 g', tags: ['nuts'] },
  { id: 'hr-bademi', name: 'Bademi', en: 'Almonds', dept: 'pantry', kcal: 600, protein: 21, carbs: 6, fat: 52, pricePerKg: 15, packSize: 200, packName: 'pak. 200 g', packNameEn: 'bag 300 g', tags: ['nuts'] },
  { id: 'hr-orasi', name: 'Orasi', en: 'Walnuts', dept: 'pantry', kcal: 690, protein: 15, carbs: 7, fat: 65, pricePerKg: 14, packSize: 200, packName: 'pak. 200 g', packNameEn: 'bag 200 g', tags: ['nuts'] },
  { id: 'hr-chia', name: 'Chia sjemenke', en: 'Chia seeds', dept: 'pantry', kcal: 480, protein: 17, carbs: 8, fat: 31, pricePerKg: 11, packSize: 200, packName: 'pak. 200 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'hr-protein-prah', name: 'Whey protein u prahu', en: 'Whey protein powder', dept: 'pantry', kcal: 380, protein: 80, carbs: 6, fat: 5, pricePerKg: 26, packSize: 1000, packName: 'pak. 1 kg', packNameEn: 'tin 1 kg', tags: ['dairy'] },
  { id: 'hr-musli', name: 'Musli bez dodanog šećera', en: 'No-added-sugar muesli', dept: 'pantry', kcal: 420, protein: 9, carbs: 60, fat: 14, pricePerKg: 5.5, packSize: 500, packName: 'pak. 500 g', packNameEn: 'bag 750 g', tags: ['gluten', 'nuts'] },
  { id: 'hr-rizini-krekeri', name: 'Rižini krekeri', en: 'Rice cakes', dept: 'pantry', kcal: 380, protein: 8, carbs: 80, fat: 3, pricePerKg: 7, packSize: 130, packName: 'pak. 130 g', packNameEn: 'pack 130 g', unitWeight: 9, tags: [] },
  { id: 'hr-grozdice', name: 'Grožđice', en: 'Raisins', dept: 'pantry', kcal: 300, protein: 3, carbs: 79, fat: 0.5, pricePerKg: 4.5, packSize: 200, packName: 'pak. 200 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'hr-med', name: 'Med', en: 'Honey', dept: 'pantry', kcal: 320, protein: 0, carbs: 82, fat: 0, pricePerKg: 11, packSize: 450, packName: 'staklenka 450 g', packNameEn: 'tin 350 g', staple: true, tags: [] },
  { id: 'hr-kakao', name: 'Kakao u prahu', en: 'Cocoa powder', dept: 'pantry', kcal: 355, protein: 22, carbs: 11, fat: 22, pricePerKg: 12, packSize: 100, packName: 'pak. 100 g', packNameEn: 'pack 200 g', staple: true, tags: [] },
  { id: 'hr-kukuruz', name: 'Kukuruz šećerac, konzerva', en: 'Sweetcorn, canned', dept: 'pantry', kcal: 90, protein: 3, carbs: 15, fat: 1, pricePerKg: 3.5, packSize: 340, packName: 'konz. 340 g', packNameEn: 'tin 340 g', tags: [] },
  { id: 'hr-soja-umak', name: 'Soja umak', en: 'Soy sauce', dept: 'pantry', kcal: 60, protein: 6, carbs: 6, fat: 0, pricePerKg: 12, packSize: 150, packName: 'boca 150 ml', packNameEn: 'bottle 200 ml', staple: true, tags: ['soy', 'gluten'] },
  { id: 'hr-sriracha', name: 'Sriracha umak', en: 'Sriracha', dept: 'pantry', kcal: 100, protein: 1, carbs: 20, fat: 0.5, pricePerKg: 11, packSize: 200, packName: 'boca 200 ml', packNameEn: 'bottle 200 ml', staple: true, tags: [] },
  { id: 'hr-senf', name: 'Dijon senf', en: 'Dijon mustard', dept: 'pantry', kcal: 150, protein: 6, carbs: 5, fat: 10, pricePerKg: 8, packSize: 200, packName: 'staklenka 200 g', packNameEn: 'tin 200 g', staple: true, tags: [] },
  { id: 'hr-temeljac', name: 'Kocke za temeljac', en: 'Stock cubes', dept: 'pantry', kcal: 200, protein: 10, carbs: 20, fat: 10, pricePerKg: 15, packSize: 60, packName: 'pak. 60 g', packNameEn: 'pack of 8', staple: true, tags: [] },
  { id: 'hr-zacini', name: 'Začini (sol, papar, paprika, kim)', en: 'Spices', dept: 'pantry', kcal: 300, protein: 10, carbs: 50, fat: 5, pricePerKg: 25, packSize: 100, packName: 'vrećice', packNameEn: 'tins', staple: true, tags: [] },
];
