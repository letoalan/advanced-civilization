import fitz
import os
import shutil
from PIL import Image
import io

CALAMITY_MAP = {
    (0, 0, 0): 'volcano',
    (0, 0, 1): 'famine',
    (0, 1, 0): 'civilwar',
    (0, 1, 1): 'flood',
    (0, 2, 0): 'civildisorder',
    (0, 2, 1): 'treachery',
    (2, 0, 0): 'superstition',
    (2, 0, 1): 'slaverevolt',
    (2, 1, 0): 'barbarianhordes',
    (2, 1, 1): 'epidemic',
    (2, 2, 0): 'iconoclasm',
    (2, 2, 1): 'piracy',
}

COMMODITY_MAP = {
    (0, 0, 0): 'ochre',
    (0, 0, 1): 'hides',
    (0, 1, 0): 'iron',
    (0, 1, 1): 'papyrus',
    (0, 2, 0): 'salt',
    (0, 2, 1): 'timber',
    (2, 0, 0): 'grain',
    (2, 0, 1): 'oil',
    (2, 1, 0): 'cloth',
    (2, 1, 1): 'wine',
    (2, 2, 0): 'bronze',
    (2, 2, 1): 'silver',
    (4, 0, 0): 'spices',
    (4, 0, 1): 'resin',
    (4, 1, 0): 'gems',
    (4, 1, 1): 'dye',
    (4, 2, 0): 'gold',
    (4, 2, 1): 'ivory',
}

ADVANCE_MAP = {
    (0, 0, 0): 'pottery',
    (0, 0, 1): 'clothmaking',
    (0, 1, 0): 'metalworking',
    (0, 1, 1): 'agriculture',
    (0, 2, 0): 'roadbuilding',
    (0, 2, 1): 'mining',
    (2, 0, 0): 'engineering',
    (2, 0, 1): 'astronomy',
    (2, 1, 0): 'coinage',
    (2, 1, 1): 'medicine',
    (2, 2, 0): 'mathematics',
    (2, 2, 1): 'drama',
    (4, 0, 0): 'music',
    (4, 0, 1): 'architecture',
    (4, 1, 0): 'literacy',
    (4, 1, 1): 'law',
    (4, 2, 0): 'democracy',
    (4, 2, 1): 'military',
    (6, 0, 0): 'philosophy',
    (6, 0, 1): 'mysticism',
    (6, 1, 0): 'deism',
    (6, 1, 1): 'enlightenment',
    (6, 2, 0): 'monotheism',
    (6, 2, 1): 'theology',
}

def extract_pdf_cards(pdf_path, mapping, category, back_name):
    doc = fitz.open(pdf_path)
    out_dir = os.path.join('medias', 'images', category)
    backs_dir = os.path.join('medias', 'images', 'backs')
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(backs_dir, exist_ok=True)

    extracted = {}

    for p_no in range(len(doc)):
        p = doc[p_no]
        imgs = p.get_images()
        img_items = []
        for img in imgs:
            xref = img[0]
            rects = p.get_image_rects(xref)
            if rects:
                r = rects[0]
                img_items.append((r.y0, r.x0, xref))
        
        # Sort top to bottom, then left to right
        img_items.sort(key=lambda item: (round(item[0] / 50), item[1]))

        if p_no % 2 == 1:
            # Back page
            if img_items:
                xref = img_items[0][2]
                im_data = doc.extract_image(xref)
                back_path = os.path.join(backs_dir, f'{back_name}.png')
                with open(back_path, 'wb') as f:
                    f.write(im_data['image'])
                print(f'Saved back: {back_path}')
            continue

        # Front page with 6 cards (3 rows x 2 cols)
        for idx, (y, x, xref) in enumerate(img_items):
            row = idx // 2
            col = idx % 2
            key = (p_no, row, col)
            card_id = mapping.get(key)
            if not card_id:
                print(f'Warning: unmapped card at page {p_no}, row {row}, col {col}')
                continue
            
            im_data = doc.extract_image(xref)
            card_path = os.path.join(out_dir, f'{card_id}.png')
            with open(card_path, 'wb') as f:
                f.write(im_data['image'])
            extracted[card_id] = card_path
            print(f'  [{category}] {card_id} -> {card_path}')

    print(f'Category {category}: extracted {len(extracted)} cards')
    return extracted

if __name__ == '__main__':
    extract_pdf_cards('medias/pdf/cartes-calamites-illustrees.pdf', CALAMITY_MAP, 'calamities', 'back_calamities')
    extract_pdf_cards('medias/pdf/cartes-marchandises-individualisees.pdf', COMMODITY_MAP, 'commodities', 'back_commodities')
    extract_pdf_cards('medias/pdf/cartes-progres-illustrees.pdf', ADVANCE_MAP, 'advances', 'back_advances')
