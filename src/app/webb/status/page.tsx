import { redirect } from "next/navigation";

export default function WebBStatusPage() {
  redirect("/webb/student?view=exam#exam-list");
}

