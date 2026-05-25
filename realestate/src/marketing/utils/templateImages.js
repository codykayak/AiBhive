/** Shared Template assets (public/Template). City/calculator images use filename fallbacks. */

export const images = {
  hero: '/Template/nwinvestor hero background invester properties oregon.png',
  logo: '/Template/NW Investor logo.png',
  seller: '/Template/happy house seller for cash eugene springfield.png',
  sellerAlt: '/Template/happy seller hose chash eugene spring field off market.png',
  mapApp: '/Template/nwinvestor map application.png',
  mapInv: '/Template/investor map application nw investor.png',
  cityMap: '/Template/we buy house Eugene springfield corvallis Bend Rosburg florance oregon.png',
  affidavit: '/Template/affidavit of heirship oregon .png',
  video: '/Template/nwinvestor real estate properties oregon.mp4',
};

/** Images whose filenames start with "Calculato" (user upload). */
export function calculatorImageCandidates() {
  return [
    '/Template/Calculato instant cash offer calculator oregon.png',
    '/Template/Calculato cash offer calculator.png',
    '/Template/Calculato.png',
    images.seller,
  ];
}

/** Per-city hero: filename should include the city name (user uploads). */
export function cityImageCandidates(cityName) {
  const c = cityName.trim();
  return [
    `/Template/${c} Oregon we buy houses.png`,
    `/Template/${c} we buy houses oregon.png`,
    `/Template/We buy houses ${c} Oregon.png`,
    `/Template/${c}.png`,
    images.cityMap,
    images.hero,
  ];
}

export const PHONE_DISPLAY = '(541) 321-2630';
export const PHONE_TEL = '+15413212630';
export const SITE_URL = 'https://realestate.aibhive.com';
