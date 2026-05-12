const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userQuery } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Rune Key (GEMINI_API_KEY) not found in Netlify settings.' })
            };
        }

        const payload = JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: "You are an ancient Oracle bound to a Tome, helping a creator build a universe. Respond only with beautifully written lore. Speak in an epic, legendary tone." }] }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        // A bulletproof, old-school way to fetch data that works on ANY Netlify server
        const data = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => resolve({
                    status: res.statusCode,
                    body: Buffer.concat(chunks).toString('utf8')
                }));
            });
            req.on('error', (e) => reject(e));
            req.write(payload);
            req.end();
        });

        return {
            statusCode: data.status,
            headers: { "Content-Type": "application/json" },
            body: data.body
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "The Oracle ritual failed: " + error.message })
        };
    }
};