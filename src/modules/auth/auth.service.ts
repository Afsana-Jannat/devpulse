
import { pool } from "../../db";
import type { RUser, User } from "../../types";
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

    async validateUser(email: string, password: string) {
        const res = await pool.query(
            `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1`,
            [email]
        );

        if (!res.rows.length) {
            return null;
        }

        const dbUser = res.rows[0];

        const isValid = await bcrypt.compare(
            password,
            dbUser.password
        );

        if (!isValid) {
            return null;
        }
        const { password: _, ...user } = dbUser
        return user;
    }
}

export default new AuthService();