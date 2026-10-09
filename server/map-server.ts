import { createServer } from 'http';
import { handleMapRequest } from './map/map-router';

const PORT = 3001;

const server = createServer(async (req, res) => {
  await handleMapRequest(req, res, () => {
    res.statusCode = 404;
    res.end('Not found');
  });
});

server.listen(PORT, () => {
  console.log(`Map server running on http://localhost:${PORT}`);
  console.log('Endpoints: /api/map/route /api/map/search /api/map/pois /api/map/weather /api/map/hazards');
});