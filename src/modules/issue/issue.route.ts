import { Router } from "express";
import { createIssue, deleteIssue, getIssueById, getIssues, updateIssue } from "./issue.controller";
import { auth } from "../../middleware/auth";
import { roleGuard } from "../../middleware/role";

const router = Router();

router.get("/", getIssues)
router.get("/:id", getIssueById)

router.post("/", auth, createIssue);

router.delete("/:id", auth, roleGuard(["maintainer"]), deleteIssue);

router.patch("/:id", auth, roleGuard(["maintainer"]), updateIssue);

export default router;