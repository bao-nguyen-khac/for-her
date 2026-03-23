export const CATEGORIES = [
  { slug: 'ao-dai-truyen-thong', label: 'Áo dài truyền thống' },
  { slug: 'ao-dai-lua-gam', label: 'Áo dài lụa gấm' },
  { slug: 'ao-dai-cheo-han', label: 'Áo dài chéo Hàn' },
  { slug: 'ao-dai-theu', label: 'Áo dài thêu' },
  { slug: 'ao-dai-to-ong', label: 'Áo dài tơ ống' },
  { slug: 'ao-dai-dinh-ket', label: 'Áo dài đính kết' },
];

const CATEGORY_LABEL_BY_SLUG = CATEGORIES.reduce((acc, c) => {
  acc[c.slug] = c.label;
  return acc;
}, {});

const LEGACY_CATEGORY_TO_SLUG = {
  Men: 'ao-dai-truyen-thong',
  Women: 'ao-dai-truyen-thong',
  Kids: 'ao-dai-truyen-thong',
};

export function normalizeCategorySlug(categoryValue) {
  if (!categoryValue) return '';
  if (CATEGORY_LABEL_BY_SLUG[categoryValue]) return categoryValue;
  return LEGACY_CATEGORY_TO_SLUG[categoryValue] || categoryValue;
}

export function getCategoryLabel(categoryValue) {
  const slug = normalizeCategorySlug(categoryValue);
  return CATEGORY_LABEL_BY_SLUG[slug] || categoryValue || '';
}

