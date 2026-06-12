import re
import json

from backend.app.core.nom035_engine import GUIA_II_MAPPING

with open('frontend/src/utils/questions.js', 'r', encoding='utf-8') as f:
    text = f.read()

guia_2_start = text.find('QUESTIONS_GUIA_II =')
guia_3_start = text.find('QUESTIONS_GUIA_III')
guia_2_text = text[guia_2_start:guia_3_start]
items = dict(re.findall(r'id:\s*(\d+),\s*text:\s*"([^"]+)"', guia_2_text))

with open('audit_out2.txt', 'w', encoding='utf-8') as out:
    for domain, ids in GUIA_II_MAPPING['domains'].items():
        out.write(f"\nDOMAIN: {domain}\n")
        for i in ids:
            sid = str(i)
            text = items.get(sid, "NOT FOUND")
            out.write(f"  {sid}: {text}\n")
