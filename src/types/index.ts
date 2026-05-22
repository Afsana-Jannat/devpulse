export const role = ["contributor", "maintainer"] as const

type Role = typeof role[number]

export type User = {
    id: number,
    name: string,
    email: string,
    password: string,
    role: Role,
    created_at: Date,
    updated_at: Date
}

export type RUser = Omit<User, "id" | "created_at" | "updated_at" | "password">

export type Issue = {
    id: number,
    title: string,
    description: string,
    type: Role,
    status: Role,
    reporter_id: number,
    created_at: Date,
    updated_at: Date
}