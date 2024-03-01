const axios = require('axios');
const crypto = require('crypto');
const publicKey = '0b52223f2830091d7518b22a279afe13';
const privateKey = 'b0c1d38816fe6999b9e60a906e9810c0a3f24cba';
async function fetchMarvelCharacter(query) {
    const url = `https://marvel-heroic-api-unlock-the-mcu-legendary-characters.p.rapidapi.com/name?q=${query}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '7b813e3024msh753420c1d2b6a9fp133f87jsn48410fd9d981',
            'X-RapidAPI-Host': 'marvel-heroic-api-unlock-the-mcu-legendary-characters.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function generateHash(ts, privateKey, publicKey) {
    const hash = crypto.createHash('md5');
    const input = ts + privateKey + publicKey;
    hash.update(input);
    return hash.digest('hex');
}

async function getComics() {
    try {
        const ts = new Date().getTime().toString();
        const hash = generateHash(ts, privateKey, publicKey);

        const url = `http://gateway.marvel.com/v1/public/comics?ts=${ts}&apikey=${publicKey}&hash=${hash}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200) {
            const comicsData = data.data.results;
            return comicsData;
        } else {
            console.error("Error:", data.code);
            throw new Error("Error fetching comics");
        }
    } catch (error) {
        console.error("Error fetching comics:", error);
        throw new Error("Error fetching comics");
    }
}
module.exports = {
    fetchMarvelCharacter, getComics
};