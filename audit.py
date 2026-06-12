import re
import json

from backend.app.core.nom035_engine import GUIA_III_MAPPING

with open('frontend/src/utils/questions.js', 'r', encoding='utf-8') as f:
    text = f.read()

guia_3_start = text.find('QUESTIONS_GUIA_III')
guia_3_text = text[guia_3_start:]
items = dict(re.findall(r'id:\s*(\d+),\s*text:\s*"([^"]+)"', guia_3_text))

with open('audit_out.txt', 'w', encoding='utf-8') as out:
    for domain, ids in GUIA_III_MAPPING['domains'].items():
        out.write(f"\nDOMAIN: {domain}\n")
        for i in ids:
            sid = str(i)
            text = items.get(sid, "NOT FOUND")
            out.write(f"  {sid}: {text}\n")
