import * as React from 'react';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CaptionLogic from '@/lib/caption/CaptionLogic';
import {CaptionResDto} from '@/client/nest';

export default function CaptionList() {
  const [captions, setCaptions] = React.useState<CaptionResDto[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const captionLogic = React.useMemo(() => new CaptionLogic(), []);

  React.useEffect(() => {
    const fetchCaptions = async () => {
      try {
        setCaptions(await captionLogic.fetchCaptions());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCaptions();
  }, [captionLogic]);

  if (loading) {
    return <CircularProgress />;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (captions.length === 0) {
    return <Alert severity="info">No captions yet.</Alert>;
  }

  return (
    <Grid container spacing={3}>
      {captions.map((caption) => (
        <Grid key={caption.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardMedia
              component="img"
              image={caption.image.url}
              alt={caption.image.description}
              sx={{ aspectRatio: '3 / 2' }}
            />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                {caption.content}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {caption.image.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
