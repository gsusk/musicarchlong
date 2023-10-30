const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    let urlParts = req.url.split('/')

    // Get all the artists
    if (req.method === "GET" && req.url === "/artists") {
      res.body = JSON.stringify(artists)
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(res.body)
    }

    // Get a specific artist's details based on artistId
    if (req.method === "GET" && req.url.startsWith('/artists/')) {
      if (urlParts.length === 3) {
        const artistId = urlParts[2];
        const artist = artists[artistId]
        if (artist) {
          res.statusCode = 200;
          res.setHeader('Content-Type', "application/json");
          res.body = JSON.stringify(artist);
          return res.end(res.body);
        }
      }
    }

    //add an artist
    if (req.method === "POST" && req.url === "/artists") {
      const { name } = req.body;
      let newArtistId = getNewArtistId();
      artists[newArtistId] = {
        artistId: newArtistId,
        name: name
      }
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json")
      res.body = JSON.stringify(artists[newArtistId]);
      return res.end(res.body)
    }

    //edit a specific artist by artistId
    if ((req.method === "PATCH" || req.method === "PUT") && req.url.startsWith("/artist/")) {
      if (urlParts.length === 3) {
        const artistId = urlParts[2];
        const artist = artists[artistId];
        if (artist) {
          const { name } = req.body;
          artist.name = name || artist.name;
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json")
          res.body = JSON.stringify({ ...artist, lastUpdated: new Date().toDateString() });
          return res.end(res.body);
        }
      }
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json")
      res.write("Endpoint: not valid id");
      return res.end();
    }

    // Delete a specified artist by artistId
    if (req.method === "DELETE" && req.url.startsWith("/artists/")) {
      if (urlParts.length === 3) {
        const id = urlParts[2];
        const toBeDeleted = artists[id];
        if (toBeDeleted) {
          delete artists[id]
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json")
          res.body = JSON.stringify({ message: "succesfull deletion" })
          return res.end(res.body)
        }
      }
    }

    //// Get all albums of a specific artist based on artistId
    if (req.method === "GET" && req.url.startsWith("/artists/") && req.url.endsWith("/albums")) {
      if (urlParts.length === 4) {
        const artistId = urlParts[2];
        const artist = artists[artistId];

        if (artist) {
          let artistAlbums = [];
          for (let id in albums) {
            if (albums[id].artistId === Number(artistId)) {
              artistAlbums.push(albums[id])
            }
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json")
          res.write(JSON.stringify(artistAlbums))
          return res.end()
        }
      }
    }

    // Get a specific album's details based on albumId
    if (req.method === "GET" && req.url.startsWith("/albums/")) {
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        const album = albums[albumId];
        if (album) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json")
          res.write(JSON.stringify(album))
          return res.end();
        }
      }
    }

    // Add an album to a specific artist based on artistId
    if (req.method === "POST" && req.url.startsWith("/artists/") && req.url.endsWith("/albums")) {
      if (urlParts.length === 4) {
        const artistId = urlParts[2];
        const artist = artists[artistId]
        if (artist) {
          let albumId = getNewAlbumId();
          const { name } = req.body;
          albums[`${albumId}`] = {
            albumId: albumId,
            name: name,
            artistId: Number(artistId)
          }

          res.statusCode = 201;
          res.setHeader("Content-Type", "application/json");
          res.write(JSON.stringify(albums[String(albumId)]))
          return res.end();
        }
      }
    }

    // Edit a specified album by albumId
    if ((req.method === "PATCH" || req.method === "PUT") && req.url.startsWith("/albums/")) {
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        const album = albums[albumId];
        if (album) {
          const { name } = req.body;
          album.name = name || album.name
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json")
          res.write(JSON.stringify(album))
          return res.end()
        }
      }
    }

    // Delete a specified album by albumId
    if (req.method === "DELETE" && req.url.startsWith('/albums/')) {
      if (urlParts.length === 3) {
        const album = albums[urlParts[2]];
        if (album) {
          delete albums[urlParts[2]];

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.body = JSON.stringify({ "message": "Successfully deleted" });
          return res.end(res.body);
        }
      }
    }

    // Get all songs of a specific artist based on artistId
    if (req.method === "GET" && req.url.startsWith('/artists/') && req.url.endsWith('/songs')) {
      if (urlParts.length === 4) {
        const artistId = urlParts[2];
        const artist = artists[artistId];
        if (artist) {
          const songList = [];
          for (const id in songs) {
            let albumId = String(songs[id].albumId);
            if (albums[albumId].artistId === Number(artistId)) {
              songList.push(songs[id]);
            }
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(JSON.stringify(songList));
          return res.end();
        }
      }
    }

    // Get all songs of a specific album based on albumId
    if (req.method === "GET" && req.url.startsWith('/albums/') && req.url.endsWith("/songs")) {
      if (urlParts.length === 4) {
        const album = albums[urlParts[2]];
        if (album) {
          const songList = [];
          for (const id in songs) {
            if (songs[id].albumId === Number(urlParts[2])) {
              songList.push(songs[id])
            }
            res.statusCode === 200;
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(songList));
            return res.end();
          }
        }
      }
    }

    // Get all songs of a specified trackNumber
    if (req.method === "GET" && req.url.startsWith("/trackNumbers/")) {
      if (urlParts.length === 3) {
        const trackSongs = [];
        for (const id in songs) {
          if (songs[id].trackNumber === Number(urlParts[2])) {
            trackSongs.push(songs[id])
          }
        }

        res.status === 200;
        res.setHeader("Content-Type", "application/json")
        res.write(JSON.stringify(trackSongs))
        return res.end();
      }
    }

    // Get a specific song's details based on songId
    if (req.method === "GET" && req.url.startsWith("/songs/")) {
      if (urlParts.length === 3) {
        const song = songs[urlParts[2]];
        if (song) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(JSON.stringify(song));
          return res.end();
        }
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));