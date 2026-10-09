import * as React from 'react';
import RoastLogic from '@/lib/roast/RoastLogic';
import {BatchResDto, BatchSummaryResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {Load, useLoad} from './useLoad';

export interface TodayBatchLoad {
  // Null until the viewer is known; the feed mounts anew when it changes
  key: string | null;
  batch: Load<BatchResDto>;
  // The batches before today's, the latest first, once both have loaded
  earlier: BatchSummaryResDto[] | undefined;
}

// Today's batch and the batches before it, as the current viewer sees them
export function useTodayBatch(): TodayBatchLoad {
  const { viewer, viewerLoaded } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  // The batch depends on the viewer, whose votes and uploads it reflects
  const key = viewerLoaded ? `today:${viewer?.id ?? ''}` : null;
  const loadBatch = React.useCallback(() => roastLogic.fetchTodayBatch(), [roastLogic]);
  const batch = useLoad(key, loadBatch);
  const loadRecent = React.useCallback(() => roastLogic.fetchRecentBatches(), [roastLogic]);
  const recent = useLoad(key, loadRecent);

  const earlier = batch.data ? recent.data?.filter(({ date }) => date < batch.data!.date) : undefined;

  return { key, batch, earlier };
}
