import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';

import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
  loginWithGoogleOAuthSchema,
} from '../validation/auth.js';
import {
  registerUserController,
  requestEmailVerificationController,
  verifyEmailController,
  loginUserController,
  logoutUserController,
  refreshUserSessionController,
  resetPasswordController,
  getGoogleOAuthUrlController,
  loginWithGoogleController,
  requestResetPwdController,
} from '../controllers/auth.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

authRouter.post(
  '/verifycate',
  validateBody(requestResetEmailSchema), // перевірка схеми для верифікації
  ctrlWrapper(requestEmailVerificationController), // контролер для верифікації
);

authRouter.get(
  '/verifycate',
  ctrlWrapper(verifyEmailController), // контролер для верифікації
);

authRouter.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

authRouter.post('/logout', ctrlWrapper(logoutUserController));
authRouter.post('/refresh', ctrlWrapper(refreshUserSessionController));

authRouter.post(
  '/send-reset-password-email',
  validateBody(requestResetEmailSchema),
  ctrlWrapper(requestResetPwdController),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
);

authRouter.post(
  '/confirm-oauth',
  validateBody(loginWithGoogleOAuthSchema),
  ctrlWrapper(loginWithGoogleController),
);

authRouter.get('/get-oauth-url', ctrlWrapper(getGoogleOAuthUrlController));

export default authRouter;
