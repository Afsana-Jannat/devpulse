import type { Request, Response } from "express";
import issueService from "./issue.service";
import { sendResponse } from "../../utils/sendResponse";

export const createIssue = async (
    req: Request,
    res: Response
) => {

    const issue = await issueService.createIssue({
        ...req.body,
        reporter_id: req.user!.id
    });

    return sendResponse(
        res,
        {
            message: "Issue created successfully",
            data: issue
        },
        201
    );
};

// export const deleteIssue = async (req: Request, res: Response) => {
//     const id = req.params.id;

//     const result = await issueService.deleteIssue(Number(id));

//     return sendResponse(res, {
//         message: "Issue deleted successfully",
//         data: result
//     });
// };


// delete
export const deleteIssue = async (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    const issue = await issueService.getIssueByIdRaw(id);

    if (!issue) {
        return sendResponse(
            res,
            {
                success: false,
                message: "Issue not found",
                errors: "Invalid issue id"
            },
            404
        );
    }

    await issueService.deleteIssue(id);

    return sendResponse(
        res,
        {
            success: true,
            message: "Issue deleted successfully"
        },
        200
    );
};


// update
// export const updateIssue = async (req: Request, res: Response) => {
//     const id = req.params.id;

//     const result = await issueService.updateIssue(Number(id), req.body);

//     return sendResponse(res, {
//         message: "Issue updated successfully",
//         data: result
//     });
// };

export const getIssues = async (req: Request, res: Response) => {
    const issues = await issueService.getIssues(req.query);

    return sendResponse(res, {
        message: "Issues updated  successfully",
        data: issues
    });
};

export const getIssueById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const issue = await issueService.getIssueById(id);

    if (!issue) {
        return sendResponse(res, {
            success: false,
            message: "Issue not found",
            errors: "Invalid issue id"
        }, 404);
    }

    return sendResponse(res, {
        message: "Issue updated  successfully",
        data: issue
    });
};

//  Update Issue
export const updateIssueUser = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = req.user!;

    const issue = await issueService.getIssueByIdRaw(id);

    if (!issue) {
        return sendResponse(res, {
            success: false,
            message: "Issue not found",
            errors: "Invalid issue id"
        }, 404);
    }

    const isMaintainer = user.role === "maintainer";

    const isOwner = issue.reporter_id === user.id;
    const isOpen = issue.status === "open";

    if (!isMaintainer && !(isOwner && isOpen)) {
        return sendResponse(res, {
            success: false,
            message: "Forbidden",
            errors: "You are not allowed to update this issue"
        }, 403);
    }

    const updated = await issueService.updateIssueUser(id, req.body);

    return sendResponse(res, {
        message: "Issue updated successfully",
        data: updated
    }, 200);
};