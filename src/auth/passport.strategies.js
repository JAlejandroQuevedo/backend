import passport from 'passport';
import local from 'passport-local';
import jwt from 'passport-jwt';
import { ManagerLogin } from '../controllers/dao/manager/managerLogin.mdb.js';
import { modelUsersGoogle } from '../controllers/dao/models/user.google.js';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { isValidPassword, createHash } from '../services/utils/bycript.js';
import { config } from '../controllers/config/config.js';

const localStrategy = local.Strategy;
const jwtStrategy = jwt.Strategy;
const jwtExtractor = jwt.ExtractJwt;
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) token = req.cookies[`${config.APP_NAME}_cookie`];

    return token;
}
const initAuthStrategies = () => {
    // Estrategia local (cotejamos contra nuestra base de datos)
    passport.use('login', new localStrategy(
        { passReqToCallback: true, usernameField: 'email' },
        async (req, username, password, done) => {
            try {
                const foundUser = await ManagerLogin.getOne({ email: username });

                if (foundUser && isValidPassword(password, foundUser.password)) {
                    const { _id, name, lastName, email, gender } = foundUser;
                    const savedRol = "admin";
                    const userDone = req.session.user = { _id: _id, name: name, lastName: lastName, email: email, gender: gender, role: savedRol };
                    return done(null, userDone);
                } else {
                    return done(null, false);
                }
            } catch (err) {
                return done(err, false);
            }
        }
    ));

    passport.use('register', new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        async (req, username, password, done) => {
            try {
                const foundUser = await ManagerLogin.getOne({ email: username });
                const { name, lastName, email, gender } = req.body;
                if (foundUser) {
                    return done(null, false, { message: 'El correo ya está registrado.' });
                }
                const passwordHash = createHash(password);
                const user = await ManagerLogin.addUser(name, lastName, email, gender, passwordHash);

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));
    passport.use(new GoogleStrategy({
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            const savedRol = "admin";
            const foundUser = await modelUsersGoogle.find({ email: profile.emails[0].value });
            if (foundUser.length === 0) {
                const user = {
                    name: profile.name.givenName,
                    lastName: profile.name.familyName,
                    email: profile.emails[0].value,
                }
                const { name, lastName, email } = user;
                const userDone = req.session.user = { name: name, lastName: lastName, email: email, role: savedRol };
                modelUsersGoogle.create(user);
                return done(null, userDone);
            } else {
                const user = {
                    name: profile.name.givenName,
                    lastName: profile.name.familyName,
                    email: profile.emails[0].value,
                }
                const { name, lastName, email } = user;
                const userDone = req.session.user = { name: name, lastName: lastName, email: email, role: savedRol };
                return done(null, userDone);
            }
        }
        catch (err) {
            return done(err)
        }
    }));
    passport.use('jwtlogin', new jwtStrategy(
        {
            // Aquí llamamos al extractor de cookie
            jwtFromRequest: jwtExtractor.fromExtractors([cookieExtractor]),
            secretOrKey: config.SECRET
        },
        async (jwt_payload, done) => {
            try {
                return done(null, jwt_payload);
            } catch (err) {
                return done(err);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

}
export const passportCall = strategy => {
    return async (req, res, next) => {
        passport.authenticate(strategy, { session: false }, function (err, user, info) {
            if (err) return next(err);
            // if (!user) return res.status(401).send({ origin: config.SERVER, payload: null, error: info.messages ? info.messages : info.toString() });
            if (!user) return res.status(401).send({ origin: config.SERVER, payload: null, error: 'Usuario no autenticado' });

            req.user = user;
            next();
        })(req, res, next);
    }
};
export { initAuthStrategies }
