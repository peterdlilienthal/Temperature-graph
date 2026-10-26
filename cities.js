// Shared by index.html and trends.html.
// [short code (used in page URLs), city, state, year ranges with a (near-)complete daily max/min record, ACIS station uid]
// Data requests use the uid: a short code like "NYC" can resolve to a different station for older dates.
const CITIES=[
["ABQ","Albuquerque","NM",[[1892,2026]],19376],["ANC","Anchorage","AK",[[1953,2026]],20705],["ATL","Atlanta","GA",[[1929,2026]],5061],["AUS","Austin","TX",[[1943,1945],[1947,1995],[1998,2026]],23174],
["BWI","Baltimore","MD",[[1951,2026]],31771],["BIL","Billings","MT",[[1935,2026]],11775],["BHM","Birmingham","AL",[[1930,2026]],686],["BOI","Boise","ID",[[1940,2026]],5357],
["BOS","Boston","MA",[[1936,2026]],9053],["BUF","Buffalo","NY",[[1939,2026]],18795],["BTV","Burlington","VT",[[1941,2026]],29699],["CHS","Charleston","SC",[[1937,2026]],29881],
["CLT","Charlotte","NC",[[1940,1941],[1944,2026]],13022],["CYS","Cheyenne","WY",[[1936,2026]],21243],["ORD","Chicago","IL",[[1959,2026]],48],["CVG","Cincinnati","OH",[[1948,2026]],8337],
["CLE","Cleveland","OH",[[1939,2026]],14771],["CMH","Columbus","OH",[[1948,2026]],14532],["DFW","Dallas–Fort Worth","TX",[[1974,2026]],29755],["DEN","Denver","CO",[[1995,2026]],137],
["DSM","Des Moines","IA",[[1940,2026]],6771],["DTW","Detroit","MI",[[1959,2026]],9705],["ELP","El Paso","TX",[[1939,2026]],23637],["FAR","Fargo","ND",[[1942,2026]],77],
["FAT","Fresno","CA",[[1948,2026]],31780],["BDL","Hartford","CT",[[1949,2026]],29569],["HNL","Honolulu","HI",[[1943,1947],[1950,2026]],22130],["IAH","Houston","TX",[[1970,2026]],23093],
["IND","Indianapolis","IN",[[1943,2026]],6324],["JAX","Jacksonville","FL",[[1939,2026]],31797],["MCI","Kansas City","MO",[[1973,2026]],11479],["LAS","Las Vegas","NV",[[1949,2026]],17912],
["LIT","Little Rock","AR",[[1880,1897],[1939,2026]],961],["LAX","Los Angeles","CA",[[1936,2026]],1978],["SDF","Louisville","KY",[[1946,2026]],31802],["MEM","Memphis","TN",[[1940,2026]],17025],
["MIA","Miami","FL",[[1937,2026]],4451],["MKE","Milwaukee","WI",[[1939,2026]],29852],["MSP","Minneapolis","MN",[[1939,2026]],10410],["BNA","Nashville","TN",[[1940,2026]],29871],
["MSY","New Orleans","LA",[[1947,2026]],9580],["NYC","New York (Central Park)","NY",[[1869,2026]],18345],["OKC","Oklahoma City","OK",[[1948,2026]],92],["OMA","Omaha","NE",[[1936,2026]],29584],
["MCO","Orlando","FL",[[1953,1970],[1974,2026]],4636],["PHL","Philadelphia","PA",[[1941,2026]],95],["PHX","Phoenix","AZ",[[1934,1934],[1938,1938],[1941,1944],[1948,2026]],1403],["PIT","Pittsburgh","PA",[[1948,2026]],15920],
["PWM","Portland","ME",[[1941,2026]],9443],["PDX","Portland","OR",[[1939,2026]],29598],["PVD","Providence","RI",[[1933,2026]],16376],["RDU","Raleigh","NC",[[1945,2026]],13223],
["RNO","Reno","NV",[[1937,2026]],34732],["RIC","Richmond","VA",[[1930,2026]],25365],["SAC","Sacramento","CA",[[1948,2026]],2971],["STL","St. Louis","MO",[[1930,2026]],11398],
["SLC","Salt Lake City","UT",[[1929,2026]],24790],["SAT","San Antonio","TX",[[1943,2026]],22975],["SAN","San Diego","CA",[[1940,2026]],13],["SFO","San Francisco","CA",[[1946,2026]],16],
["SEA","Seattle","WA",[[1945,2026]],25978],["FSD","Sioux Falls","SD",[[1893,2026]],16707],["GEG","Spokane","WA",[[1881,2026]],29736],["TPA","Tampa","FL",[[1939,2026]],4604],
["TUS","Tucson","AZ",[[1949,2026]],29687],["DCA","Washington","DC",[[1942,2026]],25528],["ICT","Wichita","KS",[[1954,2026]],57]];

// Fetch from NOAA's ACIS service. Failures are tagged (kind: 'network' or 'noaa') so the
// pages can tell a NOAA or connection problem apart from a bug in the page itself.
async function fetchACIS(body) {
  const fail = (kind, msg) => Object.assign(new Error(msg), { kind });
  let r;
  try {
    r = await fetch('https://data.rcc-acis.org/StnData', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (e) { throw fail('network', e.message) }
  if (!r.ok) throw fail('noaa', 'NOAA server returned ' + r.status);
  let j;
  try { j = await r.json() } catch (e) { throw fail('noaa', 'unreadable reply from NOAA') }
  if (j.error && !/no data/i.test(j.error)) throw fail('noaa', j.error); // "no data" = an empty result
  return j;
}

// Message for a failed load: what went wrong and what the visitor can do about it.
function loadError(e, what) {
  if (e.kind === 'network') return 'Could not reach the NOAA data service. Check your internet connection and try again.';
  if (e.kind === 'noaa') return 'NOAA could not provide data for ' + what + ' (' + e.message + '). Try another year or city.';
  return 'This page did not load completely (' + e.message + '). Reload the page with Ctrl+F5 (Cmd+Shift+R on a Mac).';
}
