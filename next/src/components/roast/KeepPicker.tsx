import * as React from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {PhotoResDto} from '@/client/nest';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

// The captions a photo keeps, as the API requires
const KeptCount = 3;

interface KeepPickerProps {
  // The uploader's photo with its drafts
  photo: PhotoResDto;
  // Receives the photo as it stands with the kept captions
  onKept: (photo: PhotoResDto) => void;
  // The way back to the photo as it stands; none while it has no kept captions to go back to
  onCancel?: () => void;
}

// The drafts of the uploader's photo, one in each voice, of which the uploader keeps 3 as its captions.
// A kept draft is dropped by tapping it again; once 3 are kept, the others wait until one is dropped.
export default function KeepPicker({ photo, onKept, onCancel }: KeepPickerProps) {
  const roastLogic = React.useMemo(() => new RoastLogic(), []);
  const drafts = photo.drafts ?? [];
  const [keptIds, setKeptIds] = React.useState(() => drafts.filter(({ kept }) => kept).map(({ id }) => id));
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isFull = keptIds.length === KeptCount;

  const toggle = (id: string) => {
    setKeptIds(keptIds.includes(id) ? keptIds.filter((keptId) => keptId !== id) : [...keptIds, id]);
  };

  const save = async () => {
    setIsSaving(true);
    setError('');
    try {
      onKept(await roastLogic.keepCaptions(photo.id, keptIds));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="keep-title">
      <div className={styles.keepHead}>
        <h2 id="keep-title" className={styles.sectionTitle}>
          Keep your {KeptCount} favorites
        </h2>
        <span className={styles.keepCount} data-full={isFull}>
          {keptIds.length} of {KeptCount}
        </span>
      </div>
      <p className={`${styles.muted} ${styles.small}`}>
        Classmates vote on the {KeptCount} you keep. You can change them until your photo is in a batch.
      </p>
      <ol className={styles.options}>
        {drafts.map((draft) => {
          const isKept = keptIds.includes(draft.id);
          return (
            <li key={draft.id}>
              <button
                type="button"
                className={styles.option}
                data-kept={isKept}
                aria-pressed={isKept}
                disabled={isSaving || (isFull && !isKept)}
                onClick={() => toggle(draft.id)}
              >
                <div className={`${styles.optionBody} ${styles.optionChoice}`}>
                  <span className={styles.keepMark} aria-hidden="true">
                    {isKept && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
                  </span>
                  <div>
                    <div className={styles.optionText}>{draft.content}</div>
                    <div className={styles.keepVoice}>
                      <FlavorChip flavor={draft.flavor} />
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      {error && <p className={styles.error}>{error}</p>}
      <div className={`${styles.actions} mt-5`}>
        <button type="button" className={styles.button} disabled={!isFull || isSaving} onClick={save}>
          {photo.captions.length > 0 ? `Save my ${KeptCount}` : 'Send to the batch'}
        </button>
        {onCancel && (
          <button type="button" className={styles.buttonGhost} disabled={isSaving} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}
