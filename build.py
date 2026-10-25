"""Denver daily temperature departures from normal.

Downloads daily high/low for Denver International Airport (KDEN) plus NOAA's
1991-2020 daily normals from the ACIS web service, then writes:
  denver_temps.csv            - one row per day (actual, normal, difference)
  denver_temp_anomaly.html    - interactive chart (open in any browser)

Usage:  python build.py [year]      (default: current year, through yesterday)
"""
import csv, datetime as dt, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
year = int(sys.argv[1]) if len(sys.argv) > 1 else dt.date.today().year
end = min(dt.date(year, 12, 31), dt.date.today() - dt.timedelta(days=1))

query = {"sid": "DEN", "sdate": f"{year}-01-01", "edate": end.isoformat(),
         "elems": [{"name": "maxt"}, {"name": "mint"},
                   {"name": "maxt", "normal": "1"}, {"name": "mint", "normal": "1"}]}
req = urllib.request.Request("https://data.rcc-acis.org/StnData", data=json.dumps(query).encode(),
                             headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=60) as r:
    resp = json.load(r)
with open(os.path.join(HERE, 'acis.json'), 'w') as f:
    json.dump(resp, f)

def num(s):
    try: return float(s)
    except ValueError: return None  # 'M' = missing

rows = []
for t, h, l, nh, nl in resp['data']:
    h, l, nh, nl = map(num, (h, l, nh, nl))
    if None in (h, l, nh, nl): print('missing', t); continue
    doy = dt.date.fromisoformat(t).timetuple().tm_yday
    rows.append(dict(d=t, doy=doy, h=h, l=l, nh=nh, nl=nl, dh=round(h-nh, 1), dl=round(l-nl, 1)))

with open(os.path.join(HERE, 'denver_temps.csv'), 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['date', 'day_of_year', 'high_F', 'normal_high_F', 'high_diff_F',
                'low_F', 'normal_low_F', 'low_diff_F'])
    w.writerows([r['d'], r['doy'], r['h'], r['nh'], r['dh'], r['l'], r['nl'], r['dl']] for r in rows)

mh = sum(r['dh'] for r in rows)/len(rows); ml = sum(r['dl'] for r in rows)/len(rows)
print(f"{len(rows)} days through {rows[-1]['d']}: highs {mh:+.1f} F, lows {ml:+.1f} F vs normal")

html = (open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
        .replace('Denver 2026', f'Denver {year}')
        .replace('__DATA__', json.dumps(rows)).replace('__MH__', f'{mh:+.1f}')
        .replace('__ML__', f'{ml:+.1f}').replace('__LAST__', rows[-1]['d']))
head = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'
with open(os.path.join(HERE, 'denver_temp_anomaly.html'), 'w', encoding='utf-8') as f:
    f.write(head + html)
