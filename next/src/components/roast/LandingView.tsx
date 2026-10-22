import * as React from 'react';
import Link from 'next/link';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import GoogleSignInButton from '@/components/common/components/GoogleSignInButton';
import RoastLogic from '@/lib/roast/RoastLogic';
import {getWinner} from '@/lib/roast/PhotoResults';
import {FlavorResDto, PhotoCaptionResDto, PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import LandingHero from './LandingHero';
import RevealedOption from './RevealedOption';
import TopTile from './TopTile';
import Countdown from './Countdown';
import styles from './roast.module.css';

// The photos of closed batches that the page shows as its examples, the most picked first
const ExampleCount = 8;
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
              <div className={styles.heroSignIn}>
                <GoogleSignInButton />
              </div>
              <Link href={paths.today} className={styles.linkButton}>
                Browse today&apos;s batch
              </Link>
            </>
          ))
        }
        aside={photos?.length === 0 ? undefined : <Showcase photos={photos} />}
      />
      <Steps photos={examples} />
      {flavors.length > 0 && <Voices flavors={flavors} photos={examples} />}
      {examples.length > 0 && <Gallery photos={examples.slice(0, GalleryCount)} />}
      <Features />
      <section className={styles.cta} aria-labelledby="cta-title">
        <span className={styles.ctaMark} aria-hidden="true">
          <LocalFireDepartmentRoundedIcon sx={{ fontSize: 280 }} />
        </span>
        <div className={styles.ctaBody}>
          <h2 id="cta-title" className={styles.landingTitle}>
            Today&apos;s batch is open.
          </h2>
          <p className={styles.landingText}>5 photos, 3 captions each, 1 tap per photo.</p>
          <Link href={paths.today} className={styles.button}>
            Play today&apos;s batch
          </Link>
          {/* After the first render, so that the build's clock never reaches the page */}
          {viewerLoaded && <Countdown />}
        </div>
      </section>
    </div>
  );
}

// The most picked photo of the closed batches, as its card shows it after the reveal, over the second one
function Showcase({ photos }: { photos: PhotoResDto[] | null }) {
  const { paths } = useRoast();

  if (photos === null) {
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

  const [front, back] = photos;
  if (!front) {
    throw new Error('The showcase is given no photo');
  }
  const winnerId = getWinner(front)?.id;

  return (
    <div className={styles.showcase}>
      {back && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={back.url} alt="" className={styles.showcaseBack} aria-hidden="true" />
      )}
      <Link href={paths.photo(front.id)} className={styles.showcaseCard}>
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
              <RevealedOption photo={front} caption={caption} isWinner={caption.id === winnerId} />
            </li>
          ))}
        </ol>
      </Link>
    </div>
  );
}

