const fetch = require('node-fetch');

class Ytdl {
    constructor() {
        this.baseUrl = "https://m4.fly.dev";
        this.headers = {
            "accept": "*/*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://ytiz.xyz/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        };
    }
    
    async getInfo(url) {
        const body = JSON.stringify({
            url: url,
            startTime: 0,
            endTime: 0,
            format: "mp3"
        });

        const response = await fetch(`${this.baseUrl}/api/info`, {
            method: "POST",
            headers: this.headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`Gagal mendapatkan info: ${response.statusText}`);
        }

        return await response.json();
    }

    async processDownload(url, filename, randID) {
        const body = JSON.stringify({
            url: url,
            quality: "128",
            metadata: true,
            filename: filename,
            randID: randID,
            trim: false,
            startTime: 0,
            endTime: 0,
            format: "mp3"
        });

        const response = await fetch(`${this.baseUrl}/api/download`, {
            method: "POST",
            headers: this.headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`Gagal proses download: ${response.statusText}`);
        }

        return await response.json();
    }

    async getFileBuffer(filepath, randID) {
        const body = JSON.stringify({
            filepath: filepath,
            randID: randID
        });

        const response = await fetch(`${this.baseUrl}/api/file_send`, {
            method: "POST",
            headers: this.headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`Gagal mengambil file: ${response.statusText}`);
        }

        return Buffer.from(await response.arrayBuffer());
    }

    async clearSession(randID) {
        const body = JSON.stringify({
            randID: randID
        });

        const response = await fetch(`${this.baseUrl}/api/clear`, {
            method: "POST",
            headers: this.headers,
            body: body
        });

        return await response.json();
    }

    async download(url) {
        try {
            console.log("1. Mengambil info...");
            const info = await this.getInfo(url);
            console.log(`  - Judul: ${info.title}`);
            console.log(`  - Filename: ${info.filename}`);

            console.log("2. Memproses download...");
            const downloadData = await this.processDownload(url, info.filename, info.randID);
            console.log(`  - Filepath: ${downloadData.filepath}`);

            console.log("3. Mengunduh buffer file...");
            const buffer = await this.getFileBuffer(downloadData.filepath, downloadData.randID);
            console.log(`  - Ukuran Buffer: ${buffer.length} bytes`);

            console.log("4. Membersihkan session...");
            await this.clearSession(downloadData.randID);
            console.log("  - Selesai.");
            
            return {
                info: info,
                buffer: buffer
            };

        } catch (error) {
            console.error("Terjadi kesalahan:", error.message);
            throw error;
        }
    }
}

// Fungsi utama seperti ytdl
async function youtubeDownload(url) {
    try {
        const ytdl = new Ytdl();
        const result = await ytdl.download(url);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = youtubeDownload;