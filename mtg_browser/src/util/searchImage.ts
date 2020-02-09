const kp: string[] = [
  "MTUxNzMzM",
  "jEtMzU5Ym",
  "FlMmEyYWR",
  "hNzUxMGZl",
  "ZjA3OGQ2Yw",
  "=="
];
const pixaBay = btoa(kp.join(""));

interface PixabaySearchHit {
  id: number;
  pageURL: string;
  type: string;
  // a comma separated string of tags
  tags: string;
  previewURL: "string";
  previewWidth: number;
  previewHeight: number;
  webformatURL: "string";
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: "string";
  fullHDURL: "string";
  imageURL: "string";
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  favorites: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

interface PixabaySearchResponse {
  total: number;
  totalHits: number;
  hits: PixabaySearchHit[];
}

async function queryPixaBay(query: string): Promise<PixabaySearchHit[] | null> {
  const searchQueryString = query
    .split(" ")
    .map(encodeURIComponent)
    .join("+");
  const pixabaySearchResponse: PixabaySearchResponse = await fetch(
    `https://pixabay/com/api?key=${pixaBay}&q=$${searchQueryString}&safesearch=true`
  ).then(r => r.json());
  console.log(pixabaySearchResponse);
  if (pixabaySearchResponse.totalHits === 0) {
    return null;
  }
  return pixabaySearchResponse.hits;
}

export async function searchImageUrl(query: string): Promise<string> {
  const searchResult = await queryPixaBay(query);
  if (searchResult == null) {
    return "/fallback-images/fallback0.jpg";
  }

  return searchResult[0].previewURL;
}

export async function searchImage(query: string): Promise<Blob> {
  const imageUrl = await searchImageUrl(query);
  const imageBlob = await fetch(imageUrl, {
    mode: "cors"
  }).then(r => r.blob());

  return imageBlob;
}
