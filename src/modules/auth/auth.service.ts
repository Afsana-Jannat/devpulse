
import { pool } from "../../db";
import type { RUser } from "../../types";
import bcrypt from "bcrypt"

class AuthService {
    async createUser(user: RUser & { password: string }) {
        const { name, email, role, password } = user

        const hash = await bcrypt.hash(password, 10);

        const res = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
        RETURNING id, name, email, role, created_at, updated_at
        `,
            [name, email, hash, role]
        );
        return res.rows[0];
    }
}


export default new AuthService();