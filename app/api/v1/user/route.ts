"use server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const response = await db.insert(usersTable).values({
        username: body.username,
        email: body.email,
        password: body.password,
        phone: body.phone,
    }).returning();
    return new Response(JSON.stringify({ message: "User created successfully", data: response }), { status: 201 });
  } catch (error) {
    console.error("Error occurred:", error);
    return new Response(JSON.stringify({ message: "An error occurred" }), { status: 500 });
  }
}