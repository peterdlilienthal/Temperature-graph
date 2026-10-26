// Shared °F/°C display setting, remembered per browser. NOAA data stays in °F;
// pages convert only what they display.
let useC = (() => { try { return localStorage.getItem('units') === 'C' } catch (e) { return false } })();
const unit = () => useC ? 'C' : 'F';
const toT = f => useC ? Math.round((f - 32) * 50 / 9) / 10 : f;  // a temperature, e.g. a daily high
const toD = f => useC ? f * 5 / 9 : f;                            // a difference or trend (no offset)

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
