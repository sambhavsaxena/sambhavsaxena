import { onlineManager, type UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/state-views';

type QuerySectionProps<T> = {
  query: Pick<UseQueryResult<T>, 'data' | 'error' | 'fetchStatus' | 'refetch' | 'isRefetchError'>;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
};

/**
 * Renders a card with the four data states: loading, error, empty, content.
 * A failed refresh keeps cached content and shows a non-blocking notice.
 */
export function QuerySection<T>({
  query,
  title,
  subtitle,
  action,
  isEmpty,
  emptyTitle = 'Nothing to show',
  emptyMessage,
  loadingLabel,
  children,
}: QuerySectionProps<T>) {
  const { data, error, fetchStatus, refetch, isRefetchError } = query;
  const retry = () => void refetch();

  let body: ReactNode;
  if (data === undefined) {
    if (error) body = <ErrorState error={error} onRetry={retry} compact />;
    else if (fetchStatus === 'paused' && !onlineManager.isOnline())
      body = <Notice tone="info" message="You're offline. This will load when you reconnect." />;
    else body = <LoadingState label={loadingLabel} compact />;
  } else if (isEmpty?.(data)) {
    body = <EmptyState title={emptyTitle} message={emptyMessage} />;
  } else {
    body = (
      <>
        {isRefetchError && <Notice tone="warning" message="Couldn't refresh. Showing earlier data." onRetry={retry} />}
        {children(data)}
      </>
    );
  }

  return (
    <Card title={title} subtitle={subtitle} action={action}>
      {body}
    </Card>
  );
}
