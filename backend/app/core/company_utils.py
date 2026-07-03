def normalize_departments(departments):
    if departments is None:
        return None

    cleaned = []
    seen = set()
    for item in departments:
        name = str(item or "").strip()
        key = name.lower()
        if name and key not in seen:
            cleaned.append(name)
            seen.add(key)
    return cleaned
