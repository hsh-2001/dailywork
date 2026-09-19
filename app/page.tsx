"use client";

import { redirect } from "next/navigation";


export default function page() {
  redirect("/ot-record");

  return (
    <div>page</div>
  )
}
