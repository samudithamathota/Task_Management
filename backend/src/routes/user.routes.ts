import { Router } from "express";
import { deleteUser, getUsers, updateUser } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { UserRole } from "../constants/roles";
import { updateUserSchema, userIdParamSchema } from "../schemas/user.schema";

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/", getUsers);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", validate(userIdParamSchema), deleteUser);

export default router;
