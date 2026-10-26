"""Build all-cities.json: year-by-year totals across every city in cities.js.

The trends page's "All cities (aggregated)" option reads this file for complete
years and fetches the current year (and any year newer than the file) live from
NOAA, reducing it the same way as reduce_city_year() below.

Run it again from time to time (e.g. each January) to fold the last complete year
into the file and pick up NOAA corrections:   python build_all_cities.py
"""
import datetime as dt, json, os, re, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
THIS_YEAR = dt.date.today().year
MIN_DAYS = 300   # same rule as the per-city charts: a year needs 300+ complete days


def cities():
    src = open(os.path.join(HERE, 'cities.js'), encoding='utf-8').read()
    return [(m[0], int(m[1])) for m in re.findall(r'\["([A-Z]{3})","[^"]+","[A-Z]{2}",\[\[.*?\]\],(\d+)\]', src)]


def fetch(uid):
    body = {"uid": uid, "sdate": "por", "edate": "por",
            "elems": [{"name": "maxt"}, {"name": "mint"}, {"name": "maxt", "normal": "1"}, {"name": "mint", "normal": "1"}]}
    req = urllib.request.Request("https://data.rcc-acis.org/StnData", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r).get("data", [])


def reduce_city_year(days):
    """days: list of (dh, dl) integer °F departures for one city-year."""
    dh = [d[0] for d in days]; dl = [d[1] for d in days]
    hist = lambda v: [sum(1 for x in v if x >= k) for k in range(0, max(max(v), 0) + 1)]  # hist[k] = days >= k
    return {"n": len(days), "sdh": sum(dh), "sdl": sum(dl), "ph": sum(x > 0 for x in dh), "pl": sum(x > 0 for x in dl),
            "mx": max(dh), "mn": min(dl), "hh": hist(dh), "hl": hist(dl)}


def add(total, r):
    for k in ("n", "sdh", "sdl", "ph", "pl", "mx", "mn"):
        total[k] = total.get(k, 0) + r[k]
    for k in ("hh", "hl"):
        t = total.setdefault(k, [])
        t.extend([0] * (len(r[k]) - len(t)))
        for i, v in enumerate(r[k]):
            t[i] += v
    total["c"] = total.get("c", 0) + 1


def main():
    cs = cities()
    with ThreadPoolExecutor(8) as ex:
        data = dict(zip([c[0] for c in cs], ex.map(lambda c: fetch(c[1]), cs)))
    years = {}
    for sid, rows in data.items():
        by = {}
        for d, h, l, nh, nl in rows:
            try:
                h, l, nh, nl = int(h), int(l), int(nh), int(nl)
            except ValueError:
                continue  # 'M' = missing
            by.setdefault(int(d[:4]), []).append((h - nh, l - nl))
        for y, days in by.items():
            if y < THIS_YEAR and len(days) >= MIN_DAYS:
                add(years.setdefault(y, {"y": y}), reduce_city_year(days))
    out = [years[y] for y in sorted(years)]
    with open(os.path.join(HERE, 'all-cities.json'), 'w') as f:
        json.dump({"built": dt.date.today().isoformat(), "cities": len(cs), "years": out}, f, separators=(',', ':'))
    for r in out:
        print(r["y"], r["c"], end='  |  ' if r["y"] % 8 else '\n')
    print('\nwrote all-cities.json:', len(out), 'years', os.path.getsize(os.path.join(HERE, 'all-cities.json')), 'bytes')


if __name__ == '__main__':
    main()
