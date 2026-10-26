// Shared °F/°C display setting, remembered per browser. NOAA data stays in °F;
// pages convert only what they display.
let useC = (() => { try { return localStorage.getItem('units') === 'C' } catch (e) { return false } })();
const unit = () => useC ? 'C' : 'F';
const toT = f => useC ? Math.round((f - 32) * 50 / 9) / 10 : f;  // a temperature, e.g. a daily high
const toD = f => useC ? f * 5 / 9 : f;                            // a difference or trend (no offset)

// Day-count thresholds ("high/low at least X degrees above normal"), shared by both
// pages and kept in °F so switching units converts them instead of changing their meaning.
const thrF = (() => { const g = k => { try { return +localStorage.getItem('thr-' + k) || 10 } catch (e) { return 10 } }; return { h: g('h'), l: g('l') } })();
const thrShown = k => useC ? Math.round(thrF[k] * 50 / 9) / 10 : thrF[k];
function setThr(k, shown) {
  thrF[k] = useC ? shown * 9 / 5 : shown;
  try { localStorage.setItem('thr-' + k, thrF[k]) } catch (e) {}
}
// The editable number box plus a bold unit label, used inside headings and summary boxes.
const thrInput = k => '<input type="number" class="thr" data-thr="' + k + '" min="0" step="any" inputmode="decimal" aria-label="Degrees above normal" value="' + thrShown(k) + '"> <span class="u">°' + unit() + '</span>';

// Wire a button that flips the setting; onChange re-renders the page.
function unitButton(btn, onChange) {
  const label = () => { btn.textContent = useC ? 'Use Fahrenheit' : 'Use Celsius' };
  label();
  btn.addEventListener('click', () => {
    useC = !useC;
    try { localStorage.setItem('units', unit()) } catch (e) {}
    label(); onChange();
  });
}
