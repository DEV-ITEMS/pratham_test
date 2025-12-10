import { Box, Avatar, Stack, Tooltip } from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export const ViewThumbnails = ({ views, selectedViewId, onSelect, token }) => {
  const queries = useQueries({
    queries: (views ?? []).map((v) => ({
      queryKey: ['thumb', v.panoramaAssetId, token],
      queryFn: () => (v.panoramaAssetId ? apiClient.fetchPanoramaAsset(v.panoramaAssetId, { token }) : Promise.resolve(undefined)),
      enabled: Boolean(v.panoramaAssetId),
    })),
  });

  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5 }}>
      {(views ?? []).map((v, i) => {
        const asset = queries[i]?.data;
        return (
          <Tooltip title={v.name} key={v.id}>
            <Avatar
              variant="rounded"
              src={asset?.url}
              alt={asset?.altText || v.name}
              onClick={() => onSelect?.(v.id)}
              sx={{
                width: 56,
                height: 42,
                border: v.id === selectedViewId ? '2px solid' : '1px solid',
                borderColor: v.id === selectedViewId ? 'primary.main' : 'divider',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              imgProps={{ draggable: false }}
            />
          </Tooltip>
        );
      })}
      {(views?.length ?? 0) === 0 && (
        <Box sx={{ color: 'text.secondary', fontSize: 12, px: 1 }}>No views</Box>
      )}
    </Stack>
  );
};

