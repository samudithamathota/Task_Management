import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
} from "../schemas/project.schema";

const router = Router();

router.use(authenticate);

router.post("/", validate(createProjectSchema), createProject);
router.get("/", getProjects);
router.get("/:id", validate(projectIdParamSchema), getProject);
router.patch("/:id", validate(updateProjectSchema), updateProject);
router.delete("/:id", validate(projectIdParamSchema), deleteProject);

export default router;
