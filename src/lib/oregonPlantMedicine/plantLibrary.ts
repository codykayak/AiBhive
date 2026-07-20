import type { PlantEntry, PlantImage, ResourceCategory } from './types';

function gallery(
  id: string,
  credit: string,
  captions: [string, string] = ['Habitat & growth habit', 'Flowers, fruit, or ID detail'],
): Pick<PlantEntry, 'imageUrl' | 'imageCredit' | 'additionalImages'> {
  return {
    imageUrl: `/oregon-plant-medicine/${id}.jpg`,
    imageCredit: credit,
    additionalImages: [
      { url: `/oregon-plant-medicine/${id}-2.jpg`, credit, caption: captions[0] },
      { url: `/oregon-plant-medicine/${id}-3.jpg`, credit, caption: captions[1] },
    ],
  };
}

/** Curated Pacific Northwest plants — Eugene (Willamette Valley) & Florence (Oregon Coast). Private reference library. */
export const PLANT_LIBRARY: PlantEntry[] = [
  {
    id: 'stinging-nettle',
    commonName: 'Stinging Nettle',
    scientificName: 'Urtica dioica',
    alsoKnownAs: ['Common nettle'],
    uses: 'both',
    category: 'herb',
    regions: ['both'],
    habitat: 'Rich moist soil along streams, ditches, forest edges, and disturbed ground. Very common near Eugene waterways and coast range valleys toward Florence.',
    identification: 'Opposite serrated leaves with stinging hairs on stems and undersides. Square stems. Can reach 3–6 ft when flowering. Crushing or drying removes the sting.',
    lookalikes: [
      'White dead-nettle (Lamium album) — similar leaf shape but NO sting; square stem, white flowers.',
      'Wood nettle (Laportea canadensis) — alternate leaves with sting; less common in Oregon.',
      'Clearweed (Pilea pumila) — nettle-like but stingless and translucent stem.',
    ],
    edibleNotes: 'One of the most nutritious wild greens in the PNW. Young tops in spring taste like spinach. High in iron, calcium, and protein.',
    medicinalNotes: 'Traditional support for seasonal allergies, joint comfort, and nourishing tonics. Often used as dried leaf tea or tincture.',
    holisticNotes: 'A cornerstone “food as medicine” plant in Pacific Northwest herbalism — nutrient-dense and broadly tonifying.',
    preparation: 'Blanch or dry to neutralize sting. Tea, soup, pesto (blanched), or capsules from dried leaf.',
    harvestSeason: 'Young shoots: March–May. Handle with gloves.',
    safetyWarnings: [
      'Fresh stingers cause welts — always wear gloves when harvesting.',
      'Avoid during pregnancy unless guided by a qualified herbalist.',
    ],
    ...gallery('stinging-nettle', 'Wikimedia Commons — Urtica dioica'),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/URDI' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Urtica_dioica' },
      { label: 'OSU Extension — Wild harvesting', url: 'https://extension.oregonstate.edu/' },
    ],
  },
  {
    id: 'oregon-grape',
    commonName: 'Oregon Grape',
    scientificName: 'Mahonia aquifolium',
    alsoKnownAs: ['Tall Oregon grape'],
    uses: 'both',
    category: 'shrub',
    regions: ['eugene', 'both'],
    habitat: 'Dry to moist woodland understory throughout the Willamette Valley and coast range foothills.',
    identification: 'Spiny holly-like evergreen leaflets in groups. Bright yellow flower clusters in early spring. Blue berries with whitish bloom in summer.',
    lookalikes: [
      'English holly (Ilex aquifolium) — invasive; red berries, not blue; alternate leaves on tree form.',
      'Tall Oregon grape vs. dull Oregon grape (M. nervosa) — both edible berries; low ground cover vs. shrub.',
      'Holly-leaved barberry — spiny but different flower and berry color.',
    ],
    edibleNotes: 'Berries are very tart — best as jelly, syrup, or mixed with sweeter fruit. Not a snacking berry.',
    medicinalNotes: 'Root and bark traditionally used as a bitter liver and digestive tonic. Contains berberine (similar action to goldenseal).',
    holisticNotes: 'Oregon’s state flower and a signature “bitter tonic” in Western herbal practice.',
    preparation: 'Berry: cook with sugar. Root: tincture or decoction (sustainably harvest only from abundant stands).',
    harvestSeason: 'Flowers: Feb–Apr. Berries: Jul–Aug. Root: late fall.',
    safetyWarnings: [
      'Do not confuse with invasive English holly.',
      'Berberine-containing plants may interact with medications — consult a practitioner.',
      'Never strip roots from wild populations.',
    ],
    ...gallery('oregon-grape', 'Wikimedia Commons — Mahonia aquifolium'),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/MAAQ' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mahonia_aquifolium' },
    ],
  },
  {
    id: 'salmonberry',
    commonName: 'Salmonberry',
    scientificName: 'Rubus spectabilis',
    uses: 'edible',
    category: 'berry',
    regions: ['both'],
    habitat: 'Stream banks, wetlands, and shady forest edges — abundant on the coast near Florence and in wet Willamette Valley corridors.',
    identification: 'Magenta flowers in spring. Compound leaves with three leaflets. Orange to red raspberry-like fruit.',
    lookalikes: [
      'Thimbleberry — soft red berry, huge maple-like leaves, no thorns.',
      'Unripe Himalayan or trailing blackberry — black when ripe; salmonberry is orange-red.',
      'Baneberry (Actaea) — white berries on thick stalk; TOXIC (rare in same habitat).',
    ],
    edibleNotes: 'Mild, slightly sweet-tart berries. Young shoots also peeled and eaten traditionally in spring.',
    medicinalNotes: 'Primarily food; berry antioxidants and seasonal nutrition.',
    holisticNotes: 'A reliable coast-range wild food — often one of the first berries of the season.',
    preparation: 'Eat fresh, jam, or dry. Young peeled shoots in spring.',
    harvestSeason: 'Berries: May–July depending on elevation.',
    safetyWarnings: ['Identify carefully vs. other Rubus species.'],
    ...gallery('salmonberry', 'Wikimedia Commons — Rubus spectabilis'),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/RUSP' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rubus_spectabilis' },
    ],
  },
  {
    id: 'salal',
    commonName: 'Salal',
    scientificName: 'Gaultheria shallon',
    uses: 'both',
    category: 'shrub',
    regions: ['florence', 'both'],
    habitat: 'Coastal conifer forest understory — dominant groundcover from Florence dunes inland and common in coast-range woods toward Eugene.',
    identification: 'Leathery evergreen oval leaves. Urn-shaped pink-white flowers. Dark blue-purple mealy berries.',
    lookalikes: [
      'Evergreen huckleberry — similar dark berries but toothed leaves and grows as upright shrub, not groundcover.',
      'Oregon grape berries — blue with bloom, very tart; compound holly-like leaves.',
      'Nightshade (Solanum) berries — potentially toxic; salal has urn flowers and mealy texture.',
    ],
    edibleNotes: 'Berries are sweet when fully ripe. Used in jams and pemmican traditionally.',
    medicinalNotes: 'Leaf tea used as an astringent mouth rinse and mild anti-inflammatory wash.',
    holisticNotes: 'Ubiquitous coast plant — berries are a staple wild food where salal thickets are dense.',
    preparation: 'Berries fresh or dried. Leaf tea for topical or gargle use.',
    harvestSeason: 'Berries: late summer–fall.',
    safetyWarnings: ['Leaves very astringent — don’t overconsume as tea.'],
    ...gallery('salal', 'Wikimedia Commons — Gaultheria shallon'),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/GASH' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Gaultheria_shallon' },
    ],
  },
  {
    id: 'miners-lettuce',
    commonName: "Miner's Lettuce",
    scientificName: 'Claytonia perfoliata',
    alsoKnownAs: ['Winter purslane'],
    uses: 'edible',
    category: 'herb',
    regions: ['eugene', 'both'],
    habitat: 'Cool moist shady spots, woodland edges, and spring gardens throughout the valley.',
    identification: 'Succulent leaves with a cup-like leaf bracketing the flower stem. Small white or pink flowers.',
    lookalikes: [
      'Spring beauty (Claytonia sibirica) — pink flowers, no perfoliate disk; also edible.',
      'Poison hemlock seedlings — NOT succulent; musty smell, hairless stems with purple blotches.',
      'Chickweed — mat-forming, no cup leaf; also edible.',
    ],
    edibleNotes: 'Mild, crunchy salad green — entire aerial parts edible. Excellent source of vitamin C.',
    medicinalNotes: 'Historically used by miners to prevent scurvy.',
    holisticNotes: 'One of the easiest beginner wild foods in Western Oregon spring.',
    preparation: 'Raw in salads or lightly wilted.',
    harvestSeason: 'Feb–May peak; fades in heat.',
    safetyWarnings: ['Avoid areas sprayed with herbicides (roadsides).'],
    ...gallery('miners-lettuce', 'Wikimedia Commons — Claytonia perfoliata'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Claytonia_perfoliata' },
    ],
  },
  {
    id: 'yarrow',
    commonName: 'Yarrow',
    scientificName: 'Achillea millefolium',
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat: 'Meadows, roadsides, dry fields, and disturbed sunny ground valley-wide and along the coast highway corridor.',
    identification: 'Feathery aromatic leaves. Flat-topped clusters of tiny white (sometimes pink) flowers. Distinct sage-like scent when crushed.',
    medicinalNotes: 'Classic first-aid herb — styptic powder from dried leaves for minor cuts. Tea for fever support and digestion.',
    holisticNotes: '“Soldier’s woundwort” — one of the most widely used medicinal herbs in European and Indigenous traditions.',
    preparation: 'Dried leaf and flower tea, poultice, or infused oil for topical use.',
    harvestSeason: 'Flower: Jun–Sep.',
    safetyWarnings: [
      'May cause contact dermatitis in sensitive people.',
      'Avoid internal use in pregnancy.',
      'Can potentiate sedatives in large doses.',
    ],
    ...gallery('yarrow', 'Wikimedia Commons — Achillea millefolium'),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/ACMI2' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Achillea_millefolium' },
    ],
  },
  {
    id: 'plantain',
    commonName: 'Broadleaf Plantain',
    scientificName: 'Plantago major',
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat: 'Lawns, trails, compacted soil — everywhere in Eugene and Florence.',
    identification: 'Low rosette of ribbed oval leaves with parallel veins. Slender seed spikes rise from center.',
    medicinalNotes: 'Fresh leaf poultice for bee stings, bites, and splinters. Mucilage soothes skin and mucous membranes.',
    holisticNotes: 'A “footpath medicine” — often right underfoot on hikes near Spencer Butte or coastal trails.',
    preparation: 'Chew fresh leaf for poultice or dry for tea.',
    harvestSeason: 'Spring through fall; best before seed stalk hardens.',
    safetyWarnings: ['Ensure correct ID — not lily or other lookalikes.'],
    ...gallery('plantain', 'Wikimedia Commons — Plantago major'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Plantago_major' },
    ],
  },
  {
    id: 'dandelion',
    commonName: 'Dandelion',
    scientificName: 'Taraxacum officinale',
    uses: 'both',
    category: 'herb',
    regions: ['both'],
    habitat: 'Lawns, fields, roadsides — ubiquitous.',
    identification: 'Toothed basal leaves, hollow stem, yellow composite flower, white puffball seed head.',
    lookalikes: [
      'Cat’s-ear (Hypochaeris) — hairy leaves, solid stem, branching flower stalks.',
      'Hawkweed (Hieracium) — similar yellow flowers but multiple blooms on branched stem.',
      'False dandelion — always check for hollow stem and single flower per hollow stalk.',
    ],
    edibleNotes: 'Young leaves in salad (bitter). Flowers for fritters. Roasted root as coffee substitute.',
    medicinalNotes: 'Bitter root and leaf support digestion and liver function. Gentle diuretic (“piss-a-bed”).',
    holisticNotes: 'Classic liver/spring tonic in Western herbalism.',
    preparation: 'Salad greens, root decoction, flower wine.',
    harvestSeason: 'Leaves: early spring. Roots: fall.',
    safetyWarnings: ['Only harvest from unsprayed areas.', 'Latex may irritate skin.'],
    ...gallery('dandelion', 'Wikimedia Commons — Taraxacum officinale'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Taraxacum_officinale' },
    ],
  },
  {
    id: 'red-clover',
    commonName: 'Red Clover',
    scientificName: 'Trifolium pratense',
    uses: 'both',
    category: 'herb',
    regions: ['eugene', 'both'],
    habitat: 'Meadows, pastures, and sunny fields in the Willamette Valley.',
    identification: 'Three leaflets with pale chevron. Round pink-purple flower heads.',
    lookalikes: [
      'White clover (T. repens) — white flower heads; also edible.',
      'Crown vetch — pink clusters on vine; NOT a true clover.',
      'Alsike clover — pale pink; can cause toxicity in livestock (rare in humans).',
    ],
    edibleNotes: 'Flower heads and young leaves in salads or tea.',
    medicinalNotes: 'Traditional support for skin health and menopausal comfort. Contains isoflavones.',
    holisticNotes: 'Gentle lymphatic and nutritive herb.',
    preparation: 'Dried blossom tea or fresh in salads.',
    harvestSeason: 'Late spring–summer flowers.',
    safetyWarnings: ['May affect hormone-sensitive conditions — consult practitioner.'],
    ...gallery('red-clover', 'Wikimedia Commons — Trifolium pratense'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Trifolium_pratense' },
    ],
  },
  {
    id: 'elderberry',
    commonName: 'Blue Elderberry',
    scientificName: 'Sambucus cerulea',
    alsoKnownAs: ['Mexican elderberry'],
    uses: 'both',
    category: 'shrub',
    regions: ['eugene', 'both'],
    habitat: 'Stream banks, open woods, and disturbed sunny edges in the valley.',
    identification: 'Opposite compound leaves. Large flat cream flower clusters. Powdery blue berries on reddish stems.',
    lookalikes: [
      'Red elderberry (S. racemosa) — red berry clusters on coast; TOXIC raw.',
      'Blue elder vs. red elder — blue powdery berries vs. upright red clusters.',
      'Hercules’ club / devil’s walking stick — similar flower shape but armed stems; berries different.',
    ],
    edibleNotes: 'Berries must be cooked — used for syrup, jam, and wine.',
    medicinalNotes: 'Cooked berry syrup traditionally used for immune support during cold season.',
    holisticNotes: 'One of the most popular home herbal preparations in North America.',
    preparation: 'Cook berries at least 20 minutes. Strain seeds. Syrup with honey.',
    harvestSeason: 'Flowers: May–Jun. Berries: Aug–Sep.',
    safetyWarnings: [
      'NEVER eat raw berries — nausea and worse.',
      'Red elderberry (S. racemosa) on coast is toxic — learn the difference.',
      'Leaves, bark, and seeds are toxic.',
    ],
    ...gallery('elderberry', 'Wikimedia Commons — Sambucus cerulea'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Sambucus_cerulea' },
    ],
  },
  {
    id: 'fireweed',
    commonName: 'Fireweed',
    scientificName: 'Chamerion angustifolium',
    alsoKnownAs: ['Willowherb'],
    uses: 'both',
    category: 'herb',
    regions: ['both'],
    habitat: 'Burn sites, roadsides, clearcuts, and open meadows — common coast to cascades.',
    identification: 'Tall spikes of magenta four-petaled flowers. Long narrow leaves. Fluffy seed parachutes.',
    lookalikes: [
      'Foxglove (Digitalis) — tall spike; TOXIC. Leaves wider, flowers tubular spotted.',
      'Purple loosestrife — invasive wetland spike; different leaf arrangement.',
      'Fireweed has 4 petals; many lookalikes have different flower counts.',
    ],
    edibleNotes: 'Young shoots peeled like asparagus. Leaves as cooked green. Honey from fireweed is prized.',
    medicinalNotes: 'Mucilaginous — soothing for irritated GI tract. Traditional anti-inflammatory.',
    holisticNotes: 'Pioneer species that heals disturbed land — symbolic in PNW ecology.',
    preparation: 'Peel young shoots; leaf tea; flower blossom garnish.',
    harvestSeason: 'Shoots: spring. Flowers: Jul–Aug.',
    safetyWarnings: ['Positive ID vs. other tall magenta spikes.'],
    ...gallery('fireweed', 'Wikimedia Commons — Chamerion angustifolium'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Chamerion_angustifolium' },
    ],
  },
  {
    id: 'licorice-fern',
    commonName: 'Licorice Fern',
    scientificName: 'Polypodium glycyrrhiza',
    uses: 'medicinal',
    category: 'fern',
    regions: ['florence', 'both'],
    habitat: 'Mossy tree trunks, rocks, and wet forest — very common in coast range and valley forests.',
    identification: 'Fronds from creeping rhizome on mossy maples and logs. Sweet licorice-scented rhizome when chewed.',
    medicinalNotes: 'Rhizome traditionally chewed for sore throat and cough — demulcent and sweet.',
    holisticNotes: 'Look up on big leaf maple trunks on hikes between Eugene and the coast.',
    preparation: 'Fresh or dried rhizome tea; chew small piece for throat.',
    harvestSeason: 'Year-round rhizome; take only small portions sustainably.',
    safetyWarnings: ['Overharvest damages host ecosystem — take sparingly.'],
    ...gallery('licorice-fern', 'Wikimedia Commons — Polypodium glycyrrhiza'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Polypodium_glycyrrhiza' },
    ],
  },
  {
    id: 'redwood-sorrel',
    commonName: 'Redwood Sorrel',
    scientificName: 'Oxalis oregana',
    uses: 'edible',
    category: 'herb',
    regions: ['florence', 'both'],
    habitat: 'Shady moist conifer forest floor — coast range and old growth near Florence.',
    identification: 'Three heart-shaped leaflets often folded. White to pink five-petaled flowers. Sour lemon taste.',
    lookalikes: [
      'Wood sorrel vs. clover — sorrel has heart-shaped leaflets in threes; clover has oval leaflets with chevron.',
      'Violet leaves — similar heart shape but no sour taste; different flowers.',
      'Redwood sorrel is Oxalis; do not confuse with shamrock clover for large harvests.',
    ],
    edibleNotes: 'Small amounts as trail nibble — oxalic acid gives sour flavor.',
    holisticNotes: 'Beautiful forest floor indicator species in coast range hikes.',
    preparation: 'Few leaves fresh — not large quantities.',
    harvestSeason: 'Spring–early summer.',
    safetyWarnings: [
      'High oxalates — avoid large amounts; kidney stone risk.',
      'Do not confuse with clover.',
    ],
    ...gallery('redwood-sorrel', 'Wikimedia Commons — Oxalis oregana'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Oxalis_oregana' },
    ],
  },
  {
    id: 'huckleberry',
    commonName: 'Evergreen Huckleberry',
    scientificName: 'Vaccinium ovatum',
    uses: 'edible',
    category: 'berry',
    regions: ['florence', 'both'],
    habitat: 'Coastal and low-elevation forest understory — Florence dunes forest and coast range.',
    identification: 'Leathery serrated evergreen leaves. Pink urn flowers. Dark purple-black sweet berries.',
    lookalikes: [
      'Salal — groundcover with similar dark berries; leathery entire leaves without serrations.',
      'Baldhip rose hips — red, not purple-black berries.',
      'Nightshade berries — grow in different plant form; always confirm serrated evergreen leaves.',
    ],
    edibleNotes: 'Excellent wild berry — fresh, jam, pancakes. Ripen further after picking.',
    holisticNotes: 'Coast range counterpart to valley black huckleberry species.',
    preparation: 'Fresh or cooked; freeze well.',
    harvestSeason: 'Late summer–fall.',
    safetyWarnings: ['Positive berry ID essential.'],
    ...gallery('huckleberry', 'Wikimedia Commons — Vaccinium ovatum'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Vaccinium_ovatum' },
    ],
  },
  {
    id: 'cottonwood',
    commonName: 'Black Cottonwood',
    scientificName: 'Populus trichocarpa',
    uses: 'medicinal',
    category: 'tree',
    regions: ['eugene', 'both'],
    habitat: 'River bottoms and wet lowland — Willamette River corridor and coastal river valleys.',
    identification: 'Large cottonwood with balsam-scented sticky buds in late winter. Heart-shaped toothed leaves.',
    medicinalNotes: 'Balm of Gilead — cottonwood buds infused in oil for salves on sore muscles and skin irritation.',
    holisticNotes: 'Late winter bud harvest is a traditional PNW herbalist ritual along the Willamette.',
    preparation: 'Collect fuzzy buds before leaf-out. Infuse in olive oil 4–6 weeks. Strain for salve.',
    harvestSeason: 'Buds: Feb–Mar before leaves open.',
    safetyWarnings: ['Tree identification only — do not girdle trees.'],
    ...gallery('cottonwood', 'Wikimedia Commons — Populus trichocarpa'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Populus_trichocarpa' },
    ],
  },
  {
    id: 'willow',
    commonName: 'Pacific Willow',
    scientificName: 'Salix lucida ssp. lasiandra',
    alsoKnownAs: ['Shining willow'],
    uses: 'medicinal',
    category: 'tree',
    regions: ['both'],
    habitat: 'Wetlands, stream banks, and lakeshores — common in Eugene wetlands and coastal estuaries near Florence.',
    identification: 'Flexible branches. Long narrow leaves often with silky undersides. Catkins in early spring.',
    medicinalNotes: 'Bark contains salicin (aspirin precursor). Traditional tea for pain and fever — bitter.',
    holisticNotes: 'The original “aspirin plant” — use with respect and medical awareness.',
    preparation: 'Bark tea from pruned twigs only — never ring-bark living trees.',
    harvestSeason: 'Bark: early spring on pruned material.',
    safetyWarnings: [
      'Avoid if allergic to aspirin.',
      'Not for children with viral illness (Reye syndrome risk with salicylates).',
      'Can interact with blood thinners.',
    ],
    ...gallery('willow', 'Wikimedia Commons — Salix lucida'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Salix_lucida' },
    ],
  },
  {
    id: 'self-heal',
    commonName: 'Self-Heal',
    scientificName: 'Prunella vulgaris',
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat: 'Lawns, meadows, and trail edges.',
    identification: 'Low plant with square stem. Purple tubular flowers in dense head. Lance-shaped leaves.',
    medicinalNotes: 'Traditional wound herb and throat-soothing tea. Mild antimicrobial reputation.',
    holisticNotes: 'Name says it all — common “lawyer’s woundwort” of European herbalism, naturalized in Oregon.',
    preparation: 'Tea from flowering tops; poultice.',
    harvestSeason: 'Summer flowering tops.',
    safetyWarnings: ['Generally mild — verify ID.'],
    ...gallery('self-heal', 'Wikimedia Commons — Prunella vulgaris'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Prunella_vulgaris' },
    ],
  },
  {
    id: 'cleavers',
    commonName: 'Cleavers',
    scientificName: 'Galium aparine',
    alsoKnownAs: ['Bedstraw', 'Goosegrass'],
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat: 'Moist shady edges, gardens, and stream banks.',
    identification: 'Square stem with whorled narrow leaves that cling (hooked hairs). Tiny white flowers.',
    medicinalNotes: 'Spring lymphatic tonic — fresh juice or tea. Traditional diuretic and skin support.',
    holisticNotes: 'Best used fresh in spring cleanse protocols in Western herbal tradition.',
    preparation: 'Cold infusion of fresh plant or juiced tops.',
    harvestSeason: 'Before flowering: Mar–May.',
    safetyWarnings: ['Diuretic — hydrate well. Avoid if pregnant.'],
    ...gallery('cleavers', 'Wikimedia Commons — Galium aparine'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Galium_aparine' },
    ],
  },
  {
    id: 'usnea',
    commonName: 'Usnea Lichen',
    scientificName: 'Usnea spp.',
    alsoKnownAs: ['Old man’s beard'],
    uses: 'medicinal',
    category: 'lichen',
    regions: ['florence', 'both'],
    habitat: 'Hanging from tree branches in moist clean air — coast range and valley forests after rain.',
    identification: 'Gray-green branched lichen with white elastic cord inside main stem when pulled apart.',
    medicinalNotes: 'Traditional antimicrobial for respiratory and urinary support. Usnic acid content.',
    holisticNotes: 'Harvest only from fallen branches after storms — sustainable practice.',
    preparation: 'Alcohol tincture or hot water decoction (strain well).',
    harvestSeason: 'Year-round on windfall after storms.',
    safetyWarnings: [
      'Liver toxicity possible with prolonged high-dose usnic acid — short-term use only.',
      'Never harvest from polluted areas.',
    ],
    ...gallery('usnea', 'Wikimedia Commons — Usnea'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Usnea' },
    ],
  },
  {
    id: 'turkey-tail',
    commonName: 'Turkey Tail',
    scientificName: 'Trametes versicolor',
    uses: 'medicinal',
    category: 'mushroom',
    regions: ['both'],
    habitat: 'Dead hardwood and conifer logs — everywhere in Oregon forests.',
    identification: 'Bracket fungus with concentric color bands. Underside white with tiny pores (not gills).',
    medicinalNotes: 'Immune-modulating polysaccharides (PSK/PSP) — studied extensively in Asia. Long decoction.',
    holisticNotes: 'One of the safest and most researched medicinal mushrooms for daily broth.',
    preparation: 'Slow simmer 1–4 hours for broth or dual-extract tincture.',
    harvestSeason: 'Year-round on logs.',
    safetyWarnings: [
      'Must be pore surface — not gilled mushrooms.',
      'Wild mushroom ID confidence required.',
    ],
    ...gallery('turkey-tail', 'Wikimedia Commons — Trametes versicolor'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Trametes_versicolor' },
    ],
  },
  {
    id: 'chanterelle',
    commonName: 'Pacific Golden Chanterelle',
    scientificName: 'Cantharellus formosus',
    uses: 'edible',
    category: 'mushroom',
    regions: ['florence', 'both'],
    habitat: 'Mossy conifer forest floor — coast range and valley foothills after fall rains.',
    identification: 'Golden funnel-shaped cap with false gills (forked ridges). Fruity apricot smell. No true gills.',
    lookalikes: [
      'Jack-o-lantern (Omphalotus) — grows in clusters on wood; TRUE gills; ORANGE bioluminescent; causes severe GI illness.',
      'False chanterelle (Hygrophoropsis aurantiaca) — true thin gills, softer flesh, no apricot scent.',
      'Woolly chanterelle (Turbinellus floccosus) — vase-shaped with woolly cap; causes GI upset for many.',
    ],
    edibleNotes: 'Oregon state mushroom. Premier wild edible — sauté, dry, freeze.',
    holisticNotes: 'Fall mushroom hunting is a PNW tradition from Eugene foothills to coast range near Florence.',
    preparation: 'Cook thoroughly. Never eat raw wild mushrooms.',
    harvestSeason: 'Oct–Dec after rains.',
    safetyWarnings: [
      'DEADLY lookalike: Jack-o-lantern (Omphalotus) — learn false gills vs. true gills.',
      'Always confirm with experienced forager first season.',
    ],
    ...gallery('chanterelle', 'Wikimedia Commons — Cantharellus formosus'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Cantharellus_formosus' },
      { label: 'Oregon State Mushroom', url: 'https://en.wikipedia.org/wiki/Cantharellus_formosus' },
    ],
  },
  {
    id: 'beach-strawberry',
    commonName: 'Beach Strawberry',
    scientificName: 'Fragaria chiloensis',
    uses: 'edible',
    category: 'herb',
    regions: ['florence'],
    habitat: 'Coastal sand dunes and bluffs — Florence to Oregon Dunes National Recreation Area.',
    identification: 'Three toothed leaflets, runners on sand. Small sweet white-flowered berries close to ground.',
    lookalikes: [
      'Wild strawberry (F. virginiana) — inland; similar but often in forest edges not dunes.',
      'Mock strawberry (Duchesnea) — yellow flowers, bland/hollow berry; not sweet.',
      'Cinquefoil — five leaflets, yellow flowers; not a true strawberry.',
    ],
    edibleNotes: 'Tiny intense strawberries — best trail snack on dune walks.',
    holisticNotes: 'Coast-specific wild food not found inland in Eugene.',
    preparation: 'Eat fresh.',
    harvestSeason: 'Late spring–summer.',
    safetyWarnings: ['Stay on trails in dune habitat — fragile ecosystem.'],
    ...gallery('beach-strawberry', 'Wikimedia Commons — Fragaria chiloensis'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fragaria_chiloensis' },
    ],
  },
  {
    id: 'douglas-fir-tip',
    commonName: 'Douglas Fir Spring Tips',
    scientificName: 'Pseudotsuga menziesii',
    uses: 'both',
    category: 'tree',
    regions: ['both'],
    habitat: 'Dominant conifer from valley floor to coast — everywhere.',
    identification: 'Soft bright green new growth tips in spring. Distinct bracts on cones (“mouse tail and legs”).',
    lookalikes: [
      'Western yew (Taxus brevifolia) — TOXIC; flat dark green needles, red cup berry, no pine-like cones.',
      'Spruce/hemlock tips — edible in tea but different needle arrangement and cone type.',
      'Only harvest from true Douglas fir with the three-pronged bracts on cones.',
    ],
    edibleNotes: 'Citrus-pine flavored tips for tea, syrup, and seasoning. High vitamin C.',
    medicinalNotes: 'Resinous tea for congestion. Traditional respiratory support.',
    holisticNotes: 'Signature tree of the PNW — spring tip harvest connects you to forest seasonality.',
    preparation: 'Tea, infused honey, or dried for winter.',
    harvestSeason: 'Soft tips: Apr–May only.',
    safetyWarnings: ['Avoid yew (toxic) — flat needles, red cup on berry.'],
    ...gallery('douglas-fir-tip', 'Wikimedia Commons — Pseudotsuga menziesii'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Pseudotsuga_menziesii' },
    ],
  },
  {
    id: 'nootka-rose',
    commonName: 'Nootka Rose',
    scientificName: 'Rosa nutkana',
    uses: 'both',
    category: 'shrub',
    regions: ['both'],
    habitat: 'Stream banks, roadsides, and open sunny areas valley and coast.',
    identification: 'Pink five-petaled flowers. Thorns on stems. Large red rose hips in fall.',
    lookalikes: [
      'Baldhip rose (R. gymnocarpa) — hips lose sepals early; also edible with same hair caution.',
      'Himalayan blackberry — thorny but compound leaves and aggregate fruit, not rose hips.',
      'Any rose hip has irritating hairs inside — strain all preparations.',
    ],
    edibleNotes: 'Rose hips extremely high in vitamin C — tea and jelly. Petals for garnish.',
    medicinalNotes: 'Astringent hip tea for digestive and skin support.',
    holisticNotes: 'Fall hip harvest along Willamette paths and coastal trails.',
    preparation: 'Remove seeds/hairs from hips before eating. Tea or syrup.',
    harvestSeason: 'Flowers: May–Jun. Hips: after first frost.',
    safetyWarnings: ['Irritating hairs inside hips — strain well.'],
    ...gallery('nootka-rose', 'Wikimedia Commons — Rosa nutkana'),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rosa_nutkana' },
    ],
  },
  {
    id: 'horsetail',
    commonName: 'Horsetail',
    scientificName: 'Equisetum arvense',
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat: 'Sandy wet soils, roadsides, and disturbed ground.',
    identification: 'Jointed hollow stems with whorled branches. Silica-rich. Two stages: fertile brown cone stage and green vegetative.',
    medicinalNotes: 'High silica — traditional use for hair, skin, nails, and connective tissue support.',
    holisticNotes: 'Ancient plant lineage — use short-term only in modern herbal practice.',
    preparation: 'Long decoction of dried sterile stems. Never raw.',
    harvestSeason: 'Summer green stems.',
    safetyWarnings: [
      'Contains thiaminase — long-term use may deplete B1.',
      'Avoid in pregnancy and with alcoholism.',
      'Contains nicotine — not for children.',
    ],
    ...gallery('horsetail', 'Wikimedia Commons — Equisetum arvense', [
      'Sterile green stems',
      'Fertile brown cone stage',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Equisetum_arvense' },
    ],
  },

  // ——— Edible wild foods (Eugene & Florence) ———
  {
    id: 'thimbleberry',
    commonName: 'Thimbleberry',
    scientificName: 'Rubus parviflorus',
    uses: 'edible',
    category: 'berry',
    regions: ['both'],
    habitat:
      'Openings, stream banks, and forest edges from Willamette Valley foothills to coast range near Florence. Large soft maple-like leaves on thornless stems.',
    identification:
      'Huge velvety 5-lobed maple-shaped leaves. White flowers in spring. Bright red soft berries that pull off like a thimble. No thorns.',
    lookalikes: [
      'Salmonberry — orange to red berry, magenta flowers, three leaflets (not maple-shaped).',
      'Himalayan blackberry — thorny canes; hard black fruit, not soft thimble.',
      'Baneberry — white toxic berries on thick stalk; completely different leaf shape.',
    ],
    edibleNotes:
      'One of the best fresh-eating trail berries in the PNW — soft, tart-sweet, doesn’t ship so you rarely see it in stores. Jam and sauce within hours of picking.',
    holisticNotes: 'Classic coast-to-valley summer berry — often growing with salmonberry on the same hike.',
    preparation: 'Eat fresh, freezer jam, or cook into sauce. Too delicate to dry well.',
    harvestSeason: 'Berries: July–August. Young shoots peeled in spring (traditional).',
    safetyWarnings: ['Positive Rubus ID — no thorns distinguishes from blackberries.'],
    ...gallery('thimbleberry', 'Wikimedia Commons — Rubus parviflorus', [
      'Large maple-like leaves',
      'Red thimble fruits',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/RUPA2' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rubus_parviflorus' },
    ],
  },
  {
    id: 'trailing-blackberry',
    commonName: 'Trailing Blackberry',
    scientificName: 'Rubus ursinus',
    alsoKnownAs: ['Pacific blackberry', 'California blackberry'],
    uses: 'edible',
    category: 'berry',
    regions: ['both'],
    habitat:
      'Sunny roadsides, clearings, and dry edges throughout Lane County and coastal scrub toward Florence. Low trailing vines, not tall canes.',
    identification:
      'Thin trailing stems with small hooked prickles. White to pink flowers. Small intense black berries with excellent flavor — parent of many cultivated varieties.',
    lookalikes: [
      'Himalayan blackberry — tall arching canes, larger berries; also edible but invasive.',
      'Dewberry — similar trailing habit; confirm 5-part leaves and Rubus ID.',
      'Nightshade berries — NOT on thorny Rubus stems; always check flower structure.',
    ],
    edibleNotes:
      'Oregon’s native wild blackberry — smaller but far more aromatic than Himalayan blackberry. Best pies and jam berry in the valley.',
    holisticNotes: 'Seek out native patches instead of invasive Himalaya thickets when possible.',
    preparation: 'Fresh, pie, jam, vinegar, or freeze on sheet trays.',
    harvestSeason: 'Berries: July–September.',
    safetyWarnings: [
      'Do not confuse with unripe or toxic berries on other plants.',
      'Himalayan blackberry is invasive but also edible — native trailing has finer flavor.',
    ],
    ...gallery('trailing-blackberry', 'Wikimedia Commons — Rubus ursinus', [
      'Trailing vine habit',
      'Ripe black fruit',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/RUUR' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rubus_ursinus' },
    ],
  },
  {
    id: 'red-huckleberry',
    commonName: 'Red Huckleberry',
    scientificName: 'Vaccinium parvifolium',
    uses: 'edible',
    category: 'berry',
    regions: ['both'],
    habitat:
      'Often on decaying logs and stumps in moist conifer forest — common in coast range hikes near Florence and foothill forests around Eugene.',
    identification:
      'Tiny bright green leaves on angular green stems. Small red translucent berries. Grows on wood, not in soil (key ID clue).',
    lookalikes: [
      'Evergreen huckleberry — dark berries on woody shrub in soil, not from logs.',
      'Salal — dark blue mealy berries, leathery oval leaves.',
      'Red berries on green stems from wood is the key — do not pick bush berries by mistake.',
    ],
    edibleNotes:
      'Tart bright berries — outstanding for pancakes, muffins, and syrup. Less sweet than evergreen huckleberry but incredible baked.',
    holisticNotes: 'Look for red berries on green stems sprouting from old logs.',
    preparation: 'Cook with sugar, bake, or dry for winter tea. Raw is quite tart.',
    harvestSeason: 'Late summer–fall.',
    safetyWarnings: ['Some Vaccinium species look similar — confirm red berries on woody stems from logs.'],
    ...gallery('red-huckleberry', 'Wikimedia Commons — Vaccinium parvifolium', [
      'On decaying wood',
      'Red berries on green stems',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/VAPA8' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Vaccinium_parvifolium' },
    ],
  },
  {
    id: 'serviceberry',
    commonName: 'Serviceberry',
    scientificName: 'Amelanchier alnifolia',
    alsoKnownAs: ['Saskatoon', 'Juneberry'],
    uses: 'edible',
    category: 'shrub',
    regions: ['eugene', 'both'],
    habitat:
      'Open slopes, oak savanna edges, and sunny forest margins in the eastern Willamette Valley and foothills — less common on immediate coast but present inland.',
    identification:
      'Shrub or small tree. White spring flowers in clusters. Blue-purple berries with crown scar on bottom (like tiny apples). Oval finely toothed leaves.',
    lookalikes: [
      'Blue elderberry — cluster berries without crown scar on each fruit; opposite leaves.',
      'Huckleberries — single berries, no crown scar dimple.',
      'Nightshade — may have berry clusters; lacks apple-like crown scar on each fruit.',
    ],
    edibleNotes:
      'Sweet nutty berries — excellent fresh, in pies, or dried like raisins. One of the best “fruit tree” wild foods in eastern Lane County.',
    holisticNotes: 'Ripens early — often called Juneberry for a reason.',
    preparation: 'Fresh, pie, fruit leather, or dry. Remove stems.',
    harvestSeason: 'Berries: June–July. Flowers: April–May.',
    safetyWarnings: ['Berries must have crown scar (bottom dimple) like blueberry — not a nightshade.'],
    ...gallery('serviceberry', 'Wikimedia Commons — Amelanchier alnifolia', [
      'White spring flowers',
      'Blue-purple fruit',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/AMAL2' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Amelanchier_alnifolia' },
    ],
  },
  {
    id: 'chickweed',
    commonName: 'Chickweed',
    scientificName: 'Stellaria media',
    uses: 'edible',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Cool moist gardens, farm edges, and disturbed soil — abundant in Eugene valley winter and spring; mild coast winters near Florence.',
    identification:
      'Low tangled mat. Opposite oval leaves. Tiny white star flowers with five deeply split petals (looks like ten). Single line of hairs on stem that switches sides at each node.',
    lookalikes: [
      'Mouse-ear chickweed — similar; also edible.',
      'Spurge (Euphorbia) — milky sap when broken; NOT edible — TOXIC.',
      'Scarlet pimpernel — low mat; different flower color; not edible.',
    ],
    edibleNotes:
      'Mild salad green — tastes like corn silk or mild lettuce. High in vitamins. One of the best winter wild greens in the valley.',
    holisticNotes: 'Harvest when lush and green — bolts and fades in hot dry summer.',
    preparation: 'Raw in salads, pesto, or brief wilt in soup. Do not cook long.',
    harvestSeason: 'Best: October–April. Fades in summer heat.',
    safetyWarnings: [
      'Learn the stem-hair ID — spurge and other lookalikes lack the hair line.',
      'Wash well — often grows near foot traffic.',
    ],
    ...gallery('chickweed', 'Wikimedia Commons — Stellaria media', [
      'Mat growth habit',
      'Star-shaped white flowers',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Stellaria_media' },
    ],
  },
  {
    id: 'lambs-quarters',
    commonName: "Lamb's Quarters",
    scientificName: 'Chenopodium album',
    alsoKnownAs: ['Goosefoot', 'Wild spinach'],
    uses: 'edible',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Disturbed soil, gardens, and farm fields throughout Eugene and coastal towns — classic “weed” superfood.',
    identification:
      'Gray-green leaves often with mealy white coating on undersides. Diamond toothed shape. Tall spikes of tiny green flowers in summer.',
    lookalikes: [
      'Orach (Atriplex) — related edible; similar leaf shape.',
      'Nightshade (Solanum) — may resemble young shoots; TOXIC berries and leaves.',
      'Spinach — cultivated lookalike; wild lambs quarters has mealy coating under leaves.',
    ],
    edibleNotes:
      'Top wild spinach substitute — steam, sauté, or blend in smoothies. More nutritious than cultivated spinach by many measures.',
    holisticNotes: 'Young plants are tender; pinch tops for continued harvest.',
    preparation: 'Steam or sauté young leaves and tips. Blanch and freeze for winter.',
    harvestSeason: 'Young leaves: spring–early summer before flowering.',
    safetyWarnings: [
      'Always cook or blanch — raw in large amounts contains oxalates.',
      'Avoid plants from contaminated soil (lead, pesticides).',
    ],
    ...gallery('lambs-quarters', 'Wikimedia Commons — Chenopodium album', [
      'Mealy gray-green leaves',
      'Flower spikes',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Chenopodium_album' },
    ],
  },
  {
    id: 'wild-mint',
    commonName: 'Wild Mint',
    scientificName: 'Mentha arvensis',
    alsoKnownAs: ['Field mint', 'Corn mint'],
    uses: 'edible',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Wet meadows, ditches, and stream margins — Willamette valley waterways and coastal creek bottoms near Florence.',
    identification:
      'Square stems. Opposite toothed leaves. Strong mint smell when crushed. Whorls of small lavender flowers.',
    lookalikes: [
      'Horse mint / other Mentha — must smell strongly of mint when crushed.',
      'Ground ivy (Glechoma) — mint family but creeping; different flower shape.',
      'Pennyroyal — mint family; historically used but toxic in large doses.',
    ],
    edibleNotes:
      'Tea, tabbouleh, fruit salads, and syrup. Classic digestive and cooling summer herb.',
    holisticNotes: 'Crush a leaf — if it doesn’t smell minty, it’s not mint.',
    preparation: 'Fresh or dried tea. Infused honey. Chop leaves into salads.',
    harvestSeason: 'Spring through fall — best before flowering for tenderest leaves.',
    safetyWarnings: [
      'Must smell strongly of mint — toxic lookalikes exist without mint odor.',
      'Avoid polluted ditches.',
    ],
    ...gallery('wild-mint', 'Wikimedia Commons — Mentha arvensis', [
      'Square stem & opposite leaves',
      'Lavender flower whorls',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mentha_arvensis' },
    ],
  },
  {
    id: 'cattail',
    commonName: 'Cattail',
    scientificName: 'Typha latifolia',
    uses: 'edible',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Shallow freshwater marshes, ponds, and slow sloughs — West Eugene wetlands, Fern Ridge area, and Siuslaw estuary margins.',
    identification:
      'Tall sword-like leaves. Brown hot-dog seed heads in late summer. Grows in standing water or saturated mud.',
    lookalikes: [
      'Iris (blue flag) — TOXIC; flat fan of leaves, showy flowers, no brown cigar head.',
      'Sweet flag (Acorus) — similar wetland leaves; different flower spike; check habitat.',
      'Prairie cordgrass — sharp edges; not the classic cattail cigar seed head.',
    ],
    edibleNotes:
      'Four-season food: spring white shoots (peel), early green flower spikes (corn-on-the-cob), pollen flour, and starchy rhizomes in fall/winter.',
    holisticNotes: 'The “supermarket of the swamp” — learn one plant for many calories.',
    preparation:
      'Peel young shoots for stir-fry. Boil immature green spikes 5 min. Pollen in baked goods. Rhizome starch requires cleaning.',
    harvestSeason: 'Shoots: spring. Pollen: early summer. Roots: fall.',
    safetyWarnings: [
      'NEVER harvest where water may be contaminated (ag runoff, sewage).',
      'Do not confuse with toxic iris (flat fan leaves, no cattail seed head).',
    ],
    ...gallery('cattail', 'Wikimedia Commons — Typha latifolia', [
      'Marsh habitat',
      'Brown seed head',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/TYLA' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Typha_latifolia' },
    ],
  },
  {
    id: 'pacific-crabapple',
    commonName: 'Pacific Crabapple',
    scientificName: 'Malus fusca',
    alsoKnownAs: ['Oregon crabapple'],
    uses: 'edible',
    category: 'tree',
    regions: ['florence', 'both'],
    habitat:
      'Wet coastal forest and stream banks — native from Florence estuary north; occasional in valley riparian plantings.',
    identification:
      'Small tree with thorny twigs. White to pink spring blossoms. Yellow to reddish crabapples under 1 inch — very tart raw.',
    lookalikes: [
      'Cultivated apple escapes — larger fruit; similar but often bigger leaves.',
      'Hawthorn (Crataegus) — similar rosaceous fruit; hawthorn berries have different seed pattern.',
      'Chokecherry — dark purple-black drupes in racemes, not small apples.',
    ],
    edibleNotes:
      'Classic pectin-rich wild fruit for jelly and cider. High natural pectin means excellent set without added box pectin.',
    holisticNotes: 'Coast specialty — combine with sweeter fruit for sauce.',
    preparation: 'Cook and strain for jelly. Cider vinegar. Never eat large amounts raw.',
    harvestSeason: 'Fruit: September–October after frost sweetens slightly.',
    safetyWarnings: [
      'Very tart raw — cook before eating in quantity.',
      'Crush seeds contain amygdalin — don’t eat crushed seeds.',
    ],
    ...gallery('pacific-crabapple', 'Wikimedia Commons — Malus fusca', [
      'Spring blossoms',
      'Small tart crabapples',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/MAFU' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Malus_fusca' },
    ],
  },
  {
    id: 'morel',
    commonName: 'Morel',
    scientificName: 'Morchella sp.',
    alsoKnownAs: ['Yellow morel', 'Black morel'],
    uses: 'edible',
    category: 'mushroom',
    regions: ['eugene', 'both'],
    habitat:
      'Burn scars, disturbed soil, cottonwood bottoms, and old orchards in the Willamette Valley — spring specialty after warm rains.',
    identification:
      'Honeycombed pitted cap attached to stem. Hollow inside entire mushroom (cut lengthwise to verify). No gills — pits and ridges.',
    lookalikes: [
      'False morel (Gyromitra) — brain-like red-brown cap; NOT fully hollow; contains gyromitrin — TOXIC.',
      'Verpa (thimble cap) — cap attached only at top of stem; cap separates from stalk.',
      'Stinkhorn eggs — may resemble young morels; break open to check for developing stalk smell.',
    ],
    edibleNotes:
      'Premier spring gourmet mushroom — sauté in butter, dry for year-round use. Oregon spring morel season rivals anywhere in North America.',
    holisticNotes: 'Check burn permits and land access — popular on public land near Eugene foothills.',
    preparation: 'Always cook thoroughly. Split and wash out grit. Dry or sauté — never raw.',
    harvestSeason: 'March–May after soil reaches ~50°F and spring rains.',
    safetyWarnings: [
      'MUST be hollow — false morels (Gyromitra) are solid and toxic.',
      'Never eat raw — cook every wild mushroom.',
      'Know land rules — some areas restrict mushroom harvest.',
    ],
    ...gallery('morel', 'Wikimedia Commons — Morchella', [
      'Honeycombed cap',
      'Hollow stem cross-section',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Morchella' },
      { label: 'PSMS — Mushroom ID', url: 'https://www.psms.org/' },
    ],
  },
  {
    id: 'purslane',
    commonName: 'Purslane',
    scientificName: 'Portulaca oleracea',
    uses: 'edible',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Hot dry disturbed soil — garden paths, farm rows, and sandy lots in Eugene summer and Florence coastal gardens.',
    identification:
      'Succulent red stems sprawling on ground. Small fleshy oval leaves. Tiny yellow flowers. Leaves feel juicy when pinched.',
    lookalikes: [
      'Spurge (Euphorbia) — milky white sap when stem broken; NOT succulent — TOXIC.',
      'Spotted spurge — prostrate; exudes milky latex.',
      'Purslane has no milky sap — that is the critical field test.',
    ],
    edibleNotes:
      'Highest plant source of omega-3 ALA among common weeds. Tangy lemon crunch in salads and tacos.',
    holisticNotes: 'Thrives in summer heat when other greens bolt — valuable dry-season food.',
    preparation: 'Raw in salads, pickled stems, or brief sauté. Thickens soups.',
    harvestSeason: 'Summer when succulent — June–September.',
    safetyWarnings: [
      'Do not confuse with spurge — spurge has milky sap and is NOT succulent.',
      'Wash away soil — low-growing.',
    ],
    ...gallery('purslane', 'Wikimedia Commons — Portulaca oleracea', [
      'Succulent red stems',
      'Yellow flowers',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Portulaca_oleracea' },
    ],
  },
  {
    id: 'burdock',
    commonName: 'Burdock',
    scientificName: 'Arctium minus',
    alsoKnownAs: ['Lesser burdock', 'Gobo'],
    uses: 'edible',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Disturbed ground, trailsides, and vacant lots — ubiquitous weed with Velcro-like seed heads.',
    identification:
      'Large heart-shaped leaves with woolly undersides. Purple thistle-like flowers. Round bur seed heads that stick to clothing.',
    lookalikes: [
      'Rhubarb — cultivated; similar large leaves but no burs; poisonous leaves on rhubarb too.',
      'Butterbur (Petasites) — huge leaves; different flower timing; not the same root.',
      'Foxglove first-year rosette — TOXIC; soft fuzzy leaves but different venation.',
    ],
    edibleNotes:
      'First-year roots are the famous Japanese gobo — earthy, crunchy, stir-fry staple. Peel thick skin; soak to reduce bitterness.',
    holisticNotes: 'Harvest roots first fall or spring from first-year rosettes (no flower stalk yet).',
    preparation: 'Scrub, peel, slice, soak 30 min. Stir-fry, pickle, or add to miso soup. Young leaf petioles peeled.',
    harvestSeason: 'Roots: fall or spring of first year. Stalks: before flowers open.',
    safetyWarnings: [
      'Only first-year plants — woody second-year roots are inedible.',
      'Flower stalk appears second year — then root is too tough.',
    ],
    ...gallery('burdock', 'Wikimedia Commons — Arctium minus', [
      'Large rosette leaves',
      'Purple flower & bur',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Arctium_minus' },
    ],
  },
  {
    id: 'wild-lettuce',
    commonName: 'Wild Lettuce',
    scientificName: 'Lactuca serriola / L. virosa',
    alsoKnownAs: ['Prickly lettuce', 'Opium lettuce', 'Great lettuce'],
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Roadsides, vacant lots, farm edges, and disturbed soil throughout Eugene and the Willamette Valley — also along I-5 corridor toward Florence. Tall weed with milky sap.',
    identification:
      'L. serriola: prickly spines on midrib underside, blue-green leaves, tall flowering stalk with small yellow dandelion-like flowers. L. virosa: larger, more robust cousin with similar milky latex. Both bleed white sap when stem is broken.',
    medicinalNotes:
      'Folk “lettuce opium” lore — dried latex (lactucarium) historically used for pain and sleep in 19th-century herbalism. Modern evidence is weak; effects are mild compared to true opiates.',
    holisticNotes:
      'Common valley weed — often confused with sow thistle. The sap is the traditional focus, not the leaves as salad.',
    preparation:
      'Historical: score stem, collect dried white sap. Modern herbalism sometimes uses tincture of flowering tops. Educational reference only.',
    harvestSeason: 'Flowering stalks: summer. Sap: when stems are actively growing.',
    safetyWarnings: [
      'Not a substitute for prescribed pain medication.',
      'Can cause drowsiness — do not drive or combine with sedatives.',
      'L. virosa is more potent in folklore; positive species ID required.',
      'Avoid during pregnancy and breastfeeding.',
    ],
    ...gallery('wild-lettuce', 'Wikimedia Commons — Lactuca serriola', [
      'Prickly midrib & rosette',
      'Yellow flower stalk',
    ]),
    externalLinks: [
      { label: 'Wikipedia — L. serriola', url: 'https://en.wikipedia.org/wiki/Lactuca_serriola' },
      { label: 'Wikipedia — L. virosa', url: 'https://en.wikipedia.org/wiki/Lactuca_virosa' },
    ],
  },
  {
    id: 'pokeweed',
    commonName: 'Pokeweed',
    scientificName: 'Phytolacca americana',
    alsoKnownAs: ['American pokeweed', 'Poke sallet'],
    uses: 'medicinal',
    category: 'herb',
    regions: ['eugene', 'both'],
    habitat:
      'Disturbed ground, fence lines, and garden edges — naturalized in parts of western Oregon including Willamette Valley towns. Less common on immediate coast but reported inland from Florence.',
    identification:
      'Large herbaceous perennial with red-purple stems. Alternate oval leaves. Long drooping racemes of white flowers followed by dark purple-black berries on hot pink pedicels.',
    medicinalNotes:
      'Traditional Southern and Appalachian folk medicine — berries and roots appear in “detox” and immune folklore. All parts contain saponins and lectins (especially root and seeds).',
    holisticNotes:
      'Young spring shoots were historically boiled in multiple changes of water (“poke sallet”) — a dangerous practice if done incorrectly.',
    preparation:
      'Historical reference only. Modern herbalism does not recommend internal use. Topical applications appear in some folk traditions.',
    harvestSeason: 'Spring shoots (historical only) — berries ripen late summer.',
    safetyWarnings: [
      'ROOTS AND SEEDS ARE HIGHLY TOXIC — can cause severe vomiting, diarrhea, and death.',
      'Raw berries poisonous to children and pets.',
      'Do not follow social-media “detox” protocols.',
      'If ingested, call Oregon Poison Center 1-800-222-1222 immediately.',
    ],
    ...gallery('pokeweed', 'Wikimedia Commons — Phytolacca americana', [
      'Red stem & leaves',
      'Purple berries',
    ]),
    externalLinks: [
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/PHAM4' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Phytolacca_americana' },
    ],
  },
  {
    id: 'comfrey',
    commonName: 'Comfrey',
    scientificName: 'Symphytum officinale',
    alsoKnownAs: ['Knitbone', 'Boneset'],
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Garden escape and riparian edges — widely planted in Eugene valley herb gardens and naturalized near streams. Large hairy leaves in basal rosette.',
    identification:
      'Coarse hairy lance-shaped leaves with decurrent wings on stem. Clusters of drooping bell-shaped purple to cream flowers. Thick black taproot.',
    medicinalNotes:
      'Allantoin-rich leaves traditionally used for bruises, sprains, and topical wound support. Pyrrolizidine alkaloids (PAs) in roots and leaves damage the liver when taken internally.',
    holisticNotes:
      'FDA and European regulators have restricted or banned oral comfrey products — yet it remains one of the most popular folk topical herbs in Pacific Northwest homestead culture.',
    preparation:
      'External only: infused oil or poultice from dried leaves. Never use on broken skin long-term. Do not ingest teas, capsules, or tinctures.',
    harvestSeason: 'Leaves: before flowering (spring). Flowers: early summer.',
    safetyWarnings: [
      'BANNED for internal use in many countries — hepatotoxic PAs accumulate.',
      'Do not use during pregnancy or breastfeeding.',
      'Do not apply open-wound poultices without qualified herbalist guidance.',
      'Russian comfrey (S. × uplandicum) is also PA-containing.',
    ],
    ...gallery('comfrey', 'Wikimedia Commons — Symphytum officinale', [
      'Hairy leaves & flowers',
      'Flower cluster detail',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Symphytum_officinale' },
      { label: 'OSU Extension — herbal safety', url: 'https://extension.oregonstate.edu/' },
    ],
  },
  {
    id: 'sheep-sorrel',
    commonName: 'Sheep Sorrel',
    scientificName: 'Rumex acetosella',
    alsoKnownAs: ['Red sorrel', 'Field sorrel'],
    uses: 'medicinal',
    category: 'herb',
    regions: ['both'],
    habitat:
      'Lawns, pastures, roadsides, and disturbed acidic soils — one of the most common weeds in Oregon. Often grows alongside burdock in the same disturbed patches.',
    identification:
      'Arrowhead-shaped leaves with basal lobes pointing backward (sheep’s head silhouette). Red-tinged stems. Small reddish flower spikes on wire-like stalks. Sour lemon taste from oxalic acid.',
    medicinalNotes:
      'Key ingredient in the Essiac folk cancer-support tea formula (with burdock root, slippery elm, and Indian rhubarb). No clinical proof of anti-cancer effect; used historically as cooling astringent.',
    holisticNotes: 'Pairs ecologically and in herbal lore with burdock — both common valley “weeds” with deep folk followings.',
    preparation:
      'Essiac-style decoctions use dried aerial parts. Small amounts in salad. Tea from dried herb.',
    harvestSeason: 'Spring through summer before seed set.',
    safetyWarnings: [
      'High oxalates — avoid large amounts; kidney stone risk.',
      'Essiac and cancer claims are not FDA-approved — consult oncology providers.',
      'Do not confuse with toxic lookalikes in unrelated families.',
    ],
    ...gallery('sheep-sorrel', 'Wikimedia Commons — Rumex acetosella', [
      'Arrowhead leaves',
      'Red flower spikes',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rumex_acetosella' },
      { label: 'USDA Plant Profile', url: 'https://plants.usda.gov/plant-profile/RUAC' },
    ],
  },

  // ——— Hallucinogenics (educational reference — Oregon / PNW) ———
  {
    id: 'psilocybe-cyanescens',
    commonName: 'Wavy Cap',
    scientificName: 'Psilocybe cyanescens',
    alsoKnownAs: ['Wavy caps'],
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['both'],
    habitat:
      'Wood-chip mulch, landscaped beds, trail edges, and decaying hardwood debris — extremely common in urban Eugene and coastal towns like Florence after fall rains.',
    identification:
      'Caramel to chestnut cap with wavy margin when mature. White stem bruises blue-green. Purple-brown spore print. Grows in clusters on wood chips — not on open pasture.',
    holisticNotes:
      'One of the most frequently encountered psilocybin mushrooms in the Pacific Northwest. Documented on iNaturalist throughout Lane County.',
    preparation: 'Reference only — not consumption guidance.',
    harvestSeason: 'Late fall through winter after first heavy rains (Oct–Jan).',
    safetyWarnings: [
      'ILLEGAL to possess in Oregon except within approved psilocybin service contexts — know state and federal law.',
      'Deadly lookalikes exist — Galerina marginata grows on wood and contains amatoxins.',
      'Misidentification can be fatal. Never eat wild mushrooms without expert confirmation.',
      'Educational reference only — not medical or legal advice.',
    ],
    ...gallery('psilocybe-cyanescens', 'Wikimedia Commons — Psilocybe cyanescens', [
      'Cluster on wood chips',
      'Cap margin & bruising',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Psilocybe_cyanescens' },
      { label: 'Mushroom Observer', url: 'https://mushroomobserver.org/' },
    ],
  },
  {
    id: 'psilocybe-azurescens',
    commonName: 'Flying Saucer',
    scientificName: 'Psilocybe azurescens',
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['florence', 'both'],
    habitat:
      'Coastal Oregon wood chips, dune grasses, and sandy soils with woody debris — first described near the Oregon coast. Reported from Florence north toward Astoria.',
    identification:
      'Large caramel cap (can exceed 10 cm). Robust stem with blue bruising. Often grows in coastal wood-chip piles and edge habitats.',
    holisticNotes: 'Oregon coast endemic species — a signature mushroom of Pacific Northwest mycology.',
    preparation: 'Reference only — not consumption guidance.',
    harvestSeason: 'Late fall (Nov–Dec) on the coast after rains.',
    safetyWarnings: [
      'ILLEGAL outside licensed Oregon psilocybin services.',
      'Potent — dosage errors are dangerous even with correct ID.',
      'Wood-chip patches may contain toxic Galerina species.',
      'Educational reference only.',
    ],
    ...gallery('psilocybe-azurescens', 'Wikimedia Commons — Psilocybe azurescens', [
      'Coastal wood-chip habitat',
      'Cap and stem detail',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Psilocybe_azurescens' },
    ],
  },
  {
    id: 'psilocybe-semilanceata',
    commonName: 'Liberty Cap',
    scientificName: 'Psilocybe semilanceata',
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['eugene', 'both'],
    habitat:
      'Sheep and cattle pastures, lawns, and fertilized grass in cool wet weather — reported in Willamette Valley pastures.',
    identification:
      'Small conical bell-shaped cap with pointed papilla. Thin wavy stem. Purple-brown spore print. Grows from grass, not wood.',
    holisticNotes: 'Classic European pasture species also found in Pacific Northwest grasslands.',
    preparation: 'Reference only.',
    harvestSeason: 'Fall through early winter during cool wet spells.',
    safetyWarnings: [
      'ILLEGAL outside licensed contexts.',
      'Easily confused with toxic lawn mushrooms.',
      'Never harvest on grazed pastures without landowner permission.',
    ],
    ...gallery('psilocybe-semilanceata', 'Wikimedia Commons — Psilocybe semilanceata', [
      'Pasture habitat',
      'Cap shape detail',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Psilocybe_semilanceata' },
    ],
  },
  {
    id: 'psilocybe-allenii',
    commonName: 'Allenii',
    scientificName: 'Psilocybe allenii',
    alsoKnownAs: ['Psilocybe cyanofriscosa'],
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['florence', 'both'],
    habitat:
      'Wood-chip mulch and landscaped beds along the Oregon coast and I-5 corridor — first described from the San Francisco Bay Area and documented north into coastal Oregon towns including the Florence area.',
    identification:
      'Caramel to chestnut cap, often wavy when mature. White stem with strong blue bruising. Purple-brown spore print. Grows on wood chips — member of the Pacific wood-lover complex related to P. cyanescens.',
    holisticNotes:
      'Often found alongside P. cyanescens in the same mulch beds — cap size and subtle macro features help separate species.',
    preparation: 'Reference only — not consumption guidance.',
    harvestSeason: 'Late fall through winter (Nov–Jan) after rains.',
    safetyWarnings: [
      'ILLEGAL outside licensed Oregon psilocybin service contexts.',
      'Deadly Galerina marginata shares the same wood-chip habitat.',
      'Spore print and expert confirmation mandatory.',
      'Educational reference only.',
    ],
    ...gallery('psilocybe-allenii', 'Wikimedia Commons — Psilocybe allenii', [
      'Wood-chip cluster',
      'Cap & stem bruising',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Psilocybe_allenii' },
      { label: 'Mushroom Observer', url: 'https://mushroomobserver.org/' },
    ],
  },
  {
    id: 'psilocybe-stuntzii',
    commonName: 'Stuntz’s Blue Legs',
    scientificName: 'Psilocybe stuntzii',
    alsoKnownAs: ['Blue ringer', 'Stuntz’s psilocybe'],
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['eugene', 'both'],
    habitat:
      'Lawns, grassy areas near conifers, and mulched beds in the Willamette Valley — named for UW mycologist Daniel Stuntz. Common in Eugene-area campus lawns and park edges after fall rains.',
    identification:
      'Small to medium brown cap. Stem bruises blue-green distinctly (“blue legs”). Purple-brown spore print. Often grows in grass or near wood chips — not a large wood-cluster species.',
    holisticNotes: 'One of the classic PNW lawn-and-mulch psilocybes — smaller than cyanescens but similarly potent.',
    preparation: 'Reference only.',
    harvestSeason: 'Fall (Oct–Dec) during cool wet weather.',
    safetyWarnings: [
      'ILLEGAL outside licensed contexts.',
      'Lawn mushrooms include toxic species — never rely on blue bruising alone.',
      'Pesticide-treated lawns are unsafe to forage.',
      'Educational reference only.',
    ],
    ...gallery('psilocybe-stuntzii', 'Wikimedia Commons — Psilocybe stuntzii', [
      'Lawn habitat',
      'Blue stem bruising',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Psilocybe_stuntzii' },
    ],
  },
  {
    id: 'psilocybe-baeocystis',
    commonName: 'Bottle Cap',
    scientificName: 'Psilocybe baeocystis',
    alsoKnownAs: ['Knobby tops', 'Blue bell'],
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['both'],
    habitat:
      'Mulched garden beds, bark chips, and rich soil under conifers — reported throughout western Oregon from valley cities to coast range towns near Florence.',
    identification:
      'Dark olive-brown conical cap (“bottle cap” shape). Stem often banded and bruises blue. Distinctive baeocystin content in chemistry literature. Purple-brown spore print.',
    holisticNotes: 'Named for the bottle-cap silhouette of young specimens — another cyanescens-complex wood-lover.',
    preparation: 'Reference only.',
    harvestSeason: 'Late fall through winter on mulched beds.',
    safetyWarnings: [
      'ILLEGAL outside licensed contexts.',
      'Galerina and other wood-inhabiting amatoxin species are deadly lookalikes.',
      'Educational reference only — not medical or legal advice.',
    ],
    ...gallery('psilocybe-baeocystis', 'Wikimedia Commons — Psilocybe baeocystis', [
      'Conical cap on mulch',
      'Stem banding & bruising',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Psilocybe_baeocystis' },
    ],
  },
  {
    id: 'gymnopilus-spectabilis',
    commonName: 'Big Laughing Gym',
    scientificName: 'Gymnopilus spectabilis',
    alsoKnownAs: ['Gymnopilus junonius'],
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['both'],
    habitat:
      'Large clusters on conifer stumps and logs throughout Oregon forests — valley foothills and coast range near Florence.',
    identification:
      'Big orange-brown caps in dense clusters on wood. Rusty orange spore print (not purple-brown). Often 10–20 cm caps.',
    holisticNotes: 'Contains psilocybin but often causes nausea; not a preferred species.',
    preparation: 'Reference only.',
    harvestSeason: 'Fall on rotting conifer wood.',
    safetyWarnings: [
      'ILLEGAL outside licensed contexts.',
      'Extremely bitter — gastric distress common.',
      'Confirm wood-growing habit vs. gilled lookalikes.',
    ],
    ...gallery('gymnopilus-spectabilis', 'Wikimedia Commons — Gymnopilus spectabilis', [
      'Cluster on conifer log',
      'Cap color & size',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Gymnopilus_spectabilis' },
    ],
  },
  {
    id: 'amanita-muscaria',
    commonName: 'Fly Agaric',
    scientificName: 'Amanita muscaria',
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['both'],
    habitat:
      'Mycorrhizal with Douglas fir and pine — common in Eugene foothill forests and coastal woods near Florence.',
    identification:
      'Iconic red cap with white warts. White gills, ring on stem, bulbous base. Contains muscimol & ibotenic acid — NOT psilocybin.',
    holisticNotes: 'One of the most recognizable mushrooms worldwide.',
    preparation: 'Reference only — raw consumption is dangerous.',
    harvestSeason: 'Late summer through fall.',
    safetyWarnings: [
      'TOXIC if eaten raw — vomiting, confusion, hospitalization possible.',
      'Amanita genus contains deadly species — expert ID essential.',
      'Educational reference only.',
    ],
    ...gallery('amanita-muscaria', 'Wikimedia Commons — Amanita muscaria', [
      'Under Douglas fir',
      'Cap & volva detail',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Amanita_muscaria' },
    ],
  },
  {
    id: 'amanita-pantherina',
    commonName: 'Panther Cap',
    scientificName: 'Amanita pantherina',
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['both'],
    habitat: 'Conifer and hardwood forests in the PNW — valley to coast.',
    identification:
      'Brown cap with white warts. White gills and ring. Bulbous stem base in volva cup. Resembles fly agaric but cap is brown.',
    holisticNotes: 'More potent muscimol content than A. muscaria.',
    preparation: 'Reference only.',
    harvestSeason: 'Summer through fall.',
    safetyWarnings: [
      'HIGH RISK of severe poisoning — delirium, hospitalization.',
      'Never consume. Document for ID education only.',
    ],
    ...gallery('amanita-pantherina', 'Wikimedia Commons — Amanita pantherina', [
      'Forest floor context',
      'Cap & warts detail',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Amanita_pantherina' },
    ],
  },
  {
    id: 'panaeolus-cinctulus',
    commonName: 'Banded Mottlegill',
    scientificName: 'Panaeolus cinctulus',
    alsoKnownAs: ['Psilocybe subbalteatus'],
    uses: 'hallucinogenic',
    category: 'mushroom',
    regions: ['both'],
    habitat:
      'Compost, manure-enriched soil, mulched gardens, and lawns — occasional in Eugene valley gardens.',
    identification:
      'Small brown cap with darker band at margin when moist. Black gills mottled with spores. Grows from soil not wood.',
    holisticNotes: 'Weak to moderate psilocybin content — documented in Oregon.',
    preparation: 'Reference only.',
    harvestSeason: 'Spring through fall in enriched soils.',
    safetyWarnings: [
      'ILLEGAL outside licensed contexts.',
      'Toxic lookalikes in Panaeolus genus — expert ID required.',
    ],
    ...gallery('panaeolus-cinctulus', 'Wikimedia Commons — Panaeolus cinctulus', [
      'Cap banding',
      'Gills & stem',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Panaeolus_cinctulus' },
    ],
  },
  {
    id: 'datura-stramonium',
    commonName: 'Jimsonweed',
    scientificName: 'Datura stramonium',
    alsoKnownAs: ["Devil's snare", 'Thorn apple'],
    uses: 'hallucinogenic',
    category: 'herb',
    regions: ['eugene', 'both'],
    habitat:
      'Disturbed soil, vacant lots, roadsides, and gardens — occasional naturalized plant in the Willamette Valley.',
    identification:
      'Large trumpet-shaped white or purple flowers. Spiky seed pods. Strong unpleasant odor. Large irregular toothed leaves.',
    holisticNotes:
      'Deliriant tropane alkaloids — NOT a classic psychedelic. Historically associated with poisonings.',
    preparation: 'Reference only — all parts toxic.',
    harvestSeason: 'Summer–fall flowers and pods.',
    safetyWarnings: [
      'EXTREMELY DANGEROUS — overdose causes hospitalization, psychosis, death.',
      'Educational reference only — avoid all ingestion.',
    ],
    ...gallery('datura-stramonium', 'Wikimedia Commons — Datura stramonium', [
      'Trumpet flower',
      'Spiny seed pod',
    ]),
    externalLinks: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Datura_stramonium' },
      { label: 'OSU — Poisonous plants', url: 'https://extension.oregonstate.edu/gardening/techniques/poisonous-plants' },
    ],
  },
];

export const EXTERNAL_RESOURCE_LIBRARY: ResourceCategory[] = [
  {
    id: 'edible-wild-foods',
    title: 'Edible Wild Foods — Willamette & Coast',
    description: 'Fruit, greens, mushrooms, and preparation references for Oregon foragers.',
    links: [
      {
        label: 'OSU Extension — Wild harvesting',
        url: 'https://extension.oregonstate.edu/',
        description: 'Sustainable harvest guidelines and food safety basics.',
      },
      {
        label: 'Oregon Flora Project',
        url: 'https://www.oregonflora.org/',
        description: 'Confirm species ID before any wild food harvest.',
      },
      {
        label: 'PSMS — Pacific Northwest mushrooms',
        url: 'https://www.psms.org/',
        description: 'Chanterelle, morel, and other edible fungi ID.',
      },
      {
        label: 'iNaturalist — Lane County edibles',
        url: 'https://www.inaturalist.org/places/lane-county-us-or',
        description: 'Community photos of berries and plants near Eugene.',
      },
      {
        label: 'Oregon Poison Center',
        url: 'https://www.ohsu.edu/oregon-poison-center',
        description: '1-800-222-1222 — mushroom or plant exposure emergencies.',
      },
    ],
  },
  {
    id: 'pnw-field-guides',
    title: 'Pacific Northwest Field Guides & ID',
    description: 'Authoritative identification resources for Oregon plants and mushrooms.',
    links: [
      {
        label: 'Oregon Flora Project',
        url: 'https://www.oregonflora.org/',
        description: 'Complete Oregon plant atlas with photos and range maps.',
      },
      {
        label: 'USDA PLANTS Database',
        url: 'https://plants.usda.gov/',
        description: 'Scientific profiles for every native and naturalized species.',
      },
      {
        label: 'iNaturalist — Lane County, OR',
        url: 'https://www.inaturalist.org/places/lane-county-us-or',
        description: 'Community observations with photos near Eugene.',
      },
      {
        label: 'iNaturalist — Florence area',
        url: 'https://www.inaturalist.org/places/siuslaw-national-forest',
        description: 'Coast range and Siuslaw NF plant observations near Florence.',
      },
      {
        label: 'PNW Mushroom ID (PSMS)',
        url: 'https://www.psms.org/',
        description: 'Puget Sound Mycological Society resources applicable to Oregon fungi.',
      },
    ],
  },
  {
    id: 'eugene-local',
    title: 'Eugene & Willamette Valley',
    description: 'Local ecology, foraging ethics, and extension education.',
    links: [
      {
        label: 'OSU Extension — Lane County',
        url: 'https://extension.oregonstate.edu/county/lane',
        description: 'Workshops, Master Gardener, and natural resources programs.',
      },
      {
        label: 'Mount Pisgah Arboretum',
        url: 'https://www.mountpisgaharboretum.org/',
        description: 'Living native plant collection in the southern Willamette Valley.',
      },
      {
        label: 'Friends of Buford Park',
        url: 'https://www.bufordpark.org/',
        description: 'Meadows oak savanna and native plant habitat near Eugene.',
      },
      {
        label: 'Willamette River natural history',
        url: 'https://www.oregon.gov/owrd/programs/Pages/Willamette.aspx',
        description: 'Riparian corridor ecology along the valley.',
      },
    ],
  },
  {
    id: 'florence-coast',
    title: 'Florence & Oregon Coast',
    description: 'Coastal dunes, estuary, and shore-zone plants.',
    links: [
      {
        label: 'Oregon Dunes NRA',
        url: 'https://www.fs.usda.gov/recarea/siuslaw/recarea/?recid=42470',
        description: 'Dune forest, shore pine, and coastal wildflower habitat.',
      },
      {
        label: 'Siuslaw National Forest',
        url: 'https://www.fs.usda.gov/siuslaw',
        description: 'Coast range forest from Florence to Yachats.',
      },
      {
        label: 'Oregon Shores — coastal ecology',
        url: 'https://oregonshores.org/',
        description: 'Shoreline conservation and coastal natural history.',
      },
      {
        label: 'Seaweed foraging — Oregon (reference)',
        url: 'https://en.wikipedia.org/wiki/Edible_seaweed',
        description: 'Overview of edible seaweeds — tidepool ethics and species basics.',
      },
    ],
  },
  {
    id: 'holistic-herbal',
    title: 'Holistic & Herbal Medicine References',
    description: 'Educational resources on Western herbalism and plant energetics (private study).',
    links: [
      {
        label: 'American Herbalists Guild',
        url: 'https://www.americanherbalistsguild.com/',
        description: 'Professional herbalist standards and education.',
      },
      {
        label: 'Henriette’s Herbal Homepage',
        url: 'https://www.henriettes-herb.com/',
        description: 'Classic eclectic herbal texts and materia medica.',
      },
      {
        label: 'Southwest School of Botanical Medicine',
        url: 'http://www.swsbm.com/',
        description: 'Michael Moore’s free PNW-relevant herbal manuscripts.',
      },
      {
        label: 'Dr. Duke’s Phytochemical Database',
        url: 'https://phytochem.nal.usda.gov/phytochem/search',
        description: 'USDA phytochemical and ethnobotanical search.',
      },
    ],
  },
  {
    id: 'hallucinogenics-reference',
    title: 'Hallucinogenics — ID & Safety (Educational)',
    description:
      'Pacific Northwest psychoactive fungi and plants — identification references and poison control. Private study only.',
    links: [
      {
        label: 'PDF — Oregon Psilocybin Law, Safety & Field ID',
        url: '/oregon-plant-medicine/guides/oregon-psilocybin-law-id-safety.pdf',
        description: 'Wild PNW species, lookalikes, Oregon Measure 109 — not a cultivation manual.',
      },
      {
        label: 'Oregon Psilocybin Services (OLCC)',
        url: 'https://www.oregon.gov/olcc/psilocybin',
        description: 'Oregon’s licensed psilocybin framework — not a wild-foraging permit.',
      },
      {
        label: 'Mushroom Observer — Oregon',
        url: 'https://mushroomobserver.org/',
        description: 'Community mushroom ID with photos and range notes.',
      },
      {
        label: 'PSMS — Puget Sound Mycological Society',
        url: 'https://www.psms.org/',
        description: 'PNW mushroom identification resources applicable to Oregon.',
      },
      {
        label: 'Oregon Poison Center',
        url: 'https://www.ohsu.edu/oregon-poison-center',
        description: '1-800-222-1222 — mushroom or plant exposure emergencies.',
      },
    ],
  },
  {
    id: 'safety-ethics',
    title: 'Foraging Safety & Ethics',
    description: 'Read before harvesting — legal, ecological, and health considerations.',
    links: [
      {
        label: 'OSU — Wild harvesting guidelines',
        url: 'https://extension.oregonstate.edu/',
        description: 'Extension guidance on sustainable wildcrafting.',
      },
      {
        label: 'Oregon poisonous plants (OSU)',
        url: 'https://extension.oregonstate.edu/gardening/techniques/poisonous-plants',
        description: 'Know toxic lookalikes before you forage.',
      },
      {
        label: 'Leave No Trace — foraging ethics',
        url: 'https://lnt.org/',
        description: 'Minimum impact principles on public lands.',
      },
    ],
  },
];

export function regionLabel(r: PlantEntry['regions'][number]): string {
  if (r === 'eugene') return 'Eugene / Willamette Valley';
  if (r === 'florence') return 'Florence / Oregon Coast';
  return 'Both regions';
}

export function matchesRegion(plant: PlantEntry, filter: 'all' | 'eugene' | 'florence'): boolean {
  if (filter === 'all') return true;
  return plant.regions.includes(filter) || plant.regions.includes('both');
}
