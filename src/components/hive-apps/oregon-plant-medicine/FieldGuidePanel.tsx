import { AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import { OREGON_PLANT_PDF_GUIDES } from '../../../lib/oregonPlantMedicine/guidePdfs';
import { LIVING_KNOWLEDGE_APP_NAME } from '../../../lib/oregonPlantMedicine/branding';

export default function FieldGuidePanel() {
  return (
    <div className="space-y-6 text-sm text-slate-300 leading-relaxed max-w-3xl">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-2">
          {LIVING_KNOWLEDGE_APP_NAME}
        </p>
        <p className="text-emerald-100/90">
          This is a <strong className="text-white">living knowledge base</strong> — starting in Oregon and open to new
          states as contributors document local edibles and homeopathic remedies. Share photos on plant pages, or tap{' '}
          <strong className="text-white">Contribute</strong> to publish new species and regions for everyone.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Important disclaimer
        </p>
        <p className="mt-2 text-amber-100/90">
          This library is for <strong>private educational use</strong> only. It is not medical advice. Never consume or
          apply a plant unless you are 100% certain of identification. Many edible plants have toxic look-alikes.
          Consult a qualified herbalist or healthcare provider before using plants medicinally.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-black text-white mb-2">Eugene &amp; Willamette Valley</h2>
        <p>
          The valley floor and coast-range foothills offer rich riparian corridors (Willamette River, Amazon Creek), oak
          savanna at Buford Park, and wetland edges perfect for nettle, miner&apos;s lettuce, Oregon grape, and
          cottonwood. Spring (March–May) is peak green foraging season.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-white mb-2">Florence &amp; Oregon Coast</h2>
        <p>
          From the Siuslaw River estuary to the Oregon Dunes, expect salal, evergreen huckleberry, beach strawberry,
          licorice fern on mossy maples, and chanterelles in fall. Coastal plants tolerate salt spray and sand — very
          different from valley species 60 miles inland.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-white mb-2">Edible wild foods — fruit &amp; preparation</h2>
        <p className="mb-3">
          Open the <strong className="text-lime-300">Edibles</strong> tab for the full wild-food library — berries,
          greens, mushrooms, and roots with three ID photos each. Below are seasonal highlights for Eugene and Florence.
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>
            <strong className="text-slate-200">Spring greens</strong> — nettle, miner&apos;s lettuce, chickweed,
            lamb&apos;s quarters, Douglas fir tips (April–May).
          </li>
          <li>
            <strong className="text-slate-200">Summer berries</strong> — salmonberry, thimbleberry, trailing blackberry,
            serviceberry, red huckleberry (May–August).
          </li>
          <li>
            <strong className="text-slate-200">Fall fruit &amp; fungi</strong> — evergreen huckleberry, salal, Nootka
            rose hips, chanterelles, and coastal crabapple jelly (Sep–Nov).
          </li>
          <li>
            <strong className="text-slate-200">Prep basics</strong> — cook all wild mushrooms; blanch nettle; strain rose
            hip hairs; never eat cattail from polluted water.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-white mb-2">Hallucinogenics — legal &amp; safety</h2>
        <p className="mb-3">
          The library includes a separate <strong className="text-violet-300">Hallucinogenic</strong> filter for
          psilocybin mushrooms, muscimol Amanita species, and deliriant plants documented in western Oregon. This is{' '}
          <strong className="text-slate-200">educational reference only</strong> — not encouragement to harvest or
          consume.
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>
            <strong className="text-slate-200">Oregon law</strong> — psilocybin is legal only in licensed service
            centers, not for casual wild foraging possession.
          </li>
          <li>
            <strong className="text-slate-200">Mushroom ID</strong> — wood-chip psilocybes have deadly Galerina lookalikes.
            Use spore prints and expert confirmation.
          </li>
          <li>
            <strong className="text-slate-200">Amanita</strong> — fly agaric and panther cap are not psilocybin; raw
            consumption causes severe poisoning.
          </li>
          <li>
            <strong className="text-slate-200">Jimsonweed</strong> — extremely dangerous deliriant; never ingest.
          </li>
        </ul>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {OREGON_PLANT_PDF_GUIDES.map((g) => (
            <a
              key={g.id}
              href={g.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors"
            >
              <FileText className="w-4 h-4 shrink-0" />
              {g.title}
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-black text-white mb-2">Holistic plant medicine basics</h2>
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>
            <strong className="text-slate-200">Food as medicine</strong> — nettle, dandelion, and berries nourish while
            supporting wellness.
          </li>
          <li>
            <strong className="text-slate-200">Bitter tonics</strong> — Oregon grape root stimulates digestion (use
            sustainably).
          </li>
          <li>
            <strong className="text-slate-200">First-aid plants</strong> — yarrow and plantain for minor wounds on the
            trail.
          </li>
          <li>
            <strong className="text-slate-200">Mushrooms</strong> — always confirm with expert ID; chanterelle vs.
            jack-o-lantern is life or death.
          </li>
          <li>
            <strong className="text-slate-200">Sustainable harvest</strong> — take less than 10%, never uproot unless
            abundant, know land rules.
          </li>
        </ul>
      </section>
    </div>
  );
}
