import * as React from 'react';
import RoastLogic from '@/lib/roast/RoastLogic';
import {BatchResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {Load, useLoad} from './useLoad';

export interface BatchLoad {
  // Null until the viewer is known and the router knows the date; the feed mounts anew when either changes
  key: string | null;
  batch: Load<BatchResDto>;
}

// The batch of a date, as the current viewer sees it
export function useBatch(date: string | undefined): BatchLoad {
  const { viewer, viewerLoaded } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewerLoaded && date ? `batch:${date}:${viewer?.id ?? ''}` : null;
  const loadBatch = React.useCallback(() => roastLogic.fetchBatch(date!), [roastLogic, date]);
  const batch = useLoad(key, loadBatch);

  return { key, batch };
}
