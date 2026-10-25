import fitz
import pytesseract
from PIL import Image
import io

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def inspect_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    print('==============================')
    print('FILE:', pdf_path)
    for p_no in range(len(doc)):
        p = doc[p_no]
        imgs = p.get_images()
        img_items = []
        for img in imgs:
            xref = img[0]
            rects = p.get_image_rects(xref)
            if rects:
                r = rects[0]
                img_items.append((r.y0, r.x0, xref, r))
        img_items.sort(key=lambda item: (round(item[0]/50), item[1]))
        
        print(f'Page {p_no+1} ({len(img_items)} cards):')
        for i, (y, x, xref, r) in enumerate(img_items):
            im_data = doc.extract_image(xref)
            pil_img = Image.open(io.BytesIO(im_data['image']))
            w, h = pil_img.size
            title_crop = pil_img.crop((int(w * 0.05), int(h * 0.02), int(w * 0.95), int(h * 0.12)))
            ocr_text = pytesseract.image_to_string(title_crop, lang='fra+eng').strip().replace('\n', ' ')
            print(f'  Card {i+1} [xref {xref}] at ({x:.0f}, {y:.0f}): OCR: "{ocr_text}"')

if __name__ == '__main__':
    inspect_pdf('medias/pdf/cartes-calamites-illustrees.pdf')
    inspect_pdf('medias/pdf/cartes-marchandises-individualisees.pdf')
    inspect_pdf('medias/pdf/cartes-progres-illustrees.pdf')
