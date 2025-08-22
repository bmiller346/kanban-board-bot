"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scr/oath
const discord_js_1 = require("discord.js");
const mongodb_1 = require("mongodb");
const google_auth_library_1 = require("google-auth-library");
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'discordBotDatabase';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
const mongoClient = new mongodb_1.MongoClient(MONGO_URI);
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
});
async function connectToDatabase() {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    }
    catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
}
var Tier;
(function (Tier) {
    Tier[Tier["Free"] = 0] = "Free";
    Tier[Tier["Paid"] = 1] = "Paid";
})(Tier || (Tier = {}));
const googleClient = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL);
const app = (0, express_1.default)();
app.use(passport_1.default.initialize());
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((obj, done) => {
    done(null, obj);
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        // Store tokens securely
        return done(null, profile);
    });
}));
app.get('/auth/google', passport_1.default.authenticate('google', { scope: ['https://www.googleapis.com/auth/drive.file'] }));
app.get('/auth/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});
const expressPort = 3000;
app.listen(expressPort, () => {
    console.log(`Express server listening on port ${expressPort}`);
});
function encrypt(text, secretKey) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-ctr', secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
}
function decrypt(hash, secretKey) {
    const decipher = crypto_1.default.createDecipheriv('aes-256-ctr', secretKey, Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
}
async function checkSubscriptionStatus(userId) {
    // Implement actual subscription check logic
    return Tier.Free;
}
function requirePaidSubscription(req, res, next) {
    const userId = req.user.id;
    checkSubscriptionStatus(userId).then(tier => {
        if (tier === Tier.Paid) {
            next();
        }
        else {
            res.status(403).send('This feature requires a paid subscription.');
        }
    }).catch(error => {
        res.status(500).send('Internal server error');
    });
}
client.once('ready', () => {
    console.log(`${client.user?.tag} is online!`);
    connectToDatabase();
});
client.login(process.env.DISCORD_TOKEN);
