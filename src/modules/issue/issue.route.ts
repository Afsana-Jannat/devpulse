import { Router } from "express";
import { createIssue, deleteIssue, getIssueById, getIssues, updateIssueUser } from "./issue.controller";
import { auth } from "../../middleware/auth";
import { roleGuard } from "../../middleware/role";

const router = Router();

router.get("/", getIssues)
router.get("/:id", getIssueById)
router.patch("/:id", auth, updateIssueUser);

router.post("/", auth, createIssue);

router.delete("/:id", auth, roleGuard(["maintainer"]), deleteIssue);

export default router;