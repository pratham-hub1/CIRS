import { ItemCategory } from './enums';

export function getVerificationQuestionsForCategory(category: ItemCategory): string[] {
  switch (category) {
    case ItemCategory.ELECTRONICS:
      return [
        'What is the wallpaper or lock screen image on the device?',
        'What is the exact model, storage capacity, or colour variant?',
        'Are there any distinctive scratches, stickers, or case details?',
      ];
    case ItemCategory.WALLETS:
      return [
        'What cards, identification cards, or documents are inside the wallet?',
        'What is the approximate amount or denominations of currency inside?',
        'What is the brand, colour, and material of the wallet?',
      ];
    case ItemCategory.BAGS:
      return [
        'What items, books, or devices are inside the main and side compartments?',
        'What brand, colour, and keychains or badges are attached to the bag?',
      ];
    case ItemCategory.ACCESSORIES:
      return [
        'What brand, model, or distinctive engravings/markings are on this accessory?',
        'What is the colour, material, and strap/chain style?',
      ];
    case ItemCategory.DOCUMENTS:
      return [
        'What is the full name, roll number, or identifier written on the document?',
        'Which institution, department, or authority issued the document?',
      ];
    case ItemCategory.KEYS:
      return [
        'How many keys are on the ring and what keychains or tags are attached?',
        'What type of locks or vehicles do the keys correspond to?',
      ];
    case ItemCategory.CLOTHING:
    case ItemCategory.STATIONERY:
    case ItemCategory.OTHERS:
    default:
      return [
        'Describe any distinctive labels, brand marks, writing, or contents.',
        'When and where did you lose this item?',
      ];
  }
}
