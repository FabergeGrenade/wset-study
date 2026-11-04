"""Validate the content and write data/*.json for the app."""
import json, sys, datetime, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from questions_lo3 import Q as Q3
from cards_lo3 import C as C3
from workbook import CH, HTML

OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "data"))
errors = []
secs = {s[0]: ch["lo"] for ch in CH for s in ch["sections"]}

qs, ids = [], set()
for (i, lo, sec, l1, q, o, a, ex, p) in Q3:
    if i in ids: errors.append(f"duplicate id {i}")
    ids.add(i)
    if len(o) != 4 or len(set(o)) != 4: errors.append(f"{i}: need 4 distinct options")
    if not 0 <= a < 4: errors.append(f"{i}: bad answer index")
    if sec not in secs: errors.append(f"{i}: unknown section {sec}")
    elif secs[sec] != lo: errors.append(f"{i}: LO {lo} but section {sec} is LO {secs[sec]}")
    if not p: errors.append(f"{i}: missing page")
    qs.append({"id": i, "lo": lo, "sec": sec, "l1": l1, "q": q, "o": o, "a": a, "ex": ex, "p": p})

cs, cids = [], set()
for (i, lo, sec, l1, f, b, p) in C3:
    if i in cids: errors.append(f"duplicate card {i}")
    cids.add(i)
    if sec not in secs: errors.append(f"card {i}: unknown section {sec}")
    cs.append({"id": i, "lo": lo, "sec": sec, "l1": l1, "f": f, "b": b, "p": p})

wb = {"chapters": [{"id": ch["id"], "lo": ch["lo"], "title": ch["title"], "sections": [
    {"id": s[0], "title": s[1], "pages": s[2], "l1": s[3], "html": HTML[s[4]].strip() if s[4] else None}
    for s in ch["sections"]]} for ch in CH]}

if errors:
    print("\n".join(errors)); sys.exit(1)

version = datetime.date.today().isoformat() + f"-{len(qs)}q"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "questions.json").write_text(json.dumps({"version": version, "questions": qs}, ensure_ascii=False, indent=0))
(OUT / "cards.json").write_text(json.dumps({"cards": cs}, ensure_ascii=False, indent=0))
(OUT / "workbook.json").write_text(json.dumps(wb, ensure_ascii=False, indent=0))
by = {}
for q in qs: by[q["lo"]] = by.get(q["lo"], 0) + 1
print(f"OK: {len(qs)} questions {dict(sorted(by.items()))}, {len(cs)} cards, "
      f"{sum(1 for c in wb['chapters'] for s in c['sections'] if s['html'])} workbook sections written. version {version}")
