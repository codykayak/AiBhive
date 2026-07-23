import { commonsImage } from './commonsImage';

type ExpandedFields = {
  imageUrl: string;
  imageCredit?: string;
  deepDive: string;
};

const W = {
  herbs: commonsImage('Medicinal Herbs.jpg'),
  ginger: commonsImage('Ingwer 2 fcm.jpg'),
  ginseng: commonsImage('Ginseng root.jpg'),
  turmeric: commonsImage('Curcuma longa roots.jpg'),
  mushroom: commonsImage('Ganoderma lucidum 01.jpg'),
  berries: commonsImage('Lycium barbarum RHu fruit.JPG'),
  forest: commonsImage('Roosevelt elk bull in Hoh Rainforest 2022-05-30.jpg'),
  tea: commonsImage('Herbal tea.jpg'),
};

export const HERBS_TOPIC_EXPANDED: Record<string, ExpandedFields> = {
  ashwagandha: {
    imageUrl: W.herbs,
    imageCredit: 'Dried herbs — Wikimedia Commons',
    deepDive: `Ashwagandha (Withania somnifera) sits at the center of modern “adaptogen” conversation — a Sanskrit name often translated as “smell of the horse,” referring to the root’s scent and traditional association with stallion strength. In classical Ayurveda it is classified as a Rasayana (rejuvenative) and used for debility, insomnia, anxiety, and reproductive vitality. The active constituents are withanolides — steroidal lactones that modulate the hypothalamic-pituitary-adrenal axis in animal and human studies.

Clinical trials over the past two decades have reported reductions in perceived stress, cortisol levels, and anxiety scores with standardized root extracts, typically dosed for eight to twelve weeks. Thyroid effects appear in some studies — modest increases in T4 — which matters if you take levothyroxine. Sleep quality often improves, likely through GABAergic pathways, so combining ashwagandha with sedatives or alcohol can cause excessive drowsiness.

Product quality varies enormously. Look for extracts standardized to withanolide content, third-party tested for heavy metals (Indian soils can concentrate lead), and clear labeling of root vs leaf (traditional use is root). Cycling use and monitoring with a qualified practitioner is wise for anyone on psychiatric medication, pregnancy planning, or autoimmune therapy.`,
  },
  'turmeric-curcumin': {
    imageUrl: W.turmeric,
    imageCredit: 'Turmeric rhizome — Wikimedia Commons',
    deepDive: `Turmeric (Curcuma longa) colors curries and Ayurvedic formulas alike. Its primary pigment, curcumin, is a polyphenol with anti-inflammatory and antioxidant activity in vitro — but the human challenge is bioavailability. Plain curcumin is poorly absorbed; piperine from black pepper, phospholipid complexes, and nanoparticle formulations were developed to raise blood levels.

Traditional use spans digestion (Haridra for “toxic” accumulations), joint comfort, liver support, and skin — both internal and topical. Chinese medicine knows it as Jiang Huang, moving blood and dispelling wind-cold-damp pain. Modern research explores osteoarthritis, metabolic syndrome, and depression as adjuncts — effects are generally modest compared to pharmaceuticals.

Culinary doses are safe for most people. High-dose supplemental curcumin can thin blood, worsen reflux, and stimulate gallbladder contraction — problematic with gallstones. Always disclose use before surgery. For Pacific Northwest readers, turmeric is a tropical import; pair learning with local yellow allies like Oregon grape (berberine) only conceptually — they are not interchangeable.`,
  },
  'ginseng-panax': {
    imageUrl: W.ginseng,
    imageCredit: 'Panax ginseng roots — Wikimedia Commons',
    deepDive: `Panax ginseng — the genus name means “all-healing” — is among the most economically important medicinal plants on Earth. Asian/Korean ginseng (often steamed red for Ren Shen) is warming and Qi-tonifying in TCM, used when fatigue comes with cold limbs and weak voice. American ginseng (Xi Yang Shen) grows in eastern North American hardwood forests and is considered cooler, nourishing Yin and generating fluids — better when stress shows as heat, irritability, or night sweats.

Active ginsenosides differ between species and preparation. Red ginseng undergoes steaming that converts some ginsenosides to forms with different pharmacology. Research examines physical stamina, cognitive performance, blood sugar, and erectile function — results are mixed but biologically plausible at moderate doses.

Ginseng is stimulating for some — insomnia, hypertension, and headache are classic side effects. It interacts with warfarin, MAO inhibitors, and diabetes drugs. Wild American ginseng is heavily poached; cultivated Wisconsin and Canadian roots are the ethical choice. In TCM, ginseng is rarely used alone; it appears in formulas like Si Jun Zi Tang with codonopsis, poria, and licorice for digestive Qi deficiency.`,
  },
  'astragalus-huang-qi': {
    imageUrl: W.herbs,
    deepDive: `Huang Qi (Astragalus membranaceus) is the archetypal “build your fence” herb in Chinese medicine — tonifying Qi and stabilizing the exterior (Wei Qi) so wind and cold do not penetrate. It appears in immune formulas for people who catch every cold, in post-illness recovery soups, and in oncology adjunct discussions (always with oncologist approval).

The root is sweet, slightly warm, and fibrous — sliced diagonally in herbal pharmacies. Traditional kitchen use simmers astragalus in bone broth, then removes the woody slices before serving. Modern extracts concentrate polysaccharides and saponins implicated in immune modulation and telomerase research (early stage).

Classical texts caution against using Huang Qi during acute fevers — the pattern is “expel pathogen first, tonify later.” Autoimmune patients on biologics should not self-prescribe daily immune tonics. Sustainable sourcing favors cultivated roots; wild Mongolian astragalus faces pressure. Pair study with codonopsis (Dang Shen) for a gentler Qi tonic when ginseng is too stimulating.`,
  },
  'dong-quai-dang-gui': {
    imageUrl: W.herbs,
    deepDive: `Dang Gui (Angelica sinensis) is so central to Chinese gynecological herbalism that it is nicknamed “female ginseng” — though men use it too in blood-building formulas. The head (tou), body (shen), and tail (wei) were historically used for different actions: tail to move blood more strongly, head to stop bleeding in some traditions.

Modern women encounter dong quai in menopause blends, PMS formulas, and fertility support. Evidence is mixed — some trials show modest benefit for menopausal hot flashes; others show none. TCM never relied on single-herb cures; Si Wu Tang (four-substance decoction) combines dang gui with rehmannia, peony, and ligusticum for blood deficiency with dull complexion and scanty menses.

Coumarins in the root may increase photosensitivity and anticoagulant effect — sun protection matters. Pregnancy is generally contraindicated because moving blood herbs can stimulate uterine activity. Ferulic acid and ligustilide are marker compounds in quality control. Ethical sourcing uses cultivated Sichuan and Gansu fields, not endangered wild populations.`,
  },
  'reishi-lingzhi': {
    imageUrl: W.mushroom,
    imageCredit: 'Ganoderma lucidum — Wikimedia Commons',
    deepDive: `Ling Zhi (Ganoderma lucidum) appears in Chinese art as the fungus of immortals — a lacquered shelf mushroom on hardwood stumps. TCM classifies it as calming the spirit (An Shen), augmenting Qi, and benefiting cough and wheezing. Japanese reishi (mannentake) and Korean yeongji share the same reverence.

Beta-glucans and triterpenes are the main research compounds — immune modulation, mild sedative effect, and liver enzyme support in some trials. Dual extraction (hot water plus alcohol) captures both polysaccharides and triterpenes; mushroom coffee blends often use mycelium on grain, which is cheaper but different chemically from fruiting bodies.

Reishi is generally safe but bitter; GI upset happens. It is not a substitute for sleep hygiene or psychiatric care. Pacific Northwest foragers know related Ganoderma oregonense and G. applanatum — local polypores with overlapping tradition but less clinical data. Always cross-reference the plant library’s turkey tail and lion’s mane entries for regional fungi.`,
  },
  'schisandra-wu-wei-zi': {
    imageUrl: W.berries,
    deepDive: `Wu Wei Zi — “five flavor berry” — captures the classical Chinese description of Schisandra chinensis: sour and sweet fruit, with bitter, pungent, and salty aspects attributed to seed and peel. It enters Lung, Heart, and Kidney meridians in TCM, astringing sweat and semen, generating fluids, and calming the spirit.

Russian research in the mid-twentieth century branded schisandra an “adaptogen” for workers and athletes — improving endurance and accuracy in some controlled settings. Modern use spans liver support (especially in combination formulas), night sweats, and chronic cough.

The berries are intensely sour — a few chewed before meals can stimulate digestion. Tinctures and standardized extracts are easier for daily use. Schisandra stimulates liver CYP enzymes mildly — drug interactions are possible. It is often combined in Sheng Mai San with ginseng and ophiopogon for Qi and Yin collapse after febrile illness.`,
  },
  'goji-gou-qi-zi': {
    imageUrl: W.berries,
    imageCredit: 'Goji berries — Wikimedia Commons',
    deepDive: `Gou Qi Zi (Lycium barbarum) brightens TCM formulas for Liver and Kidney Yin deficiency — dry eyes, blurred vision, dizziness, and low back weakness after chronic illness. The berries are eaten dried, added to soups, and steeped in tea across China and increasingly worldwide.

Zeaxanthin and polysaccharides dominate supplement marketing — eye health and antioxidant claims abound. Human trials on metabolic markers and immune function exist but are heterogeneous. Culinary amounts in trail mix are generally safe; concentrated powders raise warfarin interaction reports.

Growing goji in home gardens is possible in sunny climates; commercial production concentrates in Ningxia, China. Distinguish from wolfberry relatives and decorative winterberry hollies — only Lycium species belong in the cup. Pair with chrysanthemum tea for screen-fatigue rituals; pair with caution if on blood thinners.`,
  },
  'licorice-gan-cao': {
    imageUrl: W.herbs,
    deepDive: `Gan Cao (Glycyrrhiza glabra) is the great harmonizer — added to more Chinese formulas than any other herb to sweeten taste, moderate harsh herbs, and coordinate the blend. Western herbalism uses it as a demulcent for sore throat and gastric lining support. Deglycyrrhizinated licorice (DGL) removes the compound that causes mineralocorticoid excess.

Glycyrrhizin inhibits 11-beta-hydroxysteroid dehydrogenase, allowing cortisol to act longer on kidneys — raising blood pressure and lowering potassium. Chronic high-dose licorice candy or root extract has sent people to the ER with pseudoaldosteronism. Short-term throat tea is different from daily adrenal protocols.

In TCM, honey-fried licorice (Zhi Gan Cao) tonifies Qi and moderates spasms; raw licorice clears heat and detoxifies in specific patterns. Respect the herb’s power — it is not benign candy. Pharmacists should review any formula containing licorice if you take digoxin, diuretics, or hypertension medication.`,
  },
  'holy-basil-tulsi': {
    imageUrl: W.tea,
    deepDive: `Tulsi (Ocimum tenuiflorum) is sacred in Hindu tradition — planted by doorways and brewed as prasada (blessed offering). Ayurveda classifies it as a Rasayana and adaptogen for stress, respiratory congestion, and metabolic balance. Three chemotypes (methyl chavicol, eugenol, sesquiterpene) smell different — clove-like Krishna tulsi is common in supplements.

Studies report cortisol reduction, improved sleep quality, and modest blood sugar and lipid improvements over eight weeks. Mechanisms may include COX inhibition and HPA axis modulation. Fresh leaf tea is gentle; extracts concentrate active oils.

Tulsi is not culinary sweet basil — the flavor is peppery and intense. Grow it as an annual in Oregon summers or indoors under light. Avoid medicinal doses in pregnancy. Combine with lemon balm for evening wind-down; combine with care if on insulin or sulfonylureas.`,
  },
  triphala: {
    imageUrl: W.herbs,
    deepDive: `Triphala — “three fruits” — combines Amalaki (Emblica officinalis), Bibhitaki (Terminalia bellirica), and Haritaki (Terminalia chebula) in equal parts. It is among the safest entry points to Ayurvedic bowel care: gentle, tonifying, and antioxidant-rich rather than harshly laxative.

Haritaki alone is called the “king of medicines” in some texts — astringent and bowel-regulating. Amalaki is cooling and vitamin C-rich; Bibhitaki supports respiratory and digestive Kapha. Together they balance Vata, Pitta, and Kapha in classical theory.

Powder stirred in warm water at bedtime works over one to three nights for many constipated users; others take a smaller maintenance dose. Taste is challenging — capsules help. Triphala is not appropriate for acute diarrhea, inflammatory bowel flare, or pregnancy. Quality brands test for heavy metals — important for fruit imports.`,
  },
  'bacopa-brahmi': {
    imageUrl: W.herbs,
    deepDive: `Brahmi in modern commerce usually means Bacopa monnieri — a creeping wetland herb with small succulent leaves. Ancient texts describe Medhya (intellect-promoting) effects: memory, learning, and anxiety. Bacosides are the marker compounds; fat-soluble, so take with meals.

Meta-analyses of randomized trials suggest small improvements in memory free recall and attention after chronic use — not a single-dose study drug. Onset is weeks, not hours. Traditional preparation includes fresh juice, ghrita (medicated ghee), and syrup with sugar — modern extracts standardize bacoside A and B.

Side effects are usually GI — nausea if taken empty stomach. Thyroid hormone interaction is theoretical. Do not confuse with Gotu kola (Centella), also sometimes called brahmi in regional dialects. For cognitive decline, medical evaluation comes first — herbs are adjuncts, not dementia treatment.`,
  },
  'milk-thistle': {
    imageUrl: W.herbs,
    deepDive: `Milk thistle (Silybum marianum) wears white marbling on spiny leaves — folklore says it is Mary’s milk. The seed contains silymarin, a flavonolignan complex that stabilizes hepatocyte membranes and upregulates glutathione in animal models. Human data supports adjunct use in alcoholic liver disease, NAFLD, and toxin exposure (including death cap mushroom protocols in European emergency medicine alongside conventional care).

Standardized extracts at 140–420 mg silymarin daily are common. Whole seed ground in capsules is less predictable. Milk thistle does not license continued alcohol abuse or replace hepatitis treatment.

Allergy to aster family plants is a contraindication. It may slow metabolism of some drugs through CYP inhibition at high doses — pharmacist review helps. The plant naturalizes in dry Oregon valleys — a garden weed with purple thistle flowers, distinct from blessed thistle (Cnicus).`,
  },
  'valerian-sleep': {
    imageUrl: W.tea,
    deepDive: `Valerian (Valeriana officinalis) root smells like old socks — valeric acid and isovaleric acid divide households. Yet Roman and Greek physicians used it for insomnia; German Commission E approved it for sleep and nervous restlessness. Mechanism likely involves GABA-A modulation and adenosine pathways rather than direct sedation like benzodiazepines.

Meta-analyses show reduced sleep latency and improved subjective quality — effect sizes are modest. Hops (Humulus lupulus), passionflower, and lemon balm are traditional partners. Tea requires covered steeping to retain volatile oils; many prefer standardized extract capsules at 300–600 mg before bed.

Hangover-like grogginess means dose titration matters. Never combine with alcohol, opioids, or prescription sedatives without medical supervision. Withdrawal is rare but taper if used nightly for months. Valerian grows in moist Oregon meadows — cultivate from seed rather than wild-digging rare native Valeriana species.`,
  },
  'echinacea-immune': {
    imageUrl: W.herbs,
    deepDive: `Echinacea — purple coneflower of the North American prairie — was adopted by Eclectic physicians in the nineteenth century and remains the top-selling cold herb in US markets. Echinacea angustifolia root was the classic species; E. purpurea aerial and seed are now common in commerce. Alkamides, polysaccharides, and caffeic acid derivatives all contribute immunomodulatory activity.

Best evidence supports starting at first cold symptoms — some trials show one to two days shorter duration; prevention data is weaker. Traditional dosing is frequent small doses in the first 24 hours (tincture every few hours), then taper — not one pill weekly all winter.

Aster allergy contraindicates use. Autoimmune conditions require rheumatology input — “immune boosting” is oversimplified. Quality products show pungent tongue tingling from alkamides. Grow E. purpurea in pollinator gardens — beautiful, drought-tolerant, and ethical compared to wild-harvested endangered angustifolia roots.`,
  },
  'st-johns-wort': {
    imageUrl: W.herbs,
    deepDive: `St. John’s wort (Hypericum perforatum) blooms around June 24 — St. John’s Day — with perforated leaves (hold to light) and red oil glands in yellow petals. European folk use for wounds and nerves became twentieth-century depression research; several trials show benefit comparable to low-dose SSRIs for mild-to-moderate depression.

Hyperforin and hypericin induce cytochrome P450 enzymes — especially CYP3A4 — accelerating clearance of birth control pills, HIV protease inhibitors, transplant immunosuppressants, warfarin, and many chemotherapies. This is not a rare interaction; it is pharmacology. Serotonin syndrome risk exists if combined with antidepressants without supervision.

Photosensitivity can burn fair-skinned users in bright sun. Standardized 0.3% hypericin extracts are typical; allow four to six weeks before judging mood response. Wild harvest is possible in Oregon dry meadows — ID carefully; avoid confused St. John’s wort lookalikes. For moderate-to-severe depression or suicidal thoughts, professional mental health care is urgent — herbs are not enough.`,
  },
  'devils-club-pnw': {
    imageUrl: W.forest,
    imageCredit: 'Pacific Northwest forest — Wikimedia Commons',
    deepDive: `Devil’s club (Oplopanax horridus) commands respect — chest-high spines on stems and leaves, growing in coastal rainforest shade from Alaska to Oregon. Indigenous nations of the Pacific Northwest have long relationships with this plant for spiritual protection, rheumatism, diabetes, and ceremonial bathing. It is not a casual foraging herb.

Ethical engagement means learning from tribal sources, never harvesting on reservation lands without permission, and avoiding commodification that strips cultural context. Pacific Northwest clinical herbalists use small amounts of inner bark tincture — intensely bitter, blood sugar lowering — often taught alongside Oregon grape and cascara in regional programs.

Spine wounds are painful and slow to heal. Blood sugar medications plus devil’s club risk hypoglycemia. The plant is abundant in some watersheds and rare in others — never girdle stems. Cross-link to the plant library entry for field ID photos and look-alike warnings.`,
  },
  'oregon-grape-root': {
    imageUrl: W.forest,
    deepDive: `Oregon grape (Mahonia aquifolium) is Oregon’s state flower — evergreen holly-like leaves, yellow spring flowers, sour blue berries. The yellow root bark contains berberine, the same alkaloid that made goldenseal (Hydrastis canadensis) famous — and endangered from overharvest. Oregon grape is the ethical PNW alternative when sourced from abundant patches or cultivation.

Berberine is antimicrobial, bitter digestive, and studied in topical creams for mild psoriasis. Internal use stimulates bile flow — helpful for some sluggish digestion, contraindicated in pregnancy and gallbladder obstruction. Root harvest kills the plant if done carelessly; sustainable practice takes lateral roots from large colonies or buys cultivated tincture.

Do not confuse with invasive English holly (Ilex aquifolium) — unrelated and not medicinal. The plant library entry covers berry edibility (tart, seeds) vs root medicine. Herbalists pair Oregon grape with dandelion and artichoke leaf in bitter digestive blends.`,
  },
  'ginger-sheng-jiang': {
    imageUrl: W.ginger,
    imageCredit: 'Ginger rhizome — Wikimedia Commons',
    deepDive: `Ginger (Zingiber officinale) bridges kitchen and clinic worldwide. In TCM, fresh Sheng Jiang disperses cold, warms the middle, and stops vomiting — classic for morning sickness (with obstetric approval), motion sickness, and seafood toxicity patterns. Dried Gan Jiang is hotter, going deeper to warm Yang and rescue devastated interior cold.

Gingerols and shogaols stimulate digestion, modulate nausea via 5-HT3 pathways, and show anti-inflammatory activity. Human trials support nausea reduction in pregnancy, post-op, and chemotherapy — doses vary from candy to capsules.

High doses may increase bleeding risk with anticoagulants; culinary amounts are usually fine. Gallstone patients should note cholagogue effect. Grow ginger indoors in Oregon — buy organic rhizome, sprout in moist potting mix, harvest small roots after months of growth. Combine with honey and lemon for winter tea; combine with caution if on warfarin at supplemental doses.`,
  },
  'herbal-teas-decoctions': {
    imageUrl: W.tea,
    imageCredit: 'Herbal tea — Wikimedia Commons',
    deepDive: `Preparation separates hobby tea from effective herbal medicine. Delicate volatile oils in peppermint, chamomile, and linden need short infusions — boiling water poured over herb, covered to trap steam, steeped five to fifteen minutes. Hard plant parts — roots, bark, seeds, mushrooms — need decoction: cold water brought to simmer, held twenty to forty-five minutes, strained.

Mushrooms like reishi and chaga may simmer for hours. Some traditions do overnight slow cooks. Tinctures macerate herbs in alcohol or glycerin for weeks, extracting constituents water misses. Dose by drop or milliliter; alcohol-based tinctures are concentrated.

Water chemistry matters — hard water can dull extraction. Storage in amber glass away from heat preserves potency. Wildcraft only with 100% identification; the plant library exists for field ID, not guesswork. Children, pregnancy, and medication lists change which preparations are safe — when in doubt, consult a clinical herbalist or licensed provider.`,
  },
};

export function applyHerbsExpanded<T extends { id: string; summary: string }>(
  topics: T[],
): (T & ExpandedFields)[] {
  return topics.map((topic) => {
    const extra = HERBS_TOPIC_EXPANDED[topic.id];
    if (!extra) {
      return {
        ...topic,
        imageUrl: W.herbs,
        imageCredit: 'Wikimedia Commons',
        deepDive: topic.summary,
      };
    }
    return { ...topic, ...extra };
  });
}
