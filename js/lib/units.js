/**
 * Unit conversion tables. Each unit stores its factor relative to the category's base unit.
 */

const US_GALLON_L = 3.785411784;
const LB_KG = 0.45359237;
const FL_OZ_L = US_GALLON_L / 128;
const ACRE_M2 = 4046.8564224;

export const CATEGORIES = {
  length: {
    label: 'Length',
    units: {
      mm: ['Millimeter', 0.001],
      cm: ['Centimeter', 0.01],
      m: ['Meter', 1],
      km: ['Kilometer', 1000],
      in: ['Inch', 0.0254],
      ft: ['Foot', 0.3048],
      yd: ['Yard', 0.9144],
      mi: ['Mile', 1609.344],
      nmi: ['Nautical mile', 1852],
    },
  },
  mass: {
    label: 'Mass',
    units: {
      mg: ['Milligram', 1e-6],
      g: ['Gram', 0.001],
      kg: ['Kilogram', 1],
      t: ['Metric ton', 1000],
      oz: ['Ounce', LB_KG / 16],
      lb: ['Pound', LB_KG],
      st: ['Stone', LB_KG * 14],
    },
  },
  volume: {
    label: 'Volume (US)',
    units: {
      ml: ['Milliliter', 0.001],
      l: ['Liter', 1],
      tsp: ['Teaspoon', FL_OZ_L / 6],
      tbsp: ['Tablespoon', FL_OZ_L / 2],
      floz: ['Fluid ounce', FL_OZ_L],
      cup: ['Cup', US_GALLON_L / 16],
      pt: ['Pint', US_GALLON_L / 8],
      qt: ['Quart', US_GALLON_L / 4],
      gal: ['Gallon', US_GALLON_L],
    },
  },
  area: {
    label: 'Area',
    units: {
      cm2: ['Square centimeter', 1e-4],
      m2: ['Square meter', 1],
      ha: ['Hectare', 10_000],
      km2: ['Square kilometer', 1e6],
      in2: ['Square inch', 0.0254 ** 2],
      ft2: ['Square foot', 0.3048 ** 2],
      ac: ['Acre', ACRE_M2],
      mi2: ['Square mile', 1609.344 ** 2],
    },
  },
  speed: {
    label: 'Speed',
    units: {
      ms: ['Meters per second', 1],
      kmh: ['Kilometers per hour', 1 / 3.6],
      mph: ['Miles per hour', 0.44704],
      kn: ['Knot', 1852 / 3600],
      fts: ['Feet per second', 0.3048],
    },
  },
  time: {
    label: 'Time',
    units: {
      ms: ['Millisecond', 0.001],
      s: ['Second', 1],
      min: ['Minute', 60],
      h: ['Hour', 3600],
      d: ['Day', 86_400],
      wk: ['Week', 604_800],
      yr: ['Year (365.25 days)', 31_557_600],
    },
  },
  data: {
    label: 'Digital storage',
    units: {
      bit: ['Bit', 0.125],
      B: ['Byte', 1],
      KB: ['Kilobyte (1000 B)', 1e3],
      MB: ['Megabyte', 1e6],
      GB: ['Gigabyte', 1e9],
      TB: ['Terabyte', 1e12],
      KiB: ['Kibibyte (1024 B)', 1024],
      MiB: ['Mebibyte', 1024 ** 2],
      GiB: ['Gibibyte', 1024 ** 3],
      TiB: ['Tebibyte', 1024 ** 4],
    },
  },
  temperature: {
    label: 'Temperature',
    units: { C: ['Celsius', null], F: ['Fahrenheit', null], K: ['Kelvin', null] },
  },
};

const toKelvin = { C: (v) => v + 273.15, F: (v) => ((v - 32) * 5) / 9 + 273.15, K: (v) => v };
const fromKelvin = { C: (v) => v - 273.15, F: (v) => ((v - 273.15) * 9) / 5 + 32, K: (v) => v };

/**
 * Convert a value between two units of the same category.
 * @param {string} category Key of CATEGORIES.
 * @param {string} from Unit key.
 * @param {string} to Unit key.
 * @param {number} value
 */
export function convertUnit(category, from, to, value) {
  const spec = CATEGORIES[category];
  if (!spec || !(from in spec.units) || !(to in spec.units)) throw new RangeError('Unknown unit.');
  if (category === 'temperature') return fromKelvin[to](toKelvin[from](value));
  return (value * spec.units[from][1]) / spec.units[to][1];
}
