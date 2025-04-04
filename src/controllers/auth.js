import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUsersSession,
  requestResetToken,
  resetPassword,
  loginOrSignupWithGoogle,
  requestEmailVerificationToken,
  verifyEmail,
} from '../services/auth.js';
import { ONE_DAY } from '../constants/index.js';
import { generateAuthUrl } from '../utils/googleOAuth2.js';


const setupSession = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: false, // Обов’язково для HTTPS
    expires: new Date(Date.now() + ONE_DAY),
  });
  res.cookie('sessionId', session._id, {
    httpOnly: true,
    sameSite: 'None',
    secure: true, // Обов’язково для HTTPS
    expires: new Date(Date.now() + ONE_DAY),
  });
};

export const registerUserController = async (req, res) => {
  try {
    console.log('Registering user with payload:', req.body);
    const user = await registerUser(req.body);
    res.status(201).json({
      status: 201,
      message: 'Successfully registered a user!',
      data: user,
    });
  } catch (error) {
    console.error('Error in registerUserController:', error);
    if (error.code === 11000 && error.keyPattern?.emailHash) {
      return res.status(409).json({
        status: 409,
        message: 'User with this email already exists',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
    res.status(500).json({
      status: 500,
      message: error.message || 'Server error',
    });
  }
};;

export const requestEmailVerificationController = async (req, res) => {
  try {
    await requestEmailVerificationToken(req.body.email);
    res.json({
      message: 'Verification email was successfully sent!',
      status: 200,
      data: {},
    });
  } catch (error) {
    res.status(error.status || 400).json({
      message:
        error.message ||
        'Something went wrong while sending verification email',
      status: error.status || 400,
    });
  }
};

export const verifyEmailController = async (req, res) => {
  try {
    await verifyEmail(req);
    res.json({
      message: 'Email successfully verified!',
      status: 200,
      data: {},
    });
  } catch (error) {
    res.status(error.status || 400).json({
      message: error.message || 'Invalid or expired verification token',
      status: error.status || 400,
    });
  }
};

export const loginUserController = async (req, res) => {
  try {
    const session = await loginUser(req.body);
    setupSession(res, session);
    res.json({
      status: 200,
      message: 'Successfully logged in a user!',
      data: { accessToken: session.accessToken },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};

export const logoutUserController = async (req, res) => {
  try {
    if (req.cookies.sessionId) {
      await logoutUser(req.cookies.sessionId);
    }
    res.clearCookie('sessionId');
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};

export const refreshUserSessionController = async (req, res) => {
  try {
    console.log('Cookies:', req.cookies);
    const session = await refreshUsersSession({
      sessionId: req.cookies.sessionId,
      refreshToken: req.cookies.refreshToken,
    });
    setupSession(res, session);
    res.json({
      status: 200,
      message: 'Successfully refreshed a session!',
      data: {
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};

export const requestResetPwdController = async (req, res) => {
  try {
    await requestResetToken(req.body.email);
    res.json({
      message: 'Reset password email was successfully sent!',
      status: 200,
      data: {},
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    await resetPassword(req.body);
    res.json({
      message: 'Password was successfully reset!',
      status: 200,
      data: {},
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};

export const getGoogleOAuthUrlController = async (req, res) => {
  try {
    const url = generateAuthUrl();
    res.json({
      status: 200,
      message: 'Successfully get Google OAuth url!',
      data: {
        url,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};

export const loginWithGoogleController = async (req, res) => {
  try {
    const session = await loginOrSignupWithGoogle(req.body.code);
    setupSession(res, session);
    res.json({
      status: 200,
      message: 'Successfully logged in via Google OAuth!',
      data: {
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || 'Server error',
    });
  }
};