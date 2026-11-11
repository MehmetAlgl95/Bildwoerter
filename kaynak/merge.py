import json, collections, sys
def load(fn):
    cats = collections.OrderedDict(); cur = None
    for l in open(fn, encoding="utf8"):
        l = l.rstrip("\n")
        if not l: continue
        if l.startswith("# "): cur = l[2:]; cats.setdefault(cur, []); continue
        p = l.split("|"); assert len(p) == 3, l
        cats[cur].append(p)
    return cats
pic = load("words.txt")
for k, v in load("extra.txt").items(): pic[k].extend(v)
a1 = load("a1.txt")
picidx = {w[1]: (k, w) for k, v in pic.items() for w in v}
seen = set(); moved = 0; dropped = []
for k, v in a1.items():
    out = []
    for w in v:
        if w[1] in seen: dropped.append(w[1]); continue
        seen.add(w[1])
        if w[1] in picidx:
            pk, pw = picidx[w[1]]
            if not w[0]: w[0] = pw[0]
            pic[pk].remove(pw); moved += 1
        out.append(w)
    a1[k] = out
used = collections.Counter(w[0] for v in list(a1.values()) + list(pic.values()) for w in v if w[0])
print("dup emoji", [e for e, c in used.items() if c > 1])
data = [{"de": k.split("|")[0], "tr": k.split("|")[1], "core": 1, "w": v} for k, v in a1.items()]
REN = {"Fiiller": "Resimli fiiller", "Duygular ve sıfatlar": "Duygular"}
data += [{"de": k.split("|")[0], "tr": REN.get(k.split("|")[1], k.split("|")[1]), "core": 0, "w": v} for k, v in pic.items() if v]
n = sum(len(c["w"]) for c in data)
print("total", n, "a1", sum(len(c["w"]) for c in data if c["core"]), "moved", moved, "dropped", dropped)
print([(c["tr"], len(c["w"])) for c in data])
json.dump(data, open("src/words.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))

# cümleler: sent.txt -> src/sent.json
topics = []; S = []
for l in open("sent.txt", encoding="utf8"):
    l = l.rstrip("\n")
    if not l: continue
    if l.startswith("# "): topics.append(l[2:]); continue
    de, tr = l.split("|"); S.append({"t": len(topics) - 1, "de": de, "tr": tr})
json.dump({"topics": topics, "s": S}, open("src/sent.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
