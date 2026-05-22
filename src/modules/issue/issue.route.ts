import { Router } from "express";
import { createIssue, deleteIssue, updateIssue } from "./issue.controller";
import { auth } from "../../middleware/auth";
import { roleGuard } from "../../middleware/role";

const router = Router();

router.post("/", auth, createIssue);

router.delete("/:id", auth, roleGuard(["maintainer"]), deleteIssue);

router.patch("/:id", auth, roleGuard(["maintainer"]), updateIssue);

export default router;