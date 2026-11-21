import * as React from 'react';
import RoastLogic from '@/lib/roast/RoastLogic';
import {useRoast} from './RoastContext';
import styles from './roast.module.css';

interface DeletePhotoDialogProps {
  // The photo to delete; null while the dialog is closed
  photoId: string | null;
  onClose: () => void;
  // Runs once the photo is deleted
  onDeleted: () => void;
}

// The confirmation before the uploader deletes a photo with its captions and votes
export default function DeletePhotoDialog({ photoId, onClose, onDeleted }: DeletePhotoDialogProps) {
  const { notify } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const dialog = dialogRef.current!;
    if (photoId && !dialog.open) {
      setError('');
      dialog.showModal();
    }
    if (!photoId && dialog.open) {
      dialog.close();
    }
  }, [photoId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await roastLogic.deletePhoto(photoId!);
      notify('Photo deleted.');
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <h2 className={styles.dialogTitle}>Delete this photo?</h2>
      <p className={styles.muted}>Its captions and votes are deleted with it. This cannot be undone.</p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={`${styles.actions} ${styles.actionsFill} mt-5`}>
        <button type="button" className={styles.buttonGhost} onClick={onClose}>
          Keep it
        </button>
        <button type="button" className={styles.button} disabled={isDeleting} onClick={handleDelete}>
          Delete
        </button>
      </div>
    </dialog>
  );
}
