import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskStatistics,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
} from "../controllers/task.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  assignTaskSchema,
  taskIdParamSchema,
  getTasksSchema,
} from "../schemas/task.schema";

const router = Router();

router.use(authenticate);

router.post("/", validate(createTaskSchema), createTask);
router.get("/", validate(getTasksSchema), getTasks);
// Must be registered before "/:id" — otherwise Express would match this
// path as GET /:id with id="statistics" and 400 on the ObjectId validation.
router.get("/statistics", getTaskStatistics);
router.get("/:id", validate(taskIdParamSchema), getTask);
router.patch("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", validate(taskIdParamSchema), deleteTask);
router.patch("/:id/status", validate(updateStatusSchema), updateTaskStatus);
router.patch("/:id/assign", validate(assignTaskSchema), assignTask);

export default router;
