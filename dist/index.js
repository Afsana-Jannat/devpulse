
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/app.ts
import express from "express";

// src/utils/sendResponse.ts
function sendResponse(res, {
  message,
  data,
  errors,
  success = true
}, status = 200) {
  res.status(status).json({
    success,
    message,
    data: success ? data : void 0,
    errors: success ? void 0 : errors
  });
}

// src/config/index.ts
import dotenv from "dotenv";
import { env } from "process";
dotenv.config({ quiet: true });
var config = {
  port: env.PORT,
  database_url: env.DATABASE_URL,
  node_env: env.NODE_ENV,
  jwt_secret: env.JWT_SECRET
};
var config_default = config;

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return sendResponse(
      res,
      {
        success: false,
        message: "Unauthorized",
        errors: "Token missing"
      },
      401
    );
  }
  try {
    const decoded = jwt.verify(
      token,
      config_default.jwt_secret
    );
    req.user = decoded;
    next();
  } catch {
    return sendResponse(
      res,
      {
        success: false,
        message: "Unauthorized",
        errors: "Invalid token"
      },
      401
    );
  }
};

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal server Error",
    stack: config_default.node_env === "development" && err instanceof Error ? err.stack : void 0
  });
};

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.database_url
});
var initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(75) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20)
    CHECK(role IN('contributor','maintainer'))
    DEFAULT 'contributor',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues(
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30)
    CHECK(type IN('bug','feature_request'))
    NOT NULL,

    status VARCHAR(30)
    CHECK(status IN('open', 'in_progress', 'resolved'))
    DEFAULT 'open',

    reporter_id INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `);
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
  await pool.query(`
    DROP TRIGGER IF EXISTS issues_updated_at ON issues;

   CREATE TRIGGER issues_updated_at
   BEFORE UPDATE ON issues
   FOR EACH ROW
   EXECUTE FUNCTION update_timestamp();
   `);
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
var AuthService = class {
  async createUser(user) {
    const { name, email, role, password } = user;
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
        RETURNING id, name, email, role, created_at, updated_at
        `,
      [name, email, hash, role]
    );
    return res.rows[0];
  }
  async validateUser(email, password) {
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
    const { password: _, ...user } = dbUser;
    return user;
  }
};
var auth_service_default = new AuthService();

// src/utils/jwt.ts
import jwt2 from "jsonwebtoken";
var signToken = (payload) => {
  return jwt2.sign(
    payload,
    config_default.jwt_secret,
    {
      expiresIn: "1d"
    }
  );
};

// src/modules/auth/auth.controller.ts
var signup = async (req, res) => {
  const user = await auth_service_default.createUser(req.body);
  if (!user) {
    sendResponse(res, { success: false, message: "Failed to Create user" }, 400);
    return;
  }
  sendResponse(res, { message: "User registered successfully", data: user }, 201);
};
var login = async (req, res) => {
  const { email, password } = req.body;
  const user = await auth_service_default.validateUser(email, password);
  if (!user) {
    return sendResponse(
      res,
      {
        success: false,
        message: "Invalid email or password",
        errors: "Authentication failed"
      },
      401
    );
  }
  const token = signToken({
    id: user.id,
    name: user.name,
    role: user.role
  });
  return sendResponse(res, {
    message: "Login successful",
    data: {
      token,
      user
    }
  }, 200);
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", () => {
});
router.put("/update/:id", () => {
});
router.delete("/delete/:id", () => {
});
var auth_route_default = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issue/issue.service.ts
var IssueService = class {
  async createIssue(issue) {
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
  async deleteIssue(id) {
    const result = await pool.query(
      `DELETE FROM issues WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
  async updateIssue(id, data) {
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
  async getIssues(query) {
    const { sort = "newest", type, status } = query;
    let baseQuery = `SELECT * FROM issues`;
    const conditions = [];
    const values = [];
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
    baseQuery += sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
    const issuesResult = await pool.query(baseQuery, values);
    const issues = issuesResult.rows;
    const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
    const usersResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = ANY($1)`,
      [reporterIds]
    );
    const users = usersResult.rows;
    const userMap = /* @__PURE__ */ new Map();
    users.forEach((u) => userMap.set(u.id, u));
    const final = issues.map((issue) => ({
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
  async getIssueById(id) {
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
  async getIssueByIdRaw(id) {
    const res = await pool.query(
      `SELECT * FROM issues WHERE id = $1`,
      [id]
    );
    return res.rows[0];
  }
  async updateIssueUser(id, data) {
    const { title, description, type } = data;
    const result = await pool.query(
      `UPDATE issues
             SET title = $1,
                 description = $2,
                 type = $3,
                 status = 'in_progress',
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
      [title, description, type, id]
    );
    return result.rows[0];
  }
};
var issue_service_default = new IssueService();

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  const issue = await issue_service_default.createIssue({
    ...req.body,
    reporter_id: req.user.id
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
var deleteIssue = async (req, res) => {
  const id = Number(req.params.id);
  const issue = await issue_service_default.getIssueByIdRaw(id);
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
  await issue_service_default.deleteIssue(id);
  return sendResponse(
    res,
    {
      success: true,
      message: "Issue deleted successfully"
    },
    200
  );
};
var getIssues = async (req, res) => {
  const issues = await issue_service_default.getIssues(req.query);
  return sendResponse(res, {
    message: "Issues updated  successfully",
    data: issues
  });
};
var getIssueById = async (req, res) => {
  const id = Number(req.params.id);
  const issue = await issue_service_default.getIssueById(id);
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
var updateIssueUser = async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user;
  const issue = await issue_service_default.getIssueByIdRaw(id);
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
  const updated = await issue_service_default.updateIssueUser(id, req.body);
  return sendResponse(res, {
    message: "Issue updated successfully",
    data: updated
  }, 200);
};

// src/middleware/role.ts
var roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return sendResponse(res, {
        success: false,
        message: "Unauthorized",
        errors: "User not found in request"
      }, 401);
    }
    if (!allowedRoles.includes(user.role)) {
      return sendResponse(res, {
        success: false,
        message: "Forbidden",
        errors: "You do not have permission"
      }, 403);
    }
    next();
  };
};

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.get("/", getIssues);
router2.get("/:id", getIssueById);
router2.patch("/:id", auth, updateIssueUser);
router2.post("/", auth, createIssue);
router2.delete("/:id", auth, roleGuard(["maintainer"]), deleteIssue);
var issue_route_default = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("hlw");
});
app.use("/api/auth", auth_route_default);
app.use("/api/issues", issue_route_default);
app.use(globalErrorHandler);
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
var app_default = app;

// src/index.ts
var main = async () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`server is running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=index.js.map