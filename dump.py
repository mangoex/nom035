import re, json

with open("frontend/src/utils/questions.js", "r", encoding="utf-8") as f:
    text = f.read()

guia_3_start = text.find("QUESTIONS_GUIA_III")
guia_3_text = text[guia_3_start:]
items = re.findall(r'id:\s*(\d+),\s*text:\s*"([^"]+)"', guia_3_text)

with open("dump.txt", "w", encoding="utf-8") as out:
    for i, t in items:
        out.write(f"{i}: {t}\n")
