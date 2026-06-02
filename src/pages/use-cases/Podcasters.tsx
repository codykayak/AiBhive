import UseCasePage from '../../components/UseCasePage';
import heroImage from '../../grow_content_creators_podcator_veiwership_translations.png';

export default function Podcasters() {
  return (
    <UseCasePage
      seo={{
        title: 'AI Translation & Voice Cloning for Podcasters | AiBhive',
        description:
          'Turn one podcast episode into a multilingual show network. AiBhive uses multi-agent AI to transcribe, translate, and clone your voice in 10+ languages without losing your tone or personality.',
        keywords:
          'podcast translation, podcast transcription, multilingual podcast, AI dubbing for podcasts, voice cloning podcast, AiBhive podcasters',
      }}
      eyebrow="For Podcasters"
      title="One episode."
      highlight="Every language."
      subtitle="AiBhive turns your podcast into a multilingual show network — same voice, same emotion, ten times the audience."
      heroImage={heroImage}
      heroAlt="Podcaster reaching a global audience with AI translation and voice cloning"
      stats={[
        { value: '2-5x', label: 'Listener growth' },
        { value: '<30 min', label: 'Turnaround per hour' },
        { value: '10+', label: 'Languages' },
        { value: '99.9%', label: 'Transcript accuracy' },
      ]}
      intro={
        <>
          <p>
            Podcasting is the most intimate medium on the internet — and the one most limited by
            language. Even the biggest English-language shows leave 80% of the world's listeners
            on the table. AiBhive fixes that without changing how you record.
          </p>
          <p>
            Drop in your raw episode. Our Hive transcribes it with legal-grade accuracy,
            translates it with cultural nuance, and re-voices it in your own cloned voice across
            ten or more languages. You ship one show; we ship the network.
          </p>
        </>
      }
      sections={[
        {
          heading: 'A real workflow for solo podcasters',
          body: (
            <>
              <p>
                Most translation tools force you to choose between speed and quality. AiBhive
                doesn't. Upload your episode in any common format (MP3, WAV, M4A, MP4). Within
                minutes you get back a clean transcript, a translated script, and audio dubbed in
                your own voice — ready for upload to a localized feed.
              </p>
              <p>
                The whole pipeline is built around the fastest possible turnaround for
                independent creators. A 60-minute episode is typically delivered in under
                30 minutes, which means you can dub your show on the same day you publish it.
                No batching, no waiting for a translator overseas, no rerecording.
              </p>
              <p>
                For interview podcasts, the Hive can speaker-diarize multi-person audio and
                preserve who said what across the translation. Your guest still sounds like your
                guest in Spanish, Portuguese, or Hindi.
              </p>
            </>
          ),
        },
        {
          heading: 'Why voice cloning matters more for podcasts than for video',
          body: (
            <>
              <p>
                Listeners pick podcasts based on the host's voice. Generic
                text-to-speech destroys that bond instantly. Voice cloning preserves it.
              </p>
              <p>
                AiBhive's Voice Clone Lab trains on as little as 30 seconds of clean reference
                audio and can deliver multilingual output that keeps your prosody, your pace, and
                even subtle vocal mannerisms. The result is a Spanish or German version of your
                show that sounds like <em>you</em>, not a Siri impersonation.
              </p>
              <p>
                For ad reads in particular, this is a unicorn. Podcast sponsors are willing to pay
                a meaningful premium for native-language host-read ads because they convert
                better — and you can now offer that to international advertisers without ever
                touching a microphone again.
              </p>
            </>
          ),
        },
        {
          heading: 'SEO and discovery: the underrated win',
          body: (
            <>
              <p>
                The transcripts AiBhive produces are not just internal documents. They are the
                single highest-impact SEO asset a podcaster has. Search engines cannot listen to
                an MP3, but they can rank a 5,000-word transcript every week.
              </p>
              <p>
                Publish the transcript on your show notes page in every language you've
                translated to, and you go from being one English podcast to being a multilingual
                blog network — each episode crawlable, citable, and shareable on social media in
                its native script.
              </p>
              <p>
                Combine that with a sitemap entry per language and you've quietly built one of
                the strongest topical authority signals available to a creator at any scale.
              </p>
            </>
          ),
        },
      ]}
      checklistTitle="Why podcasters pick AiBhive"
      checklist={[
        'Voice cloning that preserves emotion in 10+ languages',
        'Speaker-diarized transcripts for interview shows',
        'Sub-30-minute turnaround for a 60-minute episode',
        'Cultural translation, not literal word-swapping',
        'Translated transcripts ready for show notes SEO',
        'No subscription required — pay only per episode',
      ]}
      faqs={[
        {
          q: 'Do I need to re-record anything?',
          a: 'No. Upload your final mixed episode and AiBhive does the rest. The output is publish-ready audio in your cloned voice in the languages you choose.',
        },
        {
          q: 'How long does voice cloning take the first time?',
          a: 'About 24 hours from your reference sample. After that, generating new episodes in your cloned voice is near-instant.',
        },
        {
          q: 'Can I publish the translated episodes as separate feeds?',
          a: 'Yes. Most podcasters set up one feed per language so each language has its own discovery surface in Apple Podcasts and Spotify. We deliver clean MP3 files you can drop straight into your podcast host.',
        },
        {
          q: 'What about copyrighted music or sponsor segments?',
          a: 'You can either keep them in the original language or have us replace just the host-read sections. We will not modify segments you exclude.',
        },
      ]}
      ctaTitle="Start with your latest episode"
      ctaSubtitle="Upload it, pick your languages, and you'll have a multilingual podcast network by the end of the day."
      ctaButton="Translate an Episode"
    />
  );
}
