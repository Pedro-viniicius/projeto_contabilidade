import { redirect } from "next/navigation";

/** O feedback virou painel lateral dentro da área de trabalho. */
export default function FeedbackPage() {
  redirect("/workspace?painel=feedback");
}
