import { redirect } from "next/navigation";

/** Rota da V1. O resultado vive na área de trabalho desde a V2. */
export default function ResultadoPage() {
  redirect("/workspace");
}
