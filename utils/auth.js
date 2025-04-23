import dotenv from 'dotenv'

dotenv.config()

export const getTokenRequest = async (req, res) => {
    try {
        const auth = Buffer.from(`${process.env.CONSUMER_USERNAME}:${process.env.CONSUMER_PASSWORD}`).toString('base64');
        const tokenUrl = process.env.BUNI_TOKEN_REQUEST_URL;
        const token = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth} `,
            }
        })
        const tokenData = await token.json();
        return tokenData.access_token;

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}