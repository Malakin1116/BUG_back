// Backend: routes/auth.js
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshUserSessionController,
  requestResetPwdController,
  resetPasswordController,
  getGoogleOAuthUrlController,
  loginWithGoogleController,
  requestEmailVerificationController,
  verifyEmailController,
  validateReceiptController,
  getPremiumStatusController,
} from '../controllers/auth.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
  loginWithGoogleOAuthSchema,
  validateReceiptSchema,
} from '../validation/auth.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

authRouter.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

authRouter.post('/logout', authenticate, ctrlWrapper(logoutUserController));

authRouter.post('/refresh', ctrlWrapper(refreshUserSessionController));

authRouter.post(
  '/request-reset-email',
  validateBody(requestResetEmailSchema),
  ctrlWrapper(requestResetPwdController),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
);

authRouter.get(
  '/get-oauth-url',
  ctrlWrapper(getGoogleOAuthUrlController),
);

authRouter.post(
  '/confirm-oauth',
  validateBody(loginWithGoogleOAuthSchema),
  ctrlWrapper(loginWithGoogleController),
);

authRouter.post(
  '/request-verify-email',
  validateBody(requestResetEmailSchema),
  ctrlWrapper(requestEmailVerificationController),
);

authRouter.get(
  '/verify-email',
  ctrlWrapper(verifyEmailController),
);

authRouter.post(
  '/validate-receipt',
  authenticate,
  validateBody(validateReceiptSchema),
  ctrlWrapper(validateReceiptController),
);

authRouter.get(
  '/premium-status',
  authenticate,
  ctrlWrapper(getPremiumStatusController),
);

export default authRouter;