import * as React from 'react';
import Link from 'next/link';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import GoogleSignInButton from '@/components/common/components/GoogleSignInButton';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatNoneShare, getNoneShare, getWinner} from '@/lib/roast/PhotoResults';
import {voiceStyle} from '@/lib/roast/VoiceStyle';
import {FlavorResDto, PhotoCaptionResDto, PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import FlavorChip from './FlavorChip';
import LandingHero from './LandingHero';
import RevealedOption from './RevealedOption';
import Countdown from './Countdown';
import styles from './roast.module.css';

// The photos of closed batches that the page draws its examples from, the most picked first: enough for every
// section to show captions that no other section shows
const ExampleCount = 24;
const GalleryCount = 4;
const FanCount = 5;

// The product's landing page: what it is, how a day of it goes, its voices, its best roasts, and the way in.
// Every example on it is a real photo of a closed batch, with the captions and the votes it got.
export default function LandingView() {
  const { viewer, viewerLoaded, paths, notify } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);
  const [flavors, setFlavors] = React.useState<FlavorResDto[]>([]);
  // Null until the examples load
  const [photos, setPhotos] = React.useState<PhotoResDto[] | null>(null);

  React.useEffect(() => {
    roastLogic.fetchFlavors().then(setFlavors, (error: Error) => notify(error.message));
    roastLogic.fetchTopPhotos('all', ExampleCount, 0).then(setPhotos, (error: Error) => {
      setPhotos([]);
      notify(error.message);
    });
  }, [roastLogic, notify]);

  const examples = photos ?? [];
  const front = findMostVoted(examples, isSplit);
  const demo = findMostVoted(
    examples.filter((photo) => photo !== front),
    isShared,
  );
  const favorites = examples.filter((photo) => photo !== front && photo !== demo).slice(0, GalleryCount);
  const spare = examples.filter((photo) => photo !== front && photo !== demo && !favorites.includes(photo));

  return (
    <div className={styles.landing}>
      <LandingHero
        actions={
          viewerLoaded &&
          (viewer ? (
            <>
              <Link href={paths.today} className={styles.button}>
                Play today&apos;s batch
              </Link>
              <Link href={paths.top} className={styles.buttonGhost}>
                Top roasts
              </Link>
            </>
          ) : (
            <>
              <Link href={paths.today} className={styles.heroBrowse}>
                Browse today&apos;s batch
              </Link>
              <div className={styles.heroSignIn}>
                <GoogleSignInButton />
              </div>
            </>
          ))
        }
        aside={
          photos === null ? (
            <ShowcaseSkeleton />
          ) : (
            front && <Showcase front={front} back={examples.find((photo) => photo !== front)} />
          )
        }
      />
      <Steps photos={examples.slice(0, FanCount)} demo={demo} />
      {flavors.length > 0 && <Voices flavors={flavors} spare={spare} examples={examples} />}
      {favorites.length > 0 && <Gallery photos={favorites} />}
      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.ctaBody}>
          <span className={styles.ctaMark} aria-hidden="true">
            <LocalFireDepartmentRoundedIcon fontSize="inherit" />
          </span>
          <h2 id="cta-title" className={styles.landingTitle}>
            Today&apos;s batch is open.
          </h2>
          <div className={styles.actions}>
            <Link href={paths.today} className={styles.button}>
              {viewer ? "Play today's batch" : "Browse today's batch"}
            </Link>
            <Link href={paths.roast} className={styles.buttonGhost}>
              Upload your own photo
            </Link>
          </div>
          {/* After the first render, so that the build's clock never reaches the page */}
          {viewerLoaded && <Countdown />}
        </div>
      </section>
    </div>
  );
}

const countPicked = (photo: PhotoResDto) => photo.captions.filter((caption) => (caption.picks ?? 0) > 0).length;
// A card where one caption took every vote shows 100% beside two 0%, which reads as a vote nobody took part in
const isSplit = (photo: PhotoResDto) => countPicked(photo) > 1;
const isShared = (photo: PhotoResDto) => countPicked(photo) === photo.captions.length;

// The example with the most voters among those that `isFit` holds for, then among the others; of two with as
// many voters, the one whose picks are spread over more captions
function findMostVoted(photos: PhotoResDto[], isFit: (photo: PhotoResDto) => boolean): PhotoResDto | undefined {
  return [...photos].sort(
    (a, b) =>
      Number(isFit(b)) - Number(isFit(a)) ||
      (b.voters ?? 0) - (a.voters ?? 0) ||
      countPicked(b) - countPicked(a),
  )[0];
}

