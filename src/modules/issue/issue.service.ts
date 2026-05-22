import { pool } from "../../db";

class IssueService {
    async createIssue(issue: {
        title: string;
        description: string;
        type: string;
        reporter_id: number;
    }) {

        const {
            title,
            description,
            type,
            reporter_id
        } = issue;

        const result = await pool.query(
            `
            INSERT INTO issues
            (
                title,
                description,
                type,
                reporter_id
            )
            VALUES($1,$2,$3,$4)

            RETURNING *
            `,
            [
                title,
                description,
                type,
                reporter_id
            ]
        );

        return result.rows[0];
    }

    async deleteIssue(id: number) {
        const result = await pool.query(
            `DELETE FROM issues WHERE id = $1 RETURNING *`,
            [id]
        );

        return result.rows[0];
    }
    async updateIssue(id: number, data: any) {
        const { title, description, type } = data;

        const result = await pool.query(
            `UPDATE issues
             SET title=$1, description=$2, type=$3
             WHERE id=$4
             RETURNING *`,
            [title, description, type, id]
        );

        return result.rows[0];
    }
    async getIssues(query: any) {
        const { sort = "newest", type, status } = query;

        let baseQuery = `SELECT * FROM issues`;
        const conditions: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (type) {
            conditions.push(`type = $${idx++}`);
            values.push(type);
        }

        if (status) {
            conditions.push(`status = $${idx++}`);
            values.push(status);
        }

        if (conditions.length) {
            baseQuery += ` WHERE ` + conditions.join(" AND ");
        }

        baseQuery += sort === "oldest"
            ? ` ORDER BY created_at ASC`
            : ` ORDER BY created_at DESC`;

        const issuesResult = await pool.query(baseQuery, values);
        const issues = issuesResult.rows;

        const reporterIds = [...new Set(issues.map(i => i.reporter_id))];

        const usersResult = await pool.query(
            `SELECT id, name, role FROM users WHERE id = ANY($1)`,
            [reporterIds]
        );

        const users = usersResult.rows;

        const userMap = new Map();
        users.forEach(u => userMap.set(u.id, u));

        const final = issues.map(issue => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: userMap.get(issue.reporter_id),
            created_at: issue.created_at,
            updated_at: issue.updated_at
        }));
        return final;
    }

    async getIssueById(id: number) {

        const issueResult = await pool.query(
            `SELECT * FROM issues WHERE id = $1`,
            [id]
        );

        if (!issueResult.rows.length) {
            return null;
        }

        const issue = issueResult.rows[0];

        const userResult = await pool.query(
            `SELECT id, name, role FROM users WHERE id = $1`,
            [issue.reporter_id]
        );

        const reporter = userResult.rows[0];

        return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter,
            created_at: issue.created_at,
            updated_at: issue.updated_at
        };
    }
}

export default new IssueService();