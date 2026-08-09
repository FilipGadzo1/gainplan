import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShoppingItem, ShoppingList } from '../types';
import { unitCount } from '../lib/shopping';
import { ingredientName, ingredientSubtitle, packName, deptLabel } from './content';
import { useCurrencyFormat, useLanguage, useQuantityFormat } from './hooks';
import { useRegion } from '../regions/context';

/**
 * The shopping list's language-dependent strings: the "how much to buy" line
 * under each item, and the plain-text export that goes to the clipboard.
 */
export function useShoppingFormat(): {
  quantity: (item: ShoppingItem) => string;
  listText: (list: ShoppingList, forWhom: string) => string;
} {
  const { t } = useTranslation('shopping');
  const { language } = useLanguage();
  const fmt = useQuantityFormat();
  const { region, chain } = useRegion();
  const money = useCurrencyFormat();

  const quantity = useCallback(
    (item: ShoppingItem) => {
      const { ingredient, packs, grams } = item;
      const pack = packName(ingredient, language);

      // Pack names already carry their own count ("2 st", "påse 1 kg"), so a
      // staple must not get a "1 " glued in front of it.
      if (ingredient.staple) return t('quantity.staple', { pack, grams: fmt.grams(grams) });

      const packLabel = packs === 1 ? pack : t('quantity.packs', { count: packs, pack });

      const units = unitCount(item);
      if (units !== null) {
        return t('quantity.units', { pack: packLabel, pieces: fmt.pieces(units) });
      }
      return t('quantity.needs', { pack: packLabel, grams: fmt.grams(grams) });
    },
    [t, language, fmt],
  );

  const listText = useCallback(
    (list: ShoppingList, forWhom: string) => {
      const lines = [
        t('text.header', { store: chain.name, area: chain.area }),
        t('text.subtitle', {
          who: forWhom,
          amount: money(list.total),
          items: t('items', { count: list.itemCount }),
        }),
        '',
      ];
      for (const group of list.groups) {
        lines.push(deptLabel(group.dept, language, region).toUpperCase());
        for (const item of group.items) {
          const name = ingredientName(item.ingredient, language);
          const other = ingredientSubtitle(item.ingredient, language);
          // No brackets where there is no second name — "Salmon fillet ()" is
          // worse than no brackets at all.
          lines.push(`- ${name}${other ? ` (${other})` : ''} — ${quantity(item)}`);
        }
        lines.push('');
      }
      return lines.join('\n').trim();
    },
    [t, language, quantity, region, chain, money],
  );

  return useMemo(() => ({ quantity, listText }), [quantity, listText]);
}
