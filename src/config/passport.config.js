import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../db/index.js";

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                const profileImage = profile.photos?.[0]?.value;
                const providerId = profile.id;

                if (!email) {
                    return done(new Error("Email not provided by Google"), null);
                }

                // Find existing user
                let user = await prisma.user.findUnique({
                    where: { email },
                });

                if (user) {
                    // Update user info if needed
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            name: name || user.name,
                            profileImage: profileImage || user.profileImage,
                            providerId: providerId || user.providerId,
                        },
                    });
                    return done(null, user);
                }

                // Create new user
                user = await prisma.user.create({
                    data: {
                        email,
                        name,
                        profileImage,
                        provider: "google",
                        providerId,
                    },
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
