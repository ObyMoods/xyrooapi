const cheerio = require("cheerio");
const { decode } = require("html-entities");

function parseInstagramHTML(html) {
  if (!html) throw new Error("HTML kosong!");
  const $ = cheerio.load(html);

  const result = {
    username: null,
    name: null,
    caption: null,
    likes: null,
    comments: null,
    time: null,
    videoUrl: null,
    imageUrl: null,
    downloadLink: null,
    media: [],
  };

  // ======= USER INFO =======
  result.username = decode($("#user_info p.h4").first().text().trim() || $("p.h4").first().text().trim() || null);
  result.name = decode($("#user_info p.text-muted").first().text().trim() || null);

  // ======= CAPTION =======
  const captionElement = $(".d-flex.justify-content-between.align-items-center p.text-sm").first();
  if (captionElement.length) {
    const rawCaption = captionElement.html() || captionElement.text();
    result.caption = decode(rawCaption.replace(/<br\s*\/?>/gi, "\n").trim());
  }

  // ======= STATS =======
  const stats = $(".stats.text-sm small");
  result.likes = stats.eq(0).text().trim() || null;
  result.comments = stats.eq(1).text().trim() || null;
  result.time = stats.eq(2).text().trim() || null;

  // ======= MEDIA =======
  const videoTag = $("video source");
  const videoUrl = videoTag.attr("src");
  const imgPoster = $("video").attr("poster") || $("img.rounded-circle").attr("src");
  const downloadLink = $("a.btn.bg-gradient-success").attr("href");

  result.videoUrl = videoUrl ? cleanUrl(videoUrl) : null;
  result.imageUrl = imgPoster ? cleanUrl(imgPoster) : null;
  result.downloadLink = downloadLink ? cleanUrl(downloadLink) : null;

  // ===== KUMPULKAN SEMUA MEDIA ======
  const urls = [];
  const regex = /(https?:\/\/[^\s"']+\.(?:mp4|jpg|jpeg|png|webp))/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(cleanUrl(match[1]));
  }

  result.media = Array.from(new Set(urls));

  return result;
}

// ======= CLEAN URL UTILITY =======
function cleanUrl(url) {
  try {
    if (!url) return null;
    const decoded = decodeURIComponent(url);
    const u = new URL(decoded);
    u.searchParams.delete("ccb");
    u.searchParams.delete("oh");
    u.searchParams.delete("oe");
    u.searchParams.delete("edm");
    u.searchParams.delete("_nc_ht");
    return u.toString();
  } catch {
    return url;
  }
}

// Fungsi utama seperti igdl
async function instagramdl(instagramUrl) {
  if (!instagramUrl) throw new Error("URL Instagram wajib diisi!");
  const encodedUrl = encodeURIComponent(instagramUrl);
  const target = `https://igram.website/content.php?url=${encodedUrl}`;

  const headers = {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded",
    "pragma": "no-cache",
    "sec-ch-ua": `"Chromium";v="139", "Not;A=Brand";v="99"`,
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": `"Android"`,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referer": "https://igram.website/",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  try {
    const response = await fetch(target, { method: "GET", headers });
    if (!response.ok) throw new Error(`Request gagal: ${response.status} ${response.statusText}`);

    const data = await response.json();
    const html = data.html;
    const parsed = parseInstagramHTML(html);

    return parsed;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = instagramdl;