// A day of the game in 3 steps, each shown with the product's own pieces filled with real examples
function Steps({ photos }: { photos: PhotoResDto[] }) {
  // The examples after the hero's, where there are enough
  const choice = photos.at(1) ?? photos.at(0);
  const reveal = photos.at(2) ?? photos.at(0);
  const revealWinnerId = reveal ? getWinner(reveal)?.id : undefined;

  return (
    <section className={styles.landingSection} aria-labelledby="steps-title">
      <div className={styles.sectionIntroCenter}>
        <p className={styles.eyebrow}>How it works</p>
        <h2 id="steps-title" className={styles.landingTitle}>
          3 steps, once a day
        </h2>
      </div>
      <ol className={styles.stepGrid}>
        <li className={styles.stepCard}>
          {photos.length > 0 && (
            <div className={styles.stepVisual}>
              <div className={styles.fan}>
                {photos.slice(0, FanCount).map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.id} src={photo.url} alt="" className={styles.fanPhoto} loading="lazy" />
                ))}
              </div>
            </div>
          )}
          <StepText number={1} title="A batch drops at midnight">
            5 photos from campus and the city, new every day.
          </StepText>
        </li>
        <li className={styles.stepCard}>
          {choice && (
            <div className={styles.stepVisual}>
              {choice.captions.map((caption, index) => (
                <div key={caption.id} className={styles.option} data-hover={index === 0}>
                  <div className={`${styles.optionBody} ${styles.optionChoice}`}>
                    <span className={styles.optionMark} aria-hidden="true" />
                    <div className={styles.optionText}>{caption.content}</div>
                    {index === 0 && (
                      <TouchAppRoundedIcon sx={{ flex: 'none', ml: 'auto', fontSize: 20, color: 'var(--dr-ink)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <StepText number={2} title="Pick the funniest caption">
            3 AI voices write one caption each. You vote before you know who wrote what.
          </StepText>
        </li>
        <li className={styles.stepCard}>
          {reveal && (
            <div className={styles.stepVisual}>
              {reveal.captions.map((caption) => (
                <RevealedOption
                  key={caption.id}
                  photo={reveal}
                  caption={caption}
                  isWinner={caption.id === revealWinnerId}
                />
              ))}
            </div>
          )}
          <StepText number={3} title="See who wrote it">
            Then the voices, the crowd&apos;s picks, and whether you agree with them.
          </StepText>
        </li>
      </ol>
    </section>
  );
}

interface StepTextProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function StepText({ number, title, children }: StepTextProps) {
  return (
    <div className={styles.stepHead}>
      <span className={styles.stepNumber}>{number}</span>
      <div>
        <h3 className={styles.stepTitle}>{title}</h3>
        <p className={styles.stepText}>{children}</p>
      </div>
    </div>
  );
}

// The caption of the voice that the crowd picked most among the examples; none while no caption of it has a pick
function findBestCaption(photos: PhotoResDto[], slug: string): PhotoCaptionResDto | undefined {
  return photos
    .flatMap((photo) => photo.captions)
    .filter((caption) => caption.flavor?.slug === slug && (caption.picks ?? 0) > 0)
    .sort((a, b) => (b.picks ?? 0) - (a.picks ?? 0))
    .at(0);
}

// The 5 voices, each with its tagline and its best caption so far
function Voices({ flavors, photos }: { flavors: FlavorResDto[]; photos: PhotoResDto[] }) {
  return (
    <section className={styles.landingSection} aria-labelledby="voices-title">
      <div className={styles.sectionIntroCenter}>
        <p className={styles.eyebrow}>The voices</p>
        <h2 id="voices-title" className={styles.landingTitle}>
          {flavors.length} AI voices compete for every photo
        </h2>
        <p className={styles.landingText}>Each photo gets 3 of them. Find out which one gets you.</p>
      </div>
      <ul className={styles.voiceGrid}>
        {flavors.map((flavor) => {
          const best = findBestCaption(photos, flavor.slug);
          return (
            <li key={flavor.slug} className={styles.voiceCard} data-flavor={flavor.slug}>
              <h3 className={styles.voiceName}>{flavor.name}</h3>
              <p className={styles.voiceTagline}>{flavor.tagline}</p>
              {best && <p className={styles.voiceQuote}>&ldquo;{best.content}&rdquo;</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// The most picked photos of the closed batches
function Gallery({ photos }: { photos: PhotoResDto[] }) {
  const { paths } = useRoast();

  return (
    <section className={styles.landingSection} aria-labelledby="gallery-title">
      <div className={styles.sectionIntroRow}>
        <div>
          <p className={styles.eyebrow}>Hall of fame</p>
          <h2 id="gallery-title" className={styles.landingTitle}>
            The crowd&apos;s favorites
          </h2>
        </div>
        <Link href={paths.top} className={styles.moreLink}>
          All top roasts
          <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
        </Link>
      </div>
      <div className={styles.gallery}>
        {photos.map((photo, index) => (
          <TopTile key={photo.id} photo={photo} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

// What a player keeps beyond a day
function Features() {
  const { paths } = useRoast();

  return (
    <section className={styles.landingSection} aria-labelledby="features-title">
      <div className={styles.sectionIntroCenter}>
        <p className={styles.eyebrow}>Beyond today</p>
        <h2 id="features-title" className={styles.landingTitle}>
          Every pick adds up
        </h2>
      </div>
      <ul className={styles.featureGrid}>
        <Feature icon={<LocalFireDepartmentRoundedIcon />} title="Keep your streak">
          Finish the day&apos;s batch to keep the flame going.
        </Feature>
        <Feature icon={<GroupsRoundedIcon />} title="You vs. the crowd">
          See how often your pick is the crowd&apos;s favorite.
        </Feature>
        <Feature icon={<InsightsRoundedIcon />} title="Find your humor">
          Your picks add up to the voices you laugh at most.
        </Feature>
        <Feature icon={<AddAPhotoRoundedIcon />} title="Roast your own photo">
          The AI writes its captions, and it joins the next batch.{' '}
          <Link href={paths.roast} className={styles.link}>
            Upload a photo
          </Link>
        </Feature>
      </ul>
    </section>
  );
}

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Feature({ icon, title, children }: FeatureProps) {
  return (
    <li className={styles.feature}>
      <span className={styles.featureIcon}>{icon}</span>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureText}>{children}</p>
    </li>
  );
}
