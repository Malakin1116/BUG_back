import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validateBody.js';
import { updateUserValidationSchema } from '../validation/user.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  patchAvatarController,
  patchUserController,
  getUserByIdController,
  getUsersCountController,
} from '../controllers/user.js';
import { upload } from '../middlewares/multer.js';

const userRouter = Router();
userRouter.get(
  '/currentUser',
  authenticate,
  ctrlWrapper(getUserByIdController),
);

userRouter.patch(
  '/update/:userId',
  upload.single('avatar'),
  validateBody(updateUserValidationSchema),
  ctrlWrapper(patchUserController),
);

userRouter.patch(
  '/avatar/:userId',
  upload.single('avatar'),
  ctrlWrapper(patchAvatarController),
);

userRouter.get('/usersCount', ctrlWrapper(getUsersCountController));
export default userRouter;
