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
}

export default new IssueService();