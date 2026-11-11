import pictures from "./picture-index.json";

const painted = [
  "der Apfel", "die Banane", "das Brot", "der Kaffee",
  "das Haus", "das Fahrrad", "der Stuhl", "das Buch",
  "die Katze", "der Hund", "der Baum", "die Sonne",
  "die Birne", "die Zitrone", "die Erdbeere", "die Karotte"
];
export const hasPainting = word => painted.includes(word.de);

const quantities = {
  elf: "11", zwölf: "12", dreizehn: "13", vierzehn: "14", fünfzehn: "15",
  sechzehn: "16", siebzehn: "17", achtzehn: "18", neunzehn: "19", zwanzig: "20",
  einundzwanzig: "21", zweiundzwanzig: "22", dreißig: "30", vierzig: "40",
  fünfzig: "50", sechzig: "60", siebzig: "70", achtzig: "80", neunzig: "90",
  hunderteins: "101", zweihundert: "200", tausend: "1.000", "das Viertel": "¼",
  "die Hälfte": "½", "der Zentimeter": "cm", "der Kilometer": "km",
  "der Quadratmeter": "m²", "der Liter": "L", "das Gramm": "g", "das Prozent": "%"
};

export const hasPicture = word => Boolean(word.e || hasPainting(word) || quantities[word.de]);

export function Picture({ word, size = "" }) {
  if (quantities[word.de]) return <span className={"quantity " + size} aria-label={word.tr}>{quantities[word.de]}</span>;
  const illustration = painted.indexOf(word.de);
  const index = illustration >= 0 ? illustration : pictures[word.e];
  if (index == null) return <span className={'native-picture ' + size} aria-label={word.tr}>{word.e}</span>;
  const cols = illustration >= 0 ? 4 : 32;
  return <span role="img" aria-label={word.tr} className={'picture ' + size + (illustration >= 0 ? ' painted' : '')}
    style={{ backgroundPosition: ((index % cols) * 100 / (cols - 1)) + '% ' + (Math.floor(index / cols) * 100 / (cols - 1)) + '%' }} />;
}

export function Vis({ w, big }) {
  if (hasPicture(w)) return <Picture word={w} size={big ? "large" : ""} />;
  return <span className={big ? "bigtr" : "trv"}>{w.tr}</span>;
}

export function SampleCards() {
  return <div className="sample-cards" aria-hidden="true">
    {["das Buch","der Apfel","das Fahrrad"].map(de => <div className="sample" key={de}><Picture word={{de}}/><i>{de}</i></div>)}
  </div>;
}
