import type { Ingredient } from '../types';

/**
 * Ingredients keyed by id. Macros are per 100 g (per 100 ml for liquids) and
 * follow Livsmedelsverket / manufacturer declarations. Prices are approximate
 * ICA Kvantum shelf prices in SEK and exist to give the plan a realistic weekly
 * cost — they are not live and will drift, so treat the total as an estimate.
 */
const RAW: Ingredient[] = [
  // ── Kött & Chark ─────────────────────────────────────────────────────────
  { id: 'kycklingfile', name: 'Kycklingfilé', en: 'Chicken breast', dept: 'Kött & Chark', kcal: 106, protein: 22.5, carbs: 0, fat: 1.7, pricePerKg: 109, packSize: 700, packName: 'pack ca 700 g', packNameEn: 'pack approx 700 g', tags: ['meat'] },
  { id: 'kycklinglar', name: 'Kycklinglårfilé', en: 'Chicken thigh fillet', dept: 'Kött & Chark', kcal: 150, protein: 19, carbs: 0, fat: 8, pricePerKg: 89, packSize: 800, packName: 'pack ca 800 g', packNameEn: 'pack approx 800 g', tags: ['meat'] },
  { id: 'kalkonfile', name: 'Kalkonfilé', en: 'Turkey breast', dept: 'Kött & Chark', kcal: 105, protein: 23, carbs: 0.5, fat: 1, pricePerKg: 200, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['meat'] },
  { id: 'notfars5', name: 'Nötfärs 5%', en: 'Lean beef mince 5%', dept: 'Kött & Chark', kcal: 130, protein: 21, carbs: 0, fat: 5, pricePerKg: 139, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', storeQuery: 'nötfärs', tags: ['meat'] },
  { id: 'notfars10', name: 'Nötfärs 10%', en: 'Beef mince 10%', dept: 'Kött & Chark', kcal: 176, protein: 19, carbs: 0, fat: 11, pricePerKg: 105, packSize: 500, packName: 'pack 500 g', packNameEn: 'pack 500 g', storeQuery: 'nötfärs', tags: ['meat'] },
  { id: 'flaskfile', name: 'Fläskfilé', en: 'Pork tenderloin', dept: 'Kött & Chark', kcal: 112, protein: 21, carbs: 0, fat: 3, pricePerKg: 129, packSize: 500, packName: 'pack ca 500 g', packNameEn: 'pack approx 500 g', tags: ['meat', 'pork'] },
  { id: 'bacon', name: 'Bacon', en: 'Bacon', dept: 'Kött & Chark', kcal: 340, protein: 17, carbs: 1, fat: 30, pricePerKg: 199, packSize: 140, packName: 'pack 140 g', packNameEn: 'pack 140 g', tags: ['meat', 'pork'] },
  { id: 'skinka', name: 'Skivad skinka', en: 'Sliced ham', dept: 'Kött & Chark', kcal: 110, protein: 18, carbs: 1, fat: 4, pricePerKg: 179, packSize: 130, packName: 'pack 130 g', packNameEn: 'pack 130 g', tags: ['meat', 'pork'] },

  // ── Fisk ─────────────────────────────────────────────────────────────────
  { id: 'lax', name: 'Laxfilé', en: 'Salmon fillet', dept: 'Fisk', kcal: 208, protein: 20, carbs: 0, fat: 13, pricePerKg: 219, packSize: 500, packName: 'pack ca 500 g', packNameEn: 'pack approx 500 g', tags: ['fish'] },
  { id: 'torsk', name: 'Torskfilé', en: 'Cod fillet', dept: 'Fisk', kcal: 82, protein: 18, carbs: 0, fat: 0.7, pricePerKg: 169, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['fish'] },
  { id: 'rakor', name: 'Handskalade räkor', en: 'Peeled shrimp', dept: 'Fisk', kcal: 99, protein: 20, carbs: 0, fat: 1, pricePerKg: 249, packSize: 400, packName: 'pack 400 g', packNameEn: 'pack 400 g', tags: ['fish'] },
  { id: 'tonfisk', name: 'Tonfisk i vatten', en: 'Canned tuna in water', dept: 'Skafferi', kcal: 100, protein: 23, carbs: 0, fat: 1, pricePerKg: 149, packSize: 140, packName: 'burk 185 g (140 g avrunnen)', packNameEn: 'tin 185 g (140 g drained)', tags: ['fish'] },
  { id: 'makrill', name: 'Makrill i tomatsås', en: 'Mackerel in tomato sauce', dept: 'Skafferi', kcal: 190, protein: 15, carbs: 4, fat: 12, pricePerKg: 99, packSize: 375, packName: 'burk 375 g', packNameEn: 'tin 375 g', tags: ['fish'] },

  // ── Mejeri & Ägg ─────────────────────────────────────────────────────────
  { id: 'agg', name: 'Ägg', en: 'Eggs', dept: 'Mejeri & Ägg', kcal: 143, protein: 12.6, carbs: 0.3, fat: 9.5, pricePerKg: 64, packSize: 720, packName: 'kartong 12 st', packNameEn: 'carton of 12', unitWeight: 60, tags: ['egg'] },
  { id: 'aggvita', name: 'Äggvita, flytande', en: 'Liquid egg whites', dept: 'Mejeri & Ägg', kcal: 48, protein: 11, carbs: 0.7, fat: 0, pricePerKg: 89, packSize: 500, packName: 'förp 500 g', packNameEn: 'pack 500 g', storeQuery: 'äggvita', tags: ['egg'] },
  { id: 'kvarg', name: 'Kvarg naturell 0,2%', en: 'Quark, plain', dept: 'Mejeri & Ägg', kcal: 62, protein: 11, carbs: 4, fat: 0.2, pricePerKg: 55, packSize: 500, packName: 'förp 500 g', packNameEn: 'pack 500 g', storeQuery: 'kvarg naturell', tags: ['dairy', 'lactose'] },
  { id: 'keso', name: 'Keso 4%', en: 'Cottage cheese', dept: 'Mejeri & Ägg', kcal: 79, protein: 12, carbs: 2.5, fat: 2, pricePerKg: 60, packSize: 500, packName: 'förp 500 g', packNameEn: 'pack 500 g', storeQuery: 'keso', tags: ['dairy', 'lactose'] },
  { id: 'grekyoghurt', name: 'Grekisk yoghurt 2%', en: 'Greek yoghurt 2%', dept: 'Mejeri & Ägg', kcal: 73, protein: 9, carbs: 4, fat: 2, pricePerKg: 55, packSize: 1000, packName: 'förp 1 kg', packNameEn: 'tub 1 kg', storeQuery: 'grekisk yoghurt', tags: ['dairy', 'lactose'] },
  { id: 'proteinmjolk', name: 'Proteinmjölk', en: 'High-protein milk', dept: 'Mejeri & Ägg', kcal: 60, protein: 8, carbs: 5.5, fat: 0.5, pricePerKg: 35, packSize: 1000, packName: 'förp 1 l', packNameEn: 'carton 1 l', tags: ['dairy', 'lactose'] },
  { id: 'mjolk', name: 'Mellanmjölk 1,5%', en: 'Milk 1.5%', dept: 'Mejeri & Ägg', kcal: 45, protein: 3.5, carbs: 5, fat: 1.5, pricePerKg: 16, packSize: 1000, packName: 'förp 1 l', packNameEn: 'carton 1 l', storeQuery: 'mellanmjölk', tags: ['dairy', 'lactose'] },
  { id: 'rivenost', name: 'Riven ost 17%', en: 'Grated cheese', dept: 'Mejeri & Ägg', kcal: 265, protein: 30, carbs: 1, fat: 17, pricePerKg: 119, packSize: 250, packName: 'påse 250 g', packNameEn: 'bag 250 g', storeQuery: 'riven ost', tags: ['dairy'] },
  { id: 'fetaost', name: 'Fetaost', en: 'Feta', dept: 'Mejeri & Ägg', kcal: 265, protein: 14, carbs: 1, fat: 22, pricePerKg: 129, packSize: 200, packName: 'förp 200 g', packNameEn: 'pack 200 g', tags: ['dairy'] },
  { id: 'parmesan', name: 'Parmesan, riven', en: 'Parmesan', dept: 'Mejeri & Ägg', kcal: 400, protein: 32, carbs: 0, fat: 30, pricePerKg: 249, packSize: 150, packName: 'förp 150 g', packNameEn: 'pack 150 g', storeQuery: 'parmesan riven', tags: ['dairy'] },
  { id: 'halloumi', name: 'Halloumi', en: 'Halloumi', dept: 'Mejeri & Ägg', kcal: 320, protein: 22, carbs: 2, fat: 25, pricePerKg: 179, packSize: 250, packName: 'förp 250 g', packNameEn: 'pack 250 g', tags: ['dairy'] },
  { id: 'cremefraiche', name: 'Crème fraiche lätt', en: 'Light crème fraîche', dept: 'Mejeri & Ägg', kcal: 130, protein: 3, carbs: 4, fat: 11, pricePerKg: 60, packSize: 200, packName: 'förp 2 dl', packNameEn: 'tub 200 ml', storeQuery: 'crème fraiche', tags: ['dairy', 'lactose'] },
  { id: 'smor', name: 'Smör', en: 'Butter', dept: 'Mejeri & Ägg', kcal: 730, protein: 0.5, carbs: 0.5, fat: 81, pricePerKg: 99, packSize: 500, packName: 'förp 500 g', packNameEn: 'pack 500 g', staple: true, tags: ['dairy'] },

  // ── Frukt & Grönt ────────────────────────────────────────────────────────
  { id: 'banan', name: 'Banan', en: 'Banana', dept: 'Frukt & Grönt', kcal: 89, protein: 1.1, carbs: 21, fat: 0.3, pricePerKg: 26, packSize: 1000, packName: 'lösvikt', packNameEn: 'loose', unitWeight: 120, tags: [] },
  { id: 'apple', name: 'Äpple', en: 'Apple', dept: 'Frukt & Grönt', kcal: 52, protein: 0.3, carbs: 12, fat: 0.2, pricePerKg: 30, packSize: 1000, packName: 'lösvikt', packNameEn: 'loose', unitWeight: 150, tags: [] },
  { id: 'broccoli', name: 'Broccoli', en: 'Broccoli', dept: 'Frukt & Grönt', kcal: 34, protein: 2.8, carbs: 4, fat: 0.4, pricePerKg: 45, packSize: 500, packName: 'ca 500 g', packNameEn: 'approx 500 g', tags: [] },
  { id: 'blomkal', name: 'Blomkål', en: 'Cauliflower', dept: 'Frukt & Grönt', kcal: 25, protein: 1.9, carbs: 3, fat: 0.3, pricePerKg: 39, packSize: 600, packName: '1 huvud ca 600 g', packNameEn: '1 head approx 600 g', tags: [] },
  { id: 'paprika', name: 'Paprika', en: 'Bell pepper', dept: 'Frukt & Grönt', kcal: 31, protein: 1, carbs: 6, fat: 0.3, pricePerKg: 60, packSize: 400, packName: 'påse 3 st', packNameEn: 'bag of 3', unitWeight: 150, tags: [] },
  { id: 'lok', name: 'Gul lök', en: 'Yellow onion', dept: 'Frukt & Grönt', kcal: 40, protein: 1.1, carbs: 8, fat: 0.1, pricePerKg: 20, packSize: 1000, packName: 'påse 1 kg', packNameEn: 'bag 1 kg', unitWeight: 110, staple: true, tags: [] },
  { id: 'rodlok', name: 'Rödlök', en: 'Red onion', dept: 'Frukt & Grönt', kcal: 40, protein: 1.1, carbs: 8, fat: 0.1, pricePerKg: 35, packSize: 500, packName: 'påse 500 g', packNameEn: 'bag 500 g', unitWeight: 100, tags: [] },
  { id: 'vitlok', name: 'Vitlök', en: 'Garlic', dept: 'Frukt & Grönt', kcal: 149, protein: 6, carbs: 30, fat: 0.5, pricePerKg: 120, packSize: 100, packName: '2 st', packNameEn: '2 pcs', unitWeight: 5, staple: true, tags: [] },
  { id: 'morot', name: 'Morötter', en: 'Carrots', dept: 'Frukt & Grönt', kcal: 41, protein: 0.9, carbs: 8, fat: 0.2, pricePerKg: 20, packSize: 1000, packName: 'påse 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'potatis', name: 'Fast potatis', en: 'Potatoes', dept: 'Frukt & Grönt', kcal: 77, protein: 2, carbs: 16, fat: 0.1, pricePerKg: 18, packSize: 2000, packName: 'påse 2 kg', packNameEn: 'bag 2 kg', tags: [] },
  { id: 'sotpotatis', name: 'Sötpotatis', en: 'Sweet potato', dept: 'Frukt & Grönt', kcal: 86, protein: 1.6, carbs: 18, fat: 0.1, pricePerKg: 40, packSize: 1000, packName: 'lösvikt', packNameEn: 'loose', tags: [] },
  { id: 'tomat', name: 'Tomat', en: 'Tomato', dept: 'Frukt & Grönt', kcal: 18, protein: 0.9, carbs: 3, fat: 0.2, pricePerKg: 45, packSize: 500, packName: 'ca 500 g', packNameEn: 'approx 500 g', unitWeight: 110, tags: [] },
  { id: 'korsbarstomat', name: 'Körsbärstomater', en: 'Cherry tomatoes', dept: 'Frukt & Grönt', kcal: 30, protein: 0.9, carbs: 4, fat: 0.3, pricePerKg: 80, packSize: 250, packName: 'ask 250 g', packNameEn: 'punnet 250 g', tags: [] },
  { id: 'gurka', name: 'Gurka', en: 'Cucumber', dept: 'Frukt & Grönt', kcal: 15, protein: 0.7, carbs: 2, fat: 0.1, pricePerKg: 30, packSize: 400, packName: '1 st', packNameEn: '1 pc', tags: [] },
  { id: 'spenat', name: 'Babyspenat', en: 'Baby spinach', dept: 'Frukt & Grönt', kcal: 23, protein: 2.9, carbs: 1, fat: 0.4, pricePerKg: 150, packSize: 200, packName: 'påse 200 g', packNameEn: 'bag 200 g', tags: [] },
  { id: 'salladsmix', name: 'Salladsmix', en: 'Mixed salad', dept: 'Frukt & Grönt', kcal: 20, protein: 1.5, carbs: 2, fat: 0.3, pricePerKg: 130, packSize: 175, packName: 'påse 175 g', packNameEn: 'bag 175 g', tags: [] },
  { id: 'avokado', name: 'Avokado', en: 'Avocado', dept: 'Frukt & Grönt', kcal: 160, protein: 2, carbs: 2, fat: 15, pricePerKg: 80, packSize: 400, packName: 'påse 2 st', packNameEn: 'bag of 2', unitWeight: 200, tags: [] },
  { id: 'citron', name: 'Citron', en: 'Lemon', dept: 'Frukt & Grönt', kcal: 29, protein: 1.1, carbs: 3, fat: 0.3, pricePerKg: 45, packSize: 400, packName: 'nät 4 st', packNameEn: 'net of 4', unitWeight: 100, staple: true, tags: [] },
  { id: 'champinjon', name: 'Champinjoner', en: 'Mushrooms', dept: 'Frukt & Grönt', kcal: 22, protein: 3.1, carbs: 0.3, fat: 0.3, pricePerKg: 60, packSize: 250, packName: 'ask 250 g', packNameEn: 'punnet 250 g', tags: [] },
  { id: 'zucchini', name: 'Zucchini', en: 'Courgette', dept: 'Frukt & Grönt', kcal: 17, protein: 1.2, carbs: 2, fat: 0.3, pricePerKg: 45, packSize: 400, packName: '1 st', packNameEn: '1 pc', tags: [] },
  { id: 'ingefara', name: 'Ingefära', en: 'Ginger', dept: 'Frukt & Grönt', kcal: 80, protein: 1.8, carbs: 15, fat: 0.8, pricePerKg: 120, packSize: 100, packName: 'lösvikt', packNameEn: 'loose', staple: true, tags: [] },
  { id: 'orter', name: 'Färska örter', en: 'Fresh herbs', dept: 'Frukt & Grönt', kcal: 40, protein: 3, carbs: 2, fat: 0.5, pricePerKg: 240, packSize: 25, packName: 'kruka/påse', packNameEn: 'pot/bag', storeQuery: 'färska örter', tags: [] },

  // ── Bröd ─────────────────────────────────────────────────────────────────
  { id: 'fullkornsbrod', name: 'Fullkornsbröd', en: 'Wholegrain bread', dept: 'Bröd', kcal: 240, protein: 9, carbs: 38, fat: 3.5, pricePerKg: 60, packSize: 500, packName: 'limpa 500 g', packNameEn: 'loaf 500 g', unitWeight: 35, tags: ['gluten'] },
  { id: 'knackebrod', name: 'Knäckebröd', en: 'Crispbread', dept: 'Bröd', kcal: 350, protein: 10, carbs: 60, fat: 3, pricePerKg: 60, packSize: 250, packName: 'förp 250 g', packNameEn: 'pack 250 g', unitWeight: 12, tags: ['gluten'] },
  { id: 'tortilla', name: 'Tortillabröd fullkorn', en: 'Wholegrain tortilla', dept: 'Bröd', kcal: 290, protein: 9, carbs: 46, fat: 6, pricePerKg: 90, packSize: 320, packName: 'förp 8 st', packNameEn: 'pack of 8', unitWeight: 40, storeQuery: 'tortillabröd', tags: ['gluten'] },

  // ── Skafferi ─────────────────────────────────────────────────────────────
  { id: 'havregryn', name: 'Havregryn', en: 'Rolled oats', dept: 'Skafferi', kcal: 370, protein: 13, carbs: 58, fat: 7, pricePerKg: 22, packSize: 1500, packName: 'påse 1,5 kg', packNameEn: 'bag 1.5 kg', tags: ['gluten'] },
  { id: 'ris', name: 'Jasminris', en: 'Jasmine rice', dept: 'Skafferi', kcal: 350, protein: 7, carbs: 78, fat: 0.6, pricePerKg: 35, packSize: 1000, packName: 'påse 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'fullkornsris', name: 'Fullkornsris', en: 'Brown rice', dept: 'Skafferi', kcal: 350, protein: 8, carbs: 72, fat: 2.7, pricePerKg: 45, packSize: 1000, packName: 'påse 1 kg', packNameEn: 'bag 1 kg', tags: [] },
  { id: 'pasta', name: 'Fullkornspasta', en: 'Wholegrain pasta', dept: 'Skafferi', kcal: 350, protein: 13, carbs: 62, fat: 2.5, pricePerKg: 32, packSize: 1000, packName: 'påse 1 kg', packNameEn: 'bag 1 kg', tags: ['gluten'] },
  { id: 'couscous', name: 'Couscous', en: 'Couscous', dept: 'Skafferi', kcal: 360, protein: 12, carbs: 72, fat: 1.5, pricePerKg: 45, packSize: 500, packName: 'förp 500 g', packNameEn: 'pack 500 g', tags: ['gluten'] },
  { id: 'quinoa', name: 'Quinoa', en: 'Quinoa', dept: 'Skafferi', kcal: 368, protein: 14, carbs: 57, fat: 6, pricePerKg: 90, packSize: 500, packName: 'förp 500 g', packNameEn: 'pack 500 g', tags: [] },
  { id: 'rodalinser', name: 'Röda linser', en: 'Red lentils', dept: 'Skafferi', kcal: 350, protein: 24, carbs: 50, fat: 1.5, pricePerKg: 45, packSize: 500, packName: 'påse 500 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'kikartor', name: 'Kikärtor, konserv', en: 'Chickpeas, canned', dept: 'Skafferi', kcal: 120, protein: 7, carbs: 15, fat: 2.6, pricePerKg: 32, packSize: 380, packName: 'burk 380 g avrunnen', packNameEn: 'tin 380 g drained', storeQuery: 'kikärtor', tags: [] },
  { id: 'svartabonor', name: 'Svarta bönor, konserv', en: 'Black beans, canned', dept: 'Skafferi', kcal: 110, protein: 7, carbs: 14, fat: 0.6, pricePerKg: 32, packSize: 380, packName: 'burk 380 g avrunnen', packNameEn: 'tin 380 g drained', storeQuery: 'svarta bönor', tags: [] },
  { id: 'krossadetomater', name: 'Krossade tomater', en: 'Crushed tomatoes', dept: 'Skafferi', kcal: 32, protein: 1.3, carbs: 5, fat: 0.3, pricePerKg: 20, packSize: 400, packName: 'förp 400 g', packNameEn: 'pack 400 g', tags: [] },
  { id: 'tomatpure', name: 'Tomatpuré', en: 'Tomato purée', dept: 'Skafferi', kcal: 80, protein: 4, carbs: 12, fat: 0.5, pricePerKg: 60, packSize: 200, packName: 'tub 200 g', packNameEn: 'tube 200 g', staple: true, tags: [] },
  { id: 'kokosmjolk', name: 'Kokosmjölk', en: 'Coconut milk', dept: 'Skafferi', kcal: 180, protein: 2, carbs: 3, fat: 17, pricePerKg: 45, packSize: 400, packName: 'burk 400 ml', packNameEn: 'tin 400 ml', tags: [] },
  { id: 'olivolja', name: 'Olivolja', en: 'Olive oil', dept: 'Skafferi', kcal: 884, protein: 0, carbs: 0, fat: 100, pricePerKg: 130, packSize: 500, packName: 'flaska 500 ml', packNameEn: 'bottle 500 ml', staple: true, tags: [] },
  { id: 'rapsolja', name: 'Rapsolja', en: 'Rapeseed oil', dept: 'Skafferi', kcal: 900, protein: 0, carbs: 0, fat: 100, pricePerKg: 40, packSize: 1000, packName: 'flaska 1 l', packNameEn: 'bottle 1 l', staple: true, tags: [] },
  { id: 'jordnotssmor', name: 'Jordnötssmör', en: 'Peanut butter', dept: 'Skafferi', kcal: 600, protein: 25, carbs: 12, fat: 50, pricePerKg: 95, packSize: 350, packName: 'burk 350 g', packNameEn: 'tin 350 g', tags: ['nuts'] },
  { id: 'mandlar', name: 'Mandlar', en: 'Almonds', dept: 'Skafferi', kcal: 600, protein: 21, carbs: 6, fat: 52, pricePerKg: 150, packSize: 300, packName: 'påse 300 g', packNameEn: 'bag 300 g', tags: ['nuts'] },
  { id: 'valnotter', name: 'Valnötter', en: 'Walnuts', dept: 'Skafferi', kcal: 690, protein: 15, carbs: 7, fat: 65, pricePerKg: 200, packSize: 200, packName: 'påse 200 g', packNameEn: 'bag 200 g', tags: ['nuts'] },
  { id: 'chiafron', name: 'Chiafrön', en: 'Chia seeds', dept: 'Skafferi', kcal: 480, protein: 17, carbs: 8, fat: 31, pricePerKg: 150, packSize: 250, packName: 'påse 250 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'vassleprotein', name: 'Vassleproteinpulver', en: 'Whey protein powder', dept: 'Skafferi', kcal: 380, protein: 80, carbs: 6, fat: 5, pricePerKg: 400, packSize: 1000, packName: 'burk 1 kg', packNameEn: 'tin 1 kg', tags: ['dairy'] },
  { id: 'granola', name: 'Musli utan tillsatt socker', en: 'No-added-sugar muesli', dept: 'Skafferi', kcal: 420, protein: 9, carbs: 60, fat: 14, pricePerKg: 80, packSize: 750, packName: 'påse 750 g', packNameEn: 'bag 750 g', storeQuery: 'musli', tags: ['gluten', 'nuts'] },
  { id: 'riskakor', name: 'Riskakor', en: 'Rice cakes', dept: 'Skafferi', kcal: 380, protein: 8, carbs: 80, fat: 3, pricePerKg: 100, packSize: 130, packName: 'förp 130 g', packNameEn: 'pack 130 g', unitWeight: 9, tags: [] },
  { id: 'russin', name: 'Russin', en: 'Raisins', dept: 'Skafferi', kcal: 300, protein: 3, carbs: 79, fat: 0.5, pricePerKg: 80, packSize: 250, packName: 'påse 250 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'honung', name: 'Honung', en: 'Honey', dept: 'Skafferi', kcal: 320, protein: 0, carbs: 82, fat: 0, pricePerKg: 90, packSize: 350, packName: 'burk 350 g', packNameEn: 'tin 350 g', staple: true, tags: [] },
  { id: 'kakao', name: 'Kakao', en: 'Cocoa powder', dept: 'Skafferi', kcal: 355, protein: 22, carbs: 11, fat: 22, pricePerKg: 250, packSize: 200, packName: 'förp 200 g', packNameEn: 'pack 200 g', staple: true, tags: [] },
  { id: 'majs', name: 'Majs, konserv', en: 'Sweetcorn, canned', dept: 'Skafferi', kcal: 90, protein: 3, carbs: 15, fat: 1, pricePerKg: 40, packSize: 340, packName: 'burk 340 g', packNameEn: 'tin 340 g', storeQuery: 'majs konserv', tags: [] },
  { id: 'soja', name: 'Japansk soja', en: 'Soy sauce', dept: 'Skafferi', kcal: 60, protein: 6, carbs: 6, fat: 0, pricePerKg: 90, packSize: 200, packName: 'flaska 200 ml', packNameEn: 'bottle 200 ml', staple: true, tags: ['soy', 'gluten'] },
  { id: 'sriracha', name: 'Sriracha', en: 'Sriracha', dept: 'Skafferi', kcal: 100, protein: 1, carbs: 20, fat: 0.5, pricePerKg: 100, packSize: 200, packName: 'flaska 200 ml', packNameEn: 'bottle 200 ml', staple: true, tags: [] },
  { id: 'senap', name: 'Dijonsenap', en: 'Dijon mustard', dept: 'Skafferi', kcal: 150, protein: 6, carbs: 5, fat: 10, pricePerKg: 120, packSize: 200, packName: 'burk 200 g', packNameEn: 'tin 200 g', staple: true, tags: [] },
  { id: 'buljong', name: 'Buljongtärningar', en: 'Stock cubes', dept: 'Skafferi', kcal: 200, protein: 10, carbs: 20, fat: 10, pricePerKg: 200, packSize: 80, packName: 'förp 8 st', packNameEn: 'pack of 8', staple: true, tags: [] },
  { id: 'kryddor', name: 'Kryddor (salt, peppar, paprika, spiskummin)', en: 'Spices', dept: 'Skafferi', kcal: 300, protein: 10, carbs: 50, fat: 5, pricePerKg: 300, packSize: 100, packName: 'burkar', packNameEn: 'tins', staple: true, storeQuery: 'kryddor', tags: [] },

  // ── Fryst ────────────────────────────────────────────────────────────────
  { id: 'blabar', name: 'Frysta blåbär', en: 'Frozen blueberries', dept: 'Fryst', kcal: 45, protein: 0.7, carbs: 8, fat: 0.4, pricePerKg: 55, packSize: 500, packName: 'påse 500 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'hallon', name: 'Frysta hallon', en: 'Frozen raspberries', dept: 'Fryst', kcal: 52, protein: 1.2, carbs: 5, fat: 0.7, pricePerKg: 70, packSize: 250, packName: 'påse 250 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'artor', name: 'Frysta ärtor', en: 'Frozen peas', dept: 'Fryst', kcal: 80, protein: 5, carbs: 10, fat: 0.5, pricePerKg: 30, packSize: 500, packName: 'påse 500 g', packNameEn: 'bag 500 g', tags: [] },
  { id: 'frystspenat', name: 'Fryst spenat', en: 'Frozen spinach', dept: 'Fryst', kcal: 25, protein: 3, carbs: 1, fat: 0.4, pricePerKg: 30, packSize: 250, packName: 'påse 250 g', packNameEn: 'bag 250 g', tags: [] },
  { id: 'wokgronsaker', name: 'Wokgrönsaker, frysta', en: 'Frozen stir-fry vegetables', dept: 'Fryst', kcal: 40, protein: 2, carbs: 5, fat: 0.5, pricePerKg: 40, packSize: 500, packName: 'påse 500 g', packNameEn: 'bag 500 g', storeQuery: 'wokgrönsaker', tags: [] },
  { id: 'tofu', name: 'Tofu naturell', en: 'Firm tofu', dept: 'Mejeri & Ägg', kcal: 130, protein: 14, carbs: 2, fat: 7, pricePerKg: 95, packSize: 400, packName: 'förp 400 g', packNameEn: 'pack 400 g', tags: ['soy'] },
  { id: 'sojafars', name: 'Sojafärs, fryst', en: 'Soy mince, frozen', dept: 'Fryst', kcal: 105, protein: 15, carbs: 5, fat: 2, pricePerKg: 120, packSize: 400, packName: 'påse 400 g', packNameEn: 'bag 400 g', storeQuery: 'sojafärs', tags: ['soy'] },
];

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  RAW.map((i) => [i.id, i]),
);

export function getIngredient(id: string): Ingredient {
  const ing = INGREDIENTS[id];
  if (!ing) throw new Error(`Unknown ingredient: ${id}`);
  return ing;
}