// The voters that no caption's share counts, as the product's card tells them in its verdict
function NoneNote({ photo }: { photo: PhotoResDto }) {
  return (
    <p className={styles.noneNote}>
      Picked none
      <span className={styles.optionShare}>{formatNoneShare(photo)}</span>
    </p>
  );
}

function ShowcaseSkeleton() {
  return (
    <div className={styles.showcase} role="status" aria-label="Loading">
      <div className={styles.showcaseCard}>
        <div className={`${styles.photo} ${styles.skeleton}`} />
        <div className={styles.options}>
          {[0, 1, 2].map((index) => (
            <div key={index} className={`${styles.skeleton} ${styles.skeletonOption}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// A photo with a split vote, as its card shows it after the reveal, over another photo
function Showcase({ front, back }: { front: PhotoResDto; back: PhotoResDto | undefined }) {
  const { paths } = useRoast();
  const winnerId = getWinner(front)?.id;

  return (
    <div className={styles.showcase}>
      {back && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={back.url} alt="" className={styles.showcaseBack} aria-hidden="true" />
      )}
      <Link href={paths.photo(front.id)} className={styles.showcaseCard} data-fresh={false}>
        <span className={`${styles.tag} ${styles.showcaseTag}`}>
          <EmojiEventsRoundedIcon sx={{ fontSize: 14 }} />
          Top roast
        </span>
        <figure className={styles.photo}>
          {/* The photo is served from object storage, outside the image optimizer */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={front.url} alt={front.description} className={styles.photoImage} />
          {front.place && (
            <figcaption className={styles.photoMeta}>
              <span className={styles.pill}>
                <PlaceRoundedIcon sx={{ fontSize: 16 }} />
                {front.place}
              </span>
            </figcaption>
          )}
        </figure>
        <ol className={styles.options}>
          {front.captions.map((caption) => (
            <li key={caption.id}>
              <RevealedOption photo={front} caption={caption} isWinner={caption.id === winnerId} plainVoice />
            </li>
          ))}
        </ol>
        {getNoneShare(front) > 0 && <NoneNote photo={front} />}
      </Link>
    </div>
  );
}

// A day of the game in 3 steps, each shown with the product's own pieces filled with real examples.
// Steps 2 and 3 show one photo with its choices, before the pick and after it, row beside row.
function Steps({ photos, demo }: { photos: PhotoResDto[]; demo: PhotoResDto | undefined }) {
  const winnerId = demo && getWinner(demo)?.id;

  return (
    <section className={styles.landingSection} aria-labelledby="steps-title">
      <h2 id="steps-title" className={styles.landingTitle}>
        3 steps, once a day
      </h2>
      <ol className={styles.stepGrid}>
        <li className={styles.stepCard}>
          {photos.length > 0 && (
            <div className={styles.stepVisual}>
              <div className={styles.fan}>
                {photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.id} src={photo.url} alt="" className={styles.fanPhoto} loading="lazy" />
                ))}
              </div>
            </div>
          )}
          <StepText number={1} title="5 new photos at midnight" />
        </li>
        <li className={styles.stepCard}>
          {demo && (
            <div className={styles.stepList}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={demo.url} alt="" className={styles.stepPhoto} loading="lazy" />
              {demo.captions.map((caption) => (
                <div key={caption.id} className={styles.option} data-hover={caption.id === winnerId}>
                  <div className={`${styles.optionBody} ${styles.optionChoice}`}>
                    <span className={styles.optionMark} aria-hidden="true" />
                    <div className={styles.optionText}>{caption.content}</div>
                  </div>
                  {caption.id === winnerId && <TouchAppRoundedIcon className={styles.tapMark} />}
                </div>
              ))}
              <div className={`${styles.option} ${styles.noneOption}`}>
                <div className={`${styles.optionBody} ${styles.optionChoice}`}>
                  <span className={styles.optionMark} aria-hidden="true" />
                  <div className={styles.optionText}>None of these is funny</div>
                </div>
              </div>
            </div>
          )}
          <StepText number={2} title="Tap the funniest caption" />
        </li>
        <li className={styles.stepCard}>
          {demo && (
            <div className={styles.stepList} data-fresh={false}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={demo.url} alt="" className={styles.stepPhoto} loading="lazy" />
              {demo.captions.map((caption) => (
                <RevealedOption key={caption.id} photo={demo} caption={caption} isWinner={caption.id === winnerId} />
              ))}
              <NoneNote photo={demo} />
            </div>
          )}
          <StepText number={3} title="See which AI voice wrote it" />
        </li>
      </ol>
    </section>
  );
}

interface StepTextProps {
  number: number;
  title: string;
}

function StepText({ number, title }: StepTextProps) {
  return (
    <div className={styles.stepHead}>
      <span className={styles.stepNumber}>{number}</span>
      <h3 className={styles.stepTitle}>{title}</h3>
    </div>
  );
}

interface Quote {
  photo: PhotoResDto;
  caption: PhotoCaptionResDto;
}

const listQuotes = (photos: PhotoResDto[]): Quote[] =>
  photos.flatMap((photo) => photo.captions.map((caption) => ({ photo, caption })));

// A caption for each voice among the photos, each voice's on a photo of its own: the captions take their voices in
// the order of their picks, then of their photos' voters, and a caption is passed over when its voice has one or
// its photo is taken
function assignQuotes(photos: PhotoResDto[]): Map<string, Quote> {
  const assigned = new Map<string, Quote>();
  const quotes = listQuotes(photos).sort(
    (a, b) => (b.caption.picks ?? 0) - (a.caption.picks ?? 0) || (b.photo.voters ?? 0) - (a.photo.voters ?? 0),
  );
  for (const quote of quotes) {
    const slug = quote.caption.flavor?.slug;
    if (slug && !assigned.has(slug) && [...assigned.values()].every(({ photo }) => photo !== quote.photo)) {
      assigned.set(slug, quote);
    }
  }
  return assigned;
}

// The voice's most picked caption on the photos
function findBestQuote(photos: PhotoResDto[], slug: string): Quote | undefined {
  return listQuotes(photos)
    .filter(({ caption }) => caption.flavor?.slug === slug)
    .sort((a, b) => (b.caption.picks ?? 0) - (a.caption.picks ?? 0))
    .at(0);
}

interface VoicesProps {
  flavors: FlavorResDto[];
  // The examples that no other section shows
  spare: PhotoResDto[];
  examples: PhotoResDto[];
}

// The voices after the section's title in one grid, each with a caption of its own beside the caption's photo: one
// among the spare examples, then its most picked one among all the examples; its tagline while it has none
function Voices({ flavors, spare, examples }: VoicesProps) {
  const assigned = assignQuotes(spare);

  return (
    <section className={styles.voiceGrid} aria-labelledby="voices-title">
      <h2 id="voices-title" className={styles.landingTitle}>
        {flavors.length} AI voices compete for every photo
      </h2>
      {flavors.map((flavor) => {
        const quote = assigned.get(flavor.slug) ?? findBestQuote(examples, flavor.slug);
        return (
          <article key={flavor.slug} className={styles.voiceCard} style={voiceStyle(flavor)}>
            <div className={styles.voiceTop}>
              <h3 className={styles.voiceName}>{flavor.name}</h3>
              {quote && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quote.photo.url} alt="" className={styles.voiceThumb} loading="lazy" />
              )}
            </div>
            {quote ? (
              <p className={styles.voiceQuote}>&ldquo;{quote.caption.content}&rdquo;</p>
            ) : (
              <p className={styles.voiceTagline}>{flavor.tagline}</p>
            )}
          </article>
        );
      })}
    </section>
  );
}

// The most picked photos of the closed batches, each over its winning caption
function Gallery({ photos }: { photos: PhotoResDto[] }) {
  const { paths } = useRoast();

  return (
    <section className={styles.gallerySection} aria-labelledby="gallery-title">
      <h2 id="gallery-title" className={styles.landingTitle}>
        The crowd&apos;s favorites
      </h2>
      <Link href={paths.top} className={styles.moreLink}>
        All top roasts
      </Link>
      <div className={styles.gallery}>
        {photos.map((photo) => (
          <FavoriteTile key={photo.id} photo={photo} />
        ))}
      </div>
    </section>
  );
}

function FavoriteTile({ photo }: { photo: PhotoResDto }) {
  const { paths } = useRoast();
  const winner = getWinner(photo);
  if (!winner) {
    throw new Error('A photo of the top list has no winning caption');
  }

  return (
    <Link href={paths.photo(photo.id)} className={styles.favorite}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.description} className={styles.favoritePhoto} loading="lazy" />
      <div className={styles.favoriteBody}>
        <p className={styles.favoriteCaption}>{winner.content}</p>
        {winner.flavor && <FlavorChip flavor={winner.flavor} plain />}
      </div>
    </Link>
  );
}